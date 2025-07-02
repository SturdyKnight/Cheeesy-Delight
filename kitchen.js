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
const messaging = firebase.messaging();

// ✅ DOM Elements
const ordersDiv = document.getElementById("orders");
const kitchenSound = document.getElementById("kitchenSound");

// ✅ Track shown orders
let shownOrders = new Set();

// ✅ Render new order
function renderOrder(orderId, orderData) {
  if (document.getElementById(`order-${orderId}`)) return;

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
  shownOrders.add(orderId);

  // 🔔 Sound & Notification
  kitchenSound.play().catch(() => console.warn("Autoplay blocked"));

  if (Notification.permission === "granted") {
    new Notification("🍕 New Order!", {
      body: `Table ${orderData.table} placed an order.`,
      icon: "logo.png"
    });
  }
}

// ✅ Mark as done
function markAsDone(orderId) {
  const card = document.getElementById(`order-${orderId}`);
  if (card) {
    card.classList.add("fade-out");
    setTimeout(() => card.remove(), 500);
  }

  db.ref("orders/" + orderId).update({ status: "done" });
  M.toast({ html: "Order marked done ✅", classes: "green" });
}

// ✅ Load orders
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

// ✅ Ask for Push Notification Permission
function setupPushNotifications() {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      messaging.getToken({
        vapidKey: "BDMAO8BavZJ8Xxv266sTYU4XUD8bil5MlG_XksOJ5u9TvvGemV0fYigYrpDynb7OUnmMBjTR053DUsV3J2YYyG4" // Set this from Firebase Project Settings > Cloud Messaging
      }).then((currentToken) => {
        if (currentToken) {
          console.log("✅ FCM Token:", currentToken);
          // You can store the token in your database for admin broadcast
        } else {
          console.warn("❌ No registration token available");
        }
      }).catch(err => {
        console.error("Token error:", err);
      });
    } else {
      console.warn("🔕 Notification permission denied");
    }
  });
}

// ✅ Receive FCM messages when app is in foreground
messaging.onMessage(payload => {
  console.log("📨 Push Received", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon || "logo.png"
  });
});

// ✅ Init on load
window.onload = function () {
  loadOrders();
  setupPushNotifications();
};
