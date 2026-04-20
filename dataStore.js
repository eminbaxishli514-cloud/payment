const { v4: uuid } = require('uuid');

const tables = new Map();
let restaurantConfig = {
  tablesCount: 10,
  menu: [
    { id: 'meal1', name: 'Meal 1', price: 5.0 },
    { id: 'meal2', name: 'Meal 2', price: 3.0 },
  ],
};

function getConfig() {
  return restaurantConfig;
}

function updateConfig(newConfig) {
  restaurantConfig = { ...restaurantConfig, ...newConfig };
  return restaurantConfig;
}

function createTable(tableNumber) {
  const id = uuid();
  const table = {
    id,
    tableNumber,
    createdAt: new Date().toISOString(),
    note: '',
    customers: [],
    items: [],
  };
  tables.set(id, table);
  return table;
}

function getTables() {
  return Array.from(tables.values()).map((table) => ({
    id: table.id,
    tableNumber: table.tableNumber,
    customerCount: table.customers.length,
    itemCount: table.items.length,
    totalAmount: computePaymentDetails(table).total,
  }));
}

function getTableById(tableId) {
  return tables.get(tableId) || null;
}

function addCustomer(tableId, name) {
  const table = getTableById(tableId);
  if (!table) return null;
  const customer = { id: uuid(), name: name || `Customer ${table.customers.length + 1}` };
  table.customers.push(customer);
  return customer;
}

function updateCustomer(tableId, customerId, update) {
  const table = getTableById(tableId);
  if (!table) return null;
  const customer = table.customers.find((item) => item.id === customerId);
  if (!customer) return null;
  if (update.name) customer.name = update.name;
  return customer;
}

function addItem(tableId, { name, price, customerId, description }) {
  const table = getTableById(tableId);
  if (!table) return null;
  const item = {
    id: uuid(),
    name,
    price: Number(price),
    customerId: customerId || null,
    description: description || '',
  };
  table.items.push(item);
  return item;
}

function updateItem(tableId, itemId, update) {
  const table = getTableById(tableId);
  if (!table) return null;
  const item = table.items.find((entry) => entry.id === itemId);
  if (!item) return null;
  if (update.name) item.name = update.name;
  if (update.price != null) item.price = Number(update.price);
  if (update.customerId !== undefined) item.customerId = update.customerId;
  if (update.description !== undefined) item.description = update.description;
  return item;
}

function addTableNote(tableId, note) {
  const table = getTableById(tableId);
  if (!table) return null;
  table.note = note;
  return note;
}

function computePaymentDetails(table) {
  const totals = table.customers.reduce((acc, customer) => {
    acc[customer.id] = { customer, items: [], subtotal: 0 };
    return acc;
  }, {});

  table.items.forEach((item) => {
    const assigned = item.customerId && totals[item.customerId];
    if (assigned) {
      assigned.items.push(item);
      assigned.subtotal += item.price;
    } else {
      const key = '__unassigned';
      totals[key] = totals[key] || { customer: null, items: [], subtotal: 0 };
      totals[key].items.push(item);
      totals[key].subtotal += item.price;
    }
  });

  const customerPayments = table.customers.map((customer) => {
    const record = totals[customer.id] || { items: [], subtotal: 0 };
    return {
      customerId: customer.id,
      name: customer.name,
      items: record.items,
      amount: Number(record.subtotal.toFixed(2)),
    };
  });

  const total = Number(table.items.reduce((sum, item) => sum + item.price, 0).toFixed(2));
  const unassigned = totals['__unassigned'] ? Number(totals['__unassigned'].subtotal.toFixed(2)) : 0;
  const base64PaymentFile = buildPaymentFile(table, customerPayments);
  return { tableId: table.id, tableNumber: table.tableNumber, total, unassigned, customerPayments, base64PaymentFile };
}

function buildPaymentFile(table, customerPayments) {
  const paymentsXml = customerPayments
    .map((payment, index) => {
      return `<payment>
  <paymentId>${payment.customerId}</paymentId>
  <beneficiaryName>${escapeXml(payment.name)}</beneficiaryName>
  <amount>${payment.amount.toFixed(2)}</amount>
  <currency>AZN</currency>
  <description>Table ${table.tableNumber} share for ${payment.name}</description>
  <items>${payment.items.map((item) => `<item><name>${escapeXml(item.name)}</name><price>${item.price.toFixed(2)}</price></item>`).join('')}</items>
</payment>`;
    })
    .join('\n');
  const documentXml = `<paymentDocument>
  <tableNumber>${escapeXml(table.tableNumber)}</tableNumber>
  <note>${escapeXml(table.note || '')}</note>
  <payments>
${paymentsXml}
  </payments>
</paymentDocument>`;
  return Buffer.from(documentXml, 'utf8').toString('base64');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateCustomerLinks(tableId) {
  const table = getTableById(tableId);
  if (!table) return [];
  const summary = computePaymentDetails(table);
  return summary.customerPayments.map((payment) => ({
    customerId: payment.customerId,
    name: payment.name,
    amount: payment.amount,
    link: `/pay.html?tableId=${encodeURIComponent(table.id)}&customerId=${encodeURIComponent(payment.customerId)}`,
  }));
}

module.exports = {
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
};
