const menuList = document.getElementById('menuList');

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

async function loadConfig() {
  try {
    const config = await api('/api/config');
    document.getElementById('tablesCount').value = config.tablesCount;
    renderMenu(config.menu);
  } catch (error) {
    console.error(error);
    alert('Failed to load config');
  }
}

function renderMenu(menu) {
  menuList.innerHTML = menu.length
    ? menu.map((item) => `<div class="list-item"><strong>${item.name}</strong> — ${item.price.toFixed(2)} AZN</div>`).join('')
    : '<div class="list-item">No menu items added yet.</div>';
}

async function saveConfig() {
  const tablesCount = parseInt(document.getElementById('tablesCount').value);
  if (!tablesCount || tablesCount < 1) {
    alert('Enter a valid number of tables');
    return;
  }
  try {
    await api('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tablesCount }),
    });
    alert('Configuration saved');
  } catch (error) {
    console.error(error);
    alert('Failed to save config');
  }
}

async function addMenuItem() {
  const name = document.getElementById('menuName').value.trim();
  const price = parseFloat(document.getElementById('menuPrice').value);
  if (!name || isNaN(price)) {
    alert('Enter valid name and price');
    return;
  }
  try {
    const config = await api('/api/config');
    const newMenu = [...config.menu, { id: `item${Date.now()}`, name, price }];
    await api('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu: newMenu }),
    });
    document.getElementById('menuName').value = '';
    document.getElementById('menuPrice').value = '';
    loadConfig();
  } catch (error) {
    console.error(error);
    alert('Failed to add menu item');
  }
}

function goToDashboard() {
  window.location.href = '/';
}

document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
document.getElementById('btnAddMenuItem').addEventListener('click', addMenuItem);
document.getElementById('btnGoToDashboard').addEventListener('click', goToDashboard);

loadConfig();