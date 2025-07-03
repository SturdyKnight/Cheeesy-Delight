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
  toast.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; padding: 10px 16px;
    border-radius: 6px; font-size: 14px; z-index: 9999;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2); transition: opacity 0.3s ease;
  `;
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
        ${qty === 0
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
    cart.push({ id, name, price, qty: 1, addedAt: new Date().toISOString() });
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

// ✅ Order Submission
function orderNow() {
  if (cart.length === 0) return;

  db.ref('menu').once('value').then(menuSnap => {
    const menuData = menuSnap.val();

    const cartWithCategory = cart.map(item => {
      let category = null;
      for (let cat in menuData) {
        if (menuData[cat] && Object.values(menuData[cat]).some(m => m.name === item.name)) {
          category = cat;
          break;
        }
      }
      return { ...item, category: category || 'unknown' };
    });

    db.ref('orders/' + sessionId).once('value').then(snapshot => {
      const prev = snapshot.val();
      const allItems = prev ? [...prev.items, ...cartWithCategory] : [...cartWithCategory];
      const merged = {};

      allItems.forEach(item => {
        const key = `${item.id}_${item.category}`;
        if (!merged[key]) {
          merged[key] = { ...item };
        } else {
          merged[key].qty += item.qty;
        }
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

      db.ref('orders/' + sessionId + '/updates').push({
        timestamp: new Date().toISOString(),
        added: [...cartWithCategory],
        total: newTotal
      });

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
      });

      cart = [];
      updateCart();
      loadMenu();
      showStatus("🧾 Order is added and being prepared.");
      showToast("🧾 Order sent to kitchen");
    });
  });
}

// ✅ Checkout + PDF
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

      const win = window.open('', '_blank');
      win.document.write(`
  <html>
    <head>
      <title>Cheesy Delight Receipt</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          background: #fdfdfd;
          font-family: 'Courier New', monospace;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 90vw;
          width: 320px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          text-align: center;
          white-space: pre-wrap;
        }
        h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        pre {
          font-size: 13px;
          text-align: left;
          overflow-x: auto;
        }
        button {
          margin-top: 20px;
          background: #ff7043;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        }
        @media (max-width: 400px) {
          .container {
            width: 90vw;
            padding: 16px;
          }
          pre {
            font-size: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>🧾 Cheesy Delight Receipt</h3>
        <pre>${receipt}</pre>
        <button onclick="downloadPDF()">⬇️ Download PDF</button>
      </div>

      <script>
        async function downloadPDF() {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'px', format: [260, 400] });
          doc.setFont('courier');
          doc.setFontSize(10);
          const lines = \`${receipt}\`.split('\\n');
          lines.forEach((line, i) => doc.text(line, 10, 20 + i * 14));
          doc.save('Cheesy_Delight_Receipt_${sessionId}.pdf');

          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage("clearSession", "*");
            }
          }, 500);
        }
      </script>
    </body>
  </html>
`);
    } else {
      showStatus("⏳ Please wait, your order is still being prepared.");
      showToast("⌛ Not ready yet");
    }
  });
}

window.addEventListener("message", e => {
  if (e.data === "clearSession") {
    setTimeout(() => {
      localStorage.removeItem('cheesy_sessionId');
      localStorage.removeItem('cheesy_name');
      localStorage.removeItem('cheesy_table');
      window.location.href = "index.html";
    }, 3500); // 3.5 seconds delay before redirect
  }
});


// ✅ Load Previous + Listen for Kitchen Update
function loadPreviousOrder() {
  db.ref('orders/' + sessionId).once('value').then(snapshot => {
    const order = snapshot.val();
    if (order && order.status !== 'done') {
      showStatus("👋 Welcome back! Your order is being prepared.");
      document.getElementById('checkout-btn').disabled = true;
    }
  });
}

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
