const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getToken, sendPayments, sendPaymentsOtp, verifyOtp } = require('./abbService');
const {
  createTable,
  getTables,
  getTableById,
  addCustomer,
  addItem,
  updateItem,
  updateCustomer,
  computePaymentDetails,
  generateCustomerLinks,
  addTableNote,
  getConfig,
  updateConfig,
} = require('./dataStore');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

app.post('/api/config', (req, res) => {
  const { tablesCount, menu } = req.body;
  if (tablesCount != null && tablesCount > 0) {
    updateConfig({ tablesCount });
  }
  if (menu && Array.isArray(menu)) {
    updateConfig({ menu });
  }
  res.json(getConfig());
});

app.post('/api/auth/token', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const token = await getToken(username, password);
    res.json({ token });
  } catch (error) {
    console.error('Token error', error.message);
    const message = error.response?.data || error.message || 'Unable to get token';
    res.status(error.response?.status || 500).json({ error: message });
  }
});

app.get('/api/tables', (req, res) => {
  res.json(getTables());
});

app.post('/api/tables', (req, res) => {
  const { tableNumber } = req.body;
  if (!tableNumber) {
    return res.status(400).json({ error: 'tableNumber is required' });
  }
  const table = createTable(tableNumber);
  res.status(201).json(table);
});

app.get('/api/tables/:tableId', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }
  res.json(table);
});

app.post('/api/tables/:tableId/customers', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const customer = addCustomer(table.id, req.body.name);
  res.status(201).json(customer);
});

app.post('/api/tables/:tableId/items', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const { name, price, customerId, description } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const item = addItem(table.id, { name, price, customerId, description });
  res.status(201).json(item);
});

app.patch('/api/tables/:tableId/items/:itemId', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const item = updateItem(table.id, req.params.itemId, req.body);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.patch('/api/tables/:tableId/customers/:customerId', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const customer = updateCustomer(table.id, req.params.customerId, req.body);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

app.post('/api/tables/:tableId/note', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const note = addTableNote(table.id, req.body.note || '');
  res.json({ note });
});

app.get('/api/tables/:tableId/summary', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  res.json(computePaymentDetails(table));
});

app.post('/api/tables/:tableId/generate', (req, res) => {
  const table = getTableById(req.params.tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  const links = generateCustomerLinks(table.id);
  res.json({ links });
});

app.post('/api/abb/pay', async (req, res) => {
  try {
    const { tableId, token, merchantAccount, requireOtp } = req.body;
    if (!tableId || !token || !merchantAccount) {
      return res.status(400).json({ error: 'tableId, token, and merchantAccount are required' });
    }
    const table = getTableById(tableId);
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const details = computePaymentDetails(table);
    const paymentFile = details.base64PaymentFile;
    const externalReference = `split-${table.tableNumber}-${Date.now()}`;

    const payload = requireOtp
      ? await sendPaymentsOtp(token, paymentFile, externalReference)
      : await sendPayments(token, paymentFile, externalReference);

    res.json({ batchNumber: payload.data?.data?.batchNumber || payload.data || null, raw: payload.data });
  } catch (error) {
    console.error('ABB pay error', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/abb/verify-otp', async (req, res) => {
  try {
    const { token, batchNumber, otpCode } = req.body;
    if (!token || !batchNumber || !otpCode) {
      return res.status(400).json({ error: 'token, batchNumber, and otpCode are required' });
    }
    const payload = await verifyOtp(token, batchNumber, otpCode);
    res.json(payload.data);
  } catch (error) {
    console.error('Verify OTP error', error.message, error.response?.data);
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/config')) {
    res.sendFile(path.join(__dirname, 'frontend', 'config.html'));
  } else {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Split app running on http://localhost:${PORT}`);
});
