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

function renderOrder(orderId, order) {
  const row = document.createElement('tr');

  const itemsText = (order.items || [])
    .map(item => `${item.name} (₹${item.price})`)
    .join(', ');

  row.innerHTML = `
    <td>${orderId}</td>
    <td>${order.name}</td>
    <td>${order.table}</td>
    <td>${order.status}</td>
    <td>${itemsText}</td>
    <td>₹${order.total}</td>
    <td>${new Date(order.timestamp).toLocaleString()}</td>
  `;
  tableBody.appendChild(row);
}

function loadOrders() {
  db.ref('orders').on('value', snapshot => {
    const orders = snapshot.val();
    tableBody.innerHTML = '';
    let totalSales = 0;

    for (let id in orders) {
      const order = orders[id];
      renderOrder(id, order);
      if (order.status === 'done') {
        totalSales += order.total;
      }
    }

    totalSalesDiv.textContent = `Total Sales: ₹${totalSales}`;
  });
}

loadOrders();
