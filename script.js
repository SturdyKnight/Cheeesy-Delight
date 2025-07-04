// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDHyrO3YK0JI1wa6I1XQtcTh8asp2p992A",
  authDomain: "cheesydelight-80a43.firebaseapp.com",
  databaseURL: "https://cheesydelight-80a43-default-rtdb.firebaseio.com",
  projectId: "cheesydelight-80a43",
  storageBucket: "cheesydelight-80a43.appspot.com",
  messagingSenderId: "433558050592",
  appId: "1:433558050592:web:169b277e2337931475e945"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const sessionId = new URLSearchParams(window.location.search).get('session');
const customerName = localStorage.getItem('cheesy_name');
const tableNumber = localStorage.getItem('cheesy_table');
let cart = [];

// ✅ Toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ✅ Render Menu Item
function renderMenuItem(category, itemId, itemData) {
  const section = document.getElementById(category);
  if (!section) return;

  const existing = document.getElementById(`menu-${itemId}`);
  if (existing) existing.remove();

  const itemDiv = document.createElement('div');
  itemDiv.className = 'menu-item';
  itemDiv.id = `menu-${itemId}`;

  let controlsHTML = '';

  const safeName = itemData.name?.replace(/'/g, "\\'");

  // 👉 COMBO item
// 👉 COMBO item
if (category === 'combos' && itemData.items && Array.isArray(itemData.items)) {
  const comboQty = cart.find(i => i.id === itemId)?.qty || 0;
  const mid = Math.ceil(itemData.items.length / 2);
  const part1 = itemData.items.slice(0, mid);
  const part2 = itemData.items.slice(mid);

  const renderPart = (items) => {
    return items.map(i => `
      <div style="text-align:center; width:90px;">
        <img src="${i.image}" alt="${i.name}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; margin-bottom: 4px;" />
        <div style="font-size: 12px;">${i.name}</div>
      </div>
    `).join('');
  };

  const comboImagesHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; flex-direction: row; margin-bottom: 12px;">
      <div style="display:flex; gap:12px; flex-wrap: wrap; justify-content: center;">${renderPart(part1)}</div>
      <div style="font-size: 26px; font-weight: bold;">+</div>
      <div style="display:flex; gap:12px; flex-wrap: wrap; justify-content: center;">${renderPart(part2)}</div>
    </div>
  `;

  const controlsHTML = comboQty === 0
    ? `<button class="add-btn" onclick="addToCart('${itemId}', '${safeName}', ${itemData.price})">Add</button>`
    : `<div class="qty-controls">
         <button onclick="updateQuantity('${itemId}', -1)">−</button>
         <span>${comboQty}</span>
         <button onclick="updateQuantity('${itemId}', 1, '${safeName}', ${itemData.price})">+</button>
       </div>`;

  itemDiv.innerHTML = `
    ${comboImagesHTML}
    <div class="menu-info" style="text-align:center;">
      <p><strong style="font-size: 16px;">${itemData.name}</strong></p>
      <p style="margin: 6px 0; font-weight: 500;">Meal Price: ₹${itemData.price}</p>
      ${controlsHTML}
    </div>
  `;
  section.appendChild(itemDiv);
  return;
}


  // 🍕 Pizza
  if (itemData.type === 'pizza') {
    const sizes = [
      { label: '7"', suffix: '_7', price: itemData.size7 },
      { label: '10"', suffix: '_10', price: itemData.size10 }
    ];

    controlsHTML = sizes.map(size => {
      const fullId = itemId + size.suffix;
      const cartItem = cart.find(i => i.id === fullId);
      const qty = cartItem ? cartItem.qty : 0;
      return `
        <div style="margin: 6px 0;">
          <div style="font-size: 14px; margin-bottom: 4px;">${size.label} - ₹${size.price}</div>
          <div class="qty-controls">
            <button onclick="updateQuantity('${fullId}', -1)">−</button>
            <span>${qty}</span>
            <button onclick="updateQuantity('${fullId}', 1, '${safeName}', ${size.price})">+</button>
          </div>
        </div>
      `;
    }).join('');
  }
  // 🍜 Noodles
  else if (itemData.type === 'noodles') {
    const sizes = [
      { label: 'Half', suffix: '_half', price: itemData.half },
      { label: 'Full', suffix: '_full', price: itemData.full }
    ];

    controlsHTML = sizes.map(size => {
      const fullId = itemId + size.suffix;
      const cartItem = cart.find(i => i.id === fullId);
      const qty = cartItem ? cartItem.qty : 0;
      return `
        <div style="margin: 6px 0;">
          <div style="font-size: 14px; margin-bottom: 4px;">${size.label} - ₹${size.price}</div>
          <div class="qty-controls">
            <button onclick="updateQuantity('${fullId}', -1)">−</button>
            <span>${qty}</span>
            <button onclick="updateQuantity('${fullId}', 1, '${safeName} (${size.label})', ${size.price})">+</button>
          </div>
        </div>
      `;
    }).join('');
  }
  // 🧁 Regular items
  else {
    const cartItem = cart.find(i => i.id === itemId);
    const qty = cartItem ? cartItem.qty : 0;
    controlsHTML = qty === 0
      ? `<button class="add-btn" onclick="addToCart('${itemId}', '${safeName}', ${itemData.price})">Add</button>`
      : `<div class="qty-controls">
           <button onclick="updateQuantity('${itemId}', -1)">−</button>
           <span>${qty}</span>
           <button onclick="updateQuantity('${itemId}', 1, '${safeName}', ${itemData.price})">+</button>
         </div>`;
  }

  itemDiv.innerHTML = `
    <div class="menu-image-box">
      <img src="${itemData.image || 'https://via.placeholder.com/100'}" alt="${itemData.name}" />
    </div>
    <div class="menu-info">
      <p><strong>${itemData.name}</strong></p>
      <div id="qty-${itemId}">${controlsHTML}</div>
    </div>
  `;
  section.appendChild(itemDiv);
}

// ✅ Quantity Handling
function addToCart(id, name, price) {
  cart.push({ id, name, price, qty: 1 });
  updateCart();
  loadMenu();
  showToast(`✅ 1 ${name} added`);
}

function updateQuantity(id, delta, name, price) {
  const item = cart.find(i => i.id === id);
  if (!item && delta > 0) {
    cart.push({ id, name, price, qty: 1 });
  } else if (item) {
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  }
  updateCart();
  loadMenu();
}

// ✅ Cart UI
function updateCart() {
  const cartItems = document.getElementById('cart-items');
  const total = document.getElementById('total');
  cartItems.innerHTML = '';
  let sum = 0;

  cart.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `${item.name} × ${item.qty} - ₹${item.price * item.qty}
      <button onclick="updateQuantity('${item.id}', -1)">×</button>`;
    cartItems.appendChild(li);
    sum += item.price * item.qty;
  });

  total.textContent = sum;
  document.getElementById('order-btn').disabled = cart.length === 0;
}

// ✅ Menu Loader
function loadMenu() {
  const preferredOrder = ['starters', 'main-course', 'desserts', 'drinks'];

  db.ref("menu").on("value", (snapshot) => {
    const menu = snapshot.val();
    if (!menu) return;

    const menuSection = document.getElementById("menu-section");
    menuSection.innerHTML = "";

    const allCategories = Object.keys(menu);
    const orderedCategories = [
      ...preferredOrder.filter(cat => allCategories.includes(cat)),
      ...allCategories.filter(cat => !preferredOrder.includes(cat))
    ];

    orderedCategories.forEach(category => {
      const sectionTitle = category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const section = document.createElement("div");
      section.innerHTML = `<h2>${sectionTitle}</h2><div class="menu-category" id="${category}"></div>`;
      menuSection.appendChild(section);

      const items = menu[category];
      if (items) {
        for (let itemId in items) {
          renderMenuItem(category, itemId, items[itemId]);
        }
      }
    });
  });
}

// ✅ Place Order
function orderNow() {
  if (!cart.length) return;

  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const prev = snapshot.val();
    const allItems = prev ? [...prev.items, ...cart] : [...cart];

    const merged = {};
    allItems.forEach(item => {
      const key = item.id;
      if (!merged[key]) merged[key] = { ...item };
      else merged[key].qty += item.qty;
    });

    const finalItems = Object.values(merged);
    const newTotal = finalItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    db.ref('orders/' + sessionId).set({
      orderId: sessionId,
      name: customerName,
      table: tableNumber,
      items: finalItems,
      total: newTotal,
      timestamp: new Date().toISOString(),
      status: 'preparing'
    });

    db.ref(`orders/${sessionId}/updates`).push({
      timestamp: new Date().toISOString(),
      added: [...cart],
      total: newTotal
    });

    cart = [];
    updateCart();
    loadMenu();
    showToast("🧾 Order sent to kitchen");
  });
}

// ✅ Checkout
function checkout() {
  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const order = snapshot.val();
    if (!order || order.status !== 'done') {
      showToast("⌛ Order not ready yet");
      return;
    }

    const dateStr = new Date(order.timestamp).toLocaleString();
    let receipt = `      Cheesy Delight\n-----------------------------\n`;
    receipt += `Name: ${order.name}\nTable: ${order.table}\nDate: ${dateStr}\n-----------------------------\n`;
    order.items.forEach(item => {
      receipt += `${item.name.padEnd(16)} ₹${item.price} × ${item.qty} = ₹${item.price * item.qty}\n`;
    });
    receipt += `-----------------------------\nTOTAL: ₹${order.total}\n-----------------------------\n      Thank you! Visit again`;

    const receiptDiv = document.createElement('div');
    receiptDiv.style.padding = '20px';
    receiptDiv.style.fontFamily = 'monospace';
    receiptDiv.style.whiteSpace = 'pre-wrap';
    receiptDiv.style.fontSize = '12px';
    receiptDiv.style.width = '250px';
    receiptDiv.innerText = receipt;
    document.body.appendChild(receiptDiv);

    html2canvas(receiptDiv).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [260, 400] });
      pdf.addImage(imgData, 'PNG', 5, 5, 250, 360);
      pdf.save(`Cheesy_Delight_Receipt_${sessionId}.pdf`);
      document.body.removeChild(receiptDiv);
      localStorage.clear();
      setTimeout(() => window.location.href = "index.html", 2000);
    });
  });
}

// ✅ Kitchen Status Watcher
function listenForKitchenUpdate() {
  db.ref('orders/' + sessionId).on('value', snapshot => {
    const order = snapshot.val();
    if (order && order.status === 'done') {
      document.getElementById('checkout-btn').disabled = false;
      document.getElementById('order-btn').disabled = true;
      showToast("🍽 Order marked as done");
    } else {
      document.getElementById('checkout-btn').disabled = true;
    }
  });
}

// ✅ Init
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  updateCart();
  listenForKitchenUpdate();
  document.getElementById('order-btn').addEventListener('click', orderNow);
  document.getElementById('checkout-btn').addEventListener('click', checkout);
});
