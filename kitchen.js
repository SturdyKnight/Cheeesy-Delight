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

// ✅ DOM Elements
const ordersDiv = document.getElementById("orders");
const kitchenSound = document.getElementById("kitchenSound");

// ✅ Track already displayed orders
let shownOrders = new Set();

// ✅ Render a single order card
function renderOrder(orderId, orderData) {
  if (document.getElementById(`order-${orderId}`)) return; // Already shown

  const card = document.createElement("div");
  card.className = "order-card";
  card.id = `order-${orderId}`;

  const itemsHTML = orderData.items.map(
    item => `<li>${item.name} × ${item.qty} - ₹${item.price * item.qty}</li>`
  ).join("");

  card.innerHTML = `
    <h5>Order #${orderId}</h5>
    <p><strong>Name:</strong> ${orderData.name}</p>
    <p><strong>Table:</strong> ${orderData.table}</p>
    <ul>${itemsHTML}</ul>
    <p><strong>Total:</strong> ₹${orderData.total}</p>
    <p><strong>Time:</strong> ${new Date(orderData.timestamp).toLocaleString()}</p>
    <button class="btn waves-effect waves-light orange darken-2" onclick="markAsDone('${orderId}')">
      ✅ Mark as Done
    </button>
  `;

  ordersDiv.appendChild(card);
  shownOrders.add(orderId); // Track this order as shown

  // ✅ Play sound
  kitchenSound.play().catch(() => {
    console.warn("Autoplay blocked. Interaction needed.");
  });
}

// ✅ Mark order as done
function markAsDone(orderId) {
  const card = document.getElementById(`order-${orderId}`);
  if (card) {
    card.classList.add("fade-out");
    setTimeout(() => card.remove(), 500);
  }

  db.ref("orders/" + orderId).update({ status: "done" });
  M.toast({ html: "Order marked done ✅", classes: "green" });
}

// ✅ Load and listen for real-time preparing orders
function loadOrders() {
  db.ref("orders").on("value", snapshot => {
    const orders = snapshot.val();
    ordersDiv.innerHTML = "";

    let anyActive = false;

    for (let id in orders) {
      const order = orders[id];

      if (order.status === "preparing") {
        renderOrder(id, order);
        anyActive = true;
      }
    }

    if (!anyActive) {
      ordersDiv.innerHTML = `<p class="center-align grey-text">No active orders 🎉</p>`;
    }
  });

  // Optional: listen for removal or done update
  db.ref("orders").on("child_changed", snapshot => {
    const id = snapshot.key;
    const order = snapshot.val();

    if (order.status === "done") {
      const card = document.getElementById(`order-${id}`);
      if (card) {
        card.classList.add("fade-out");
        setTimeout(() => card.remove(), 500);
      }
    }
  });
}

window.onload = loadOrders;
