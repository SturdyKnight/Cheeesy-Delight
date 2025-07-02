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
const shownOrders = new Set();

// ✅ Render new order
function renderOrder(orderId, orderData) {
  if (shownOrders.has(orderId)) return;

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

  // 🔊 Play sound
  kitchenSound.play().catch(() => {
    console.warn("Autoplay blocked");
  });

  // 🔔 Show browser notification
  if (Notification.permission === "granted") {
    new Notification("🍕 New Order!", {
      body: `Table ${orderData.table} placed an order.`,
      icon: "logo.png"
    });
  }
}

// ✅ Mark order as done
function markAsDone(orderId) {
  const card = document.getElementById(`order-${orderId}`);
  if (card) {
    card.classList.add("fade-out");
    setTimeout(() => card.remove(), 500);
  }

  db.ref("orders/" + orderId).update({ status: "done" });
  M.toast({ html: "Order marked as done ✅", classes: "green" });
}

// ✅ Load orders from Firebase
function loadOrders() {
  db.ref("orders").on("value", snapshot => {
    const orders = snapshot.val();
    ordersDiv.innerHTML = "";
    shownOrders.clear();

    let hasActive = false;

    for (let id in orders) {
      const order = orders[id];
      if (order.status === "preparing") {
        renderOrder(id, order);
        hasActive = true;
      }
    }

    if (!hasActive) {
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

// ✅ Set up push notifications
function setupPushNotifications() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        navigator.serviceWorker.register("firebase-messaging-sw.js")
          .then(registration => {
            console.log("✅ Service worker registered");

            messaging.getToken({
              vapidKey: "BDMAO8BavZJ8Xxv266sTYU4XUD8bil5MlG_XksOJ5u9TvvGemV0fYigYrpDynb7OUnmMBjTR053DUsV3J2YYyG4",
              serviceWorkerRegistration: registration
            }).then(token => {
              if (token) {
                console.log("✅ FCM Token:", token);
                // Save to DB if needed
              } else {
                console.warn("❌ No registration token available");
              }
            }).catch(err => {
              console.error("❌ Token error:", err);
            });

          }).catch(err => {
            console.error("❌ Service worker registration failed:", err);
          });
      } else {
        console.warn("🔕 Notifications blocked by user");
      }
    });
  }
}

// ✅ Receive FCM foreground messages
messaging.onMessage(payload => {
  console.log("📨 Push Received:", payload);
  const { title, body, icon } = payload.notification;
  new Notification(title, {
    body,
    icon: icon || "logo.png"
  });
});

// ✅ Init on page load
window.onload = function () {
  loadOrders();
  setupPushNotifications();
};
