const statusBox = document.getElementById('statusBox');
const tokenDisplay = document.getElementById('tokenDisplay');
const tableGrid = document.getElementById('tableGrid');
const customerList = document.getElementById('customerList');
const itemSelect = document.getElementById('itemSelect');
const itemCustomer = document.getElementById('itemCustomer');
const orderItems = document.getElementById('orderItems');
const tableSummary = document.getElementById('tableSummary');
const paymentLinks = document.getElementById('paymentLinks');

let currentTableId = null;
let currentToken = '';
let currentTable = null;
let config = { tablesCount: 10, menu: [] };

function updateStatus(message) {
  statusBox.textContent = message;
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

async function loadTables() {
  try {
    const tables = await api('/api/tables');
    const configData = await api('/api/config');
    config = configData;
    tableGrid.innerHTML = Array.from({ length: config.tablesCount }, (_, i) => {
      const tableNum = i + 1;
      const table = tables.find(t => t.tableNumber == tableNum);
      return `<div class="table-card" data-table="${tableNum}"><img src="https://via.placeholder.com/60x60?text=Table${tableNum}" alt="Table ${tableNum}" /><span>Table ${tableNum}</span></div>`;
    }).join('');
    document.querySelectorAll('.table-card').forEach(card => {
      card.addEventListener('click', () => loadTableByNumber(card.dataset.table));
    });
  } catch (error) {
    console.error(error);
    updateStatus('Unable to load tables');
  }
}

async function createTable() {
  const tableNumber = document.getElementById('tableNumber').value.trim();
  if (!tableNumber) return updateStatus('Provide a table number');
  const table = await api('/api/tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableNumber }),
  });
  currentTableId = table.id;
  await loadTables();
  document.getElementById('tableNumber').value = '';
  updateStatus(`Created Table ${table.tableNumber}`);
}

async function loadTableByNumber(tableNumber) {
  try {
    const tables = await api('/api/tables');
    const table = tables.find(t => t.tableNumber == tableNumber);
    if (!table) {
      // Create if not exists
      const newTable = await api('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber }),
      });
      currentTableId = newTable.id;
    } else {
      currentTableId = table.id;
    }
    const tableData = await api(`/api/tables/${currentTableId}`);
    currentTable = tableData;
    renderCustomers();
    renderItems();
    renderSummary(tableData);
    updateStatus(`Loaded Table ${tableNumber}`);
  } catch (error) {
    console.error(error);
    updateStatus('Unable to load table');
  }
}

function renderCustomers() {
  if (!currentTable) return;
  customerList.innerHTML = currentTable.customers.length
    ? currentTable.customers.map((customer) => `<div class="list-item"><strong>${customer.name}</strong><div>ID: ${customer.id}</div></div>`).join('')
    : '<div class="list-item">No customers added yet.</div>';
  itemCustomer.innerHTML = `<option value="">Unassigned</option>` + currentTable.customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('');
}

function renderItems() {
  if (!currentTable) return;
  orderItems.innerHTML = currentTable.items.length
    ? currentTable.items.map((item) => {
        const assignee = currentTable.customers.find((customer) => customer.id === item.customerId);
        return `<div class="list-item"><strong>${item.name}</strong> — ${item.price.toFixed(2)} AZN<br>${item.description || ''}<br><small>Assigned to: ${assignee ? assignee.name : 'Unassigned'}</small></div>`;
      }).join('')
    : '<div class="list-item">No order items added yet.</div>';
}

function renderSummary(table) {
  if (!currentTableId) return;
  const summary = api(`/api/tables/${currentTableId}/summary`).then((data) => {
    tableSummary.innerHTML = `
      <p><strong>Table:</strong> ${data.tableNumber}</p>
      <p><strong>Total amount:</strong> ${data.total.toFixed(2)} AZN</p>
      <p><strong>Unassigned items:</strong> ${data.unassigned.toFixed(2)} AZN</p>
      ${data.customerPayments.map((customer) => `<div class="payment-card"><div><h3>${customer.name}</h3><p>${customer.amount.toFixed(2)} AZN</p></div></div>`).join('')}
    `;
    return data;
  }).catch((error) => {
    tableSummary.innerHTML = '<p>Unable to compute summary.</p>';
    console.error(error);
  });
}

async function addCustomer() {
  if (!currentTableId) return updateStatus('Load a table first');
  const name = document.getElementById('customerName').value.trim();
  if (!name) return updateStatus('Enter a customer name');
  await api(`/api/tables/${currentTableId}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  await loadTable();
  document.getElementById('customerName').value = '';
  updateStatus(`Added ${name}`);
}

async function addItem() {
  if (!currentTableId) return updateStatus('Load a table first');
  const itemId = itemSelect.value;
  const customerId = itemCustomer.value || null;
  if (!itemId) return updateStatus('Select an item from menu');
  const menuItem = config.menu.find(m => m.id === itemId);
  if (!menuItem) return updateStatus('Invalid menu item');
  await api(`/api/tables/${currentTableId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: menuItem.name, price: menuItem.price, customerId }),
  });
  await loadTableByNumber(currentTable.tableNumber);
  updateStatus(`Added ${menuItem.name}`);
}

async function getToken() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return updateStatus('Enter bank username and password');
  const result = await api('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  currentToken = result.token;
  tokenDisplay.textContent = currentToken || 'No token returned';
  updateStatus('Token retrieved');
}

async function generateLinks() {
  if (!currentTableId) return updateStatus('Load a table first');
  const result = await api(`/api/tables/${currentTableId}/generate`, { method: 'POST' });
  paymentLinks.innerHTML = result.links.length
    ? result.links.map((link) => `<div class="link-card"><div><h3>${link.name}</h3><p>${link.amount.toFixed(2)} AZN</p><a href="${link.link}" target="_blank">Open payment page</a></div><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + link.link)}" alt="QR code" /></div>`).join('')
    : '<div class="list-item">No payment links generated.</div>';
  updateStatus('QR payment links created');
}

async function submitToBank(requireOtp = false) {
  if (!currentTableId) return updateStatus('Load a table first');
  if (!currentToken) return updateStatus('Get ABB token first');
  const merchantAccount = document.getElementById('merchantAccount').value.trim();
  if (!merchantAccount) return updateStatus('Provide a merchant account IBAN');
  const payload = {
    token: currentToken,
    tableId: currentTableId,
    merchantAccount,
    requireOtp,
  };
  const result = await api('/api/abb/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  updateStatus(`Payment request sent. batchNumber=${result.batchNumber || 'unknown'}`);
}

async function init() {
  document.getElementById('btnAddCustomer').addEventListener('click', addCustomer);
  document.getElementById('btnAddItem').addEventListener('click', addItem);
  document.getElementById('btnGetToken').addEventListener('click', getToken);
  document.getElementById('btnGenerateLinks').addEventListener('click', generateLinks);
  document.getElementById('btnSubmitToBank').addEventListener('click', () => submitToBank(false));
  document.getElementById('btnSubmitToBankOtp').addEventListener('click', () => submitToBank(true));
  await loadTables();
  itemSelect.innerHTML = config.menu.map((item) => `<option value="${item.id}">${item.name} — ${item.price.toFixed(2)} AZN</option>`).join('');
}

init().catch((error) => {
  console.error(error);
  updateStatus('Startup error');
});
