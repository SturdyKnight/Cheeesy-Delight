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

// ✅ Session Handling
const sessionId = new URLSearchParams(window.location.search).get('session');
const customerName = localStorage.getItem('cheesy_name');
const tableNumber = localStorage.getItem('cheesy_table');
const categories = ['starters', 'main-course', 'desserts', 'drinks'];
let cart = [];

// ✅ Audio
const userAudio = new Audio('user.mp3');

// ✅ Toast Creator
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ✅ Menu Rendering
function renderMenuItem(category, itemId, itemData) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'menu-item';
  const cartItem = cart.find(i => i.id === itemId);
  const qty = cartItem ? cartItem.qty : 0;

  itemDiv.innerHTML = `
    <div class="menu-image-box">
      <img src="${itemData.image || 'https://via.placeholder.com/100'}" alt="${itemData.name}" />
    </div>
    <div class="menu-info">
      <p><strong>${itemData.name}</strong><br>₹${itemData.price}</p>
      <div id="qty-${itemId}">
        ${
          qty === 0
            ? `<button class="add-btn" onclick="addToCart('${itemId}', '${itemData.name}', ${itemData.price})">Add</button>`
            : `<div class="qty-controls">
                <button onclick="updateQuantity('${itemId}', -1)">−</button>
                <span>${qty}</span>
                <button onclick="updateQuantity('${itemId}', 1)">+</button>
              </div>`
        }
      </div>
    </div>`;
  document.getElementById(category).appendChild(itemDiv);
}

function loadMenu() {
  categories.forEach(category => {
    db.ref('menu/' + category).on('value', snapshot => {
      const section = document.getElementById(category);
      section.innerHTML = '';
      const data = snapshot.val();
      if (data) {
        for (let id in data) renderMenuItem(category, id, data[id]);
      } else {
        section.innerHTML = `<p class="empty-menu-msg">No items available in this category right now.</p>`;
      }
    });
  });
}

// ✅ Cart Logic
function addToCart(id, name, price) {
  const item = cart.find(i => i.id === id);
  if (!item) {
    cart.push({
      id,
      name,
      price,
      qty: 1,
      addedAt: new Date().toISOString()
    });
    showToast(`✅ 1 ${name} added`);
  }
  updateCart();
  loadMenu();
}

function updateQuantity(id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += change;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCart();
  loadMenu();
}

function updateCart() {
  const cartItems = document.getElementById('cart-items');
  const total = document.getElementById('total');
  cartItems.innerHTML = '';
  let sum = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} × ${item.qty} - ₹${item.price * item.qty}
      <button onclick="updateQuantity('${item.id}', -1)">×</button>
    `;
    cartItems.appendChild(li);
    sum += item.price * item.qty;
  });
  total.textContent = sum;
  document.getElementById('order-btn').disabled = cart.length === 0;
}

function showStatus(msg) {
  const status = document.getElementById('order-status');
  status.textContent = msg;
  status.classList.remove('hidden');
  status.classList.add('fade-in');
}

//order now 

function orderNow() {
  if (cart.length === 0) return;

  const now = new Date().toISOString();

  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const prev = snapshot.val();
    const allItems = prev ? [...prev.items, ...cart] : [...cart];

    // ✅ Merge quantities
    const merged = {};
    allItems.forEach(item => {
      if (!merged[item.id]) {
        merged[item.id] = { ...item };
      } else {
        merged[item.id].qty += item.qty;
      }
    });

    const finalItems = Object.values(merged);
    const newTotal = finalItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    // ✅ Update the full order with all merged items
    db.ref('orders/' + sessionId).update({
      orderId: sessionId,
      name: customerName,
      table: tableNumber,
      items: finalItems,
      total: newTotal,
      timestamp: now,
      status: 'preparing'
    });

    // ✅ Push only the new items (cart) into updates
    db.ref('orders/' + sessionId + '/updates').push({
      timestamp: now,
      added: JSON.parse(JSON.stringify(cart)),
      total: newTotal
    });

    // ✅ Send notification to kitchen
    fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic os_v2_app_5zopwpsvgzawbkbck6gmqhjh5o4zfvm6xgvunc4ee4l6gljp5zx4wfnpid2qhq2i56krh52mzoyvnlcx2eccyuruet3hltd5rwy72wq"
      },
      body: JSON.stringify({
        app_id: "ee5cfb3e-5536-4160-a822-578cc81d27eb",
        included_segments: ["Subscribed Users"],
        headings: { en: "🍽️ New Order from Table " + tableNumber },
        contents: { en: `${customerName} placed an order.` },
        url: "https://sturdyknight.github.io/kitchen.html",
        chrome_web_icon: "https://sturdyknight.github.io/logo.png"
      })
    }).then(res => res.json())
      .then(data => console.log("✅ Notification sent", data))
      .catch(err => console.error("❌ OneSignal error", err));

    cart = [];
    updateCart();
    showStatus("🧾 Order is added and being prepared.");
    showToast("🧾 Order sent to kitchen");
  });
}


// ✅ Checkout
function checkout() {
  if (!sessionId) return;
  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const order = snapshot.val();
    if (!order) return;

    if (order.status === 'done') {
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
      document.body.appendChild(receiptDiv);
      receiptDiv.innerText = receipt;

      html2canvas(receiptDiv).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [260, 400] });
        pdf.addImage(imgData, 'PNG', 5, 5, 250, 360);
        pdf.save(`Cheesy_Delight_Receipt_${sessionId}.pdf`);
        document.body.removeChild(receiptDiv);
        localStorage.removeItem('cheesy_sessionId');
        localStorage.removeItem('cheesy_name');
        localStorage.removeItem('cheesy_table');
        showToast("✅ Receipt downloaded");

        setTimeout(() => window.location.href = "index.html", 2000);
      });
    } else {
      showStatus("⏳ Please wait, your order is still being prepared.");
      showToast("⌛ Not ready yet");
    }
  });
}

// ✅ Load Previous Order
function loadPreviousOrder() {
  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const order = snapshot.val();
    if (order && order.status !== 'done') {
      showStatus("👋 Welcome back! Your order is being prepared.");
      document.getElementById('checkout-btn').disabled = true;
    }
  });
}

// ✅ Listen for Kitchen Update
function listenForKitchenUpdate() {
  db.ref('orders/' + sessionId).on('value', snapshot => {
    const order = snapshot.val();
    if (order && order.status === 'done') {
      showStatus("🍽 Your order is ready! You may now checkout.");
      document.getElementById('checkout-btn').disabled = false;
      document.getElementById('order-btn').disabled = true;
      showToast("🍽 Order marked as done");

      userAudio.play().catch(e => console.warn('Autoplay blocked'));
    } else {
      document.getElementById('checkout-btn').disabled = true;
    }
  });
}

// ✅ Init
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  loadPreviousOrder();
  listenForKitchenUpdate();
  document.getElementById('order-btn').addEventListener('click', orderNow);
  document.getElementById('checkout-btn').addEventListener('click', checkout);
});
