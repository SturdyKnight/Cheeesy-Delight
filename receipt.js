// receipt.js

const firebaseConfig = {
  apiKey: "AIzaSyDHyrO3YK0JI1wa6I1XQtcTh8asp2p992A",
  authDomain: "cheesydelight-80a43.firebaseapp.com",
  databaseURL: "https://cheesydelight-80a43-default-rtdb.firebaseio.com",
  projectId: "cheesydelight-80a43",
  storageBucket: "cheesydelight-80a43.firebasestorage.app",
  messagingSenderId: "433558050592",
  appId: "1:433558050592:web:169b277e2337931475e945",
  measurementId: "G-PS8WRBVTQ9",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function loadReceipts() {
  const container = document.getElementById("receipts");
  db.ref("orders").on("value", (snapshot) => {
    container.innerHTML = "";
    const orders = snapshot.val();
    for (let id in orders) {
      const order = orders[id];
      const div = document.createElement("div");
      div.className = "receipt";
      div.innerHTML = `
        <h3>Order #${order.orderId}</h3>
        <p><strong>Date:</strong> ${new Date(
          order.timestamp
        ).toLocaleString()}</p>
        <p><strong>Table:</strong> ${order.table}</p>
        <p><strong>Customer:</strong> ${order.name}</p>
        <ul>
          ${order.items
            .map((item) => `<li>${item.name} - ₹${item.price}</li>`)
            .join("")}
        </ul>
        <p><strong>Total:</strong> ₹${order.total}</p>
        <button onclick="printReceipt(this)">Print Receipt</button>
      `;
      container.appendChild(div);
    }
  });
}

function printReceipt(button) {
  const content = button.parentElement.innerHTML;
  const win = window.open("", "", "height=600,width=800");
  win.document.write("<html><head><title>Receipt</title></head><body>");
  win.document.write(content);
  win.document.write("</body></html>");
  win.document.close();
  win.print();
}

window.onload = loadReceipts;
