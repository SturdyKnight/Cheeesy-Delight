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
const ordersDiv = document.getElementById('orders');

function renderOrder(orderId, orderData) {
  const card = document.createElement('div');
  card.className = 'order-card';
  card.innerHTML = `
    <h5>Order #${orderId}</h5>
    <p><strong>Name:</strong> ${orderData.name}</p>
    <p><strong>Table:</strong> ${orderData.table}</p>
    <ul>
      ${orderData.items.map(item => `
        <li>${item.name} × ${item.qty} — ₹${item.price * item.qty}</li>
      `).join('')}
    </ul>
    <p><strong>Total:</strong> ₹${orderData.total}</p>
    <p><strong>Time:</strong> ${new Date(orderData.timestamp).toLocaleString()}</p>
    <button onclick="markAsDone('${orderId}')">Mark as Done</button>
  `;
  ordersDiv.appendChild(card);
}

function markAsDone(orderId) {
  db.ref('orders/' + orderId).update({ status: 'done' });
  alert(`✅ Order ${orderId} marked as done.`);
}

function loadOrders() {
  db.ref('orders').on('value', snapshot => {
    ordersDiv.innerHTML = '';
    const orders = snapshot.val();
    for (let id in orders) {
      const order = orders[id];
      if (order.status === 'preparing') {
        renderOrder(id, order);
      }
    }

    if (ordersDiv.innerHTML === '') {
      ordersDiv.innerHTML = `<p style="text-align:center; color: #777;">No active orders 🎉</p>`;
    }
  });
}

window.onload = loadOrders;
