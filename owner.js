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

const tableBody = document.getElementById('orders-table-body');
const totalSalesDiv = document.getElementById('total-sales');

// Format readable date
function formatDate(ts) {
  const date = new Date(ts);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderOrder(orderId, order) {
  const row = document.createElement('tr');
  const items = order.items || [];
  const itemList = items.map(i => `${i.name} × ${i.qty}`).join(', ');

  row.innerHTML = `
    <td>${orderId}</td>
    <td>${order.name}</td>
    <td>${order.table}</td>
    <td><span class="status ${order.status}">${order.status}</span></td>
    <td>${itemList}</td>
    <td>₹${order.total || 0}</td>
    <td>${formatDate(order.timestamp)}</td>
  `;

  tableBody.appendChild(row);
}

function loadOrders() {
  db.ref('orders').on('value', snapshot => {
    const orders = snapshot.val() || {};
    tableBody.innerHTML = '';
    let totalSales = 0;

    Object.entries(orders).forEach(([id, order]) => {
      renderOrder(id, order);
      if (order.status === 'done') {
        totalSales += order.total || 0;
      }
    });

    totalSalesDiv.textContent = `Total Sales: ₹${totalSales}`;
  });
}

loadOrders();
