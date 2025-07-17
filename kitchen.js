// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDHyrO3YK0JI1wa6I1XQtcTh8asp2p992A",
  authDomain: "cheesydelight-80a43.firebaseapp.com",
  databaseURL: "https://cheesydelight-80a43-default-rtdb.firebaseio.com",
  projectId: "cheesydelight-80a43",
  storageBucket: "cheesydelight-80a43.appspot.com",
  messagingSenderId: "433558050592",
  appId: "1:433558050592:web:169b277e2337931475e945",
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ Global Promo Holder
window.currentPromo = null;

// ✅ Now it's safe to use db
db.ref("promo").on("value", (snap) => {
  window.currentPromo = snap.val();
});

// ✅ DOM Elements
const ordersDiv = document.getElementById("orders");
const kitchenSound = document.getElementById("kitchenSound");

// ✅ Render a single order card
function renderOrder(orderId, orderData, latestUpdate = null) {
  const card = document.createElement("div");
  card.className = "order-card";
  card.id = `order-${orderId}`;

  const itemsHTML = orderData.items
    .map(
      (item) =>
        `<li>${item.name} × ${item.qty} - ₹${item.price * item.qty}</li>`
    )
    .join("");

  let updatesHTML = "";
  if (latestUpdate && latestUpdate.added?.length > 0) {
    updatesHTML = `
      <div style="margin-top: 10px;">
        <strong style="color: green;">🆕 New Items in This Update:</strong>
        <ul>
          ${latestUpdate.added
            .map((item) => `<li>${item.name} × ${item.qty}</li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  // 🧠 Calculate discount if promo exists
  let discountInfo = "";
  if (window.currentPromo?.discount) {
    const discount = window.currentPromo.discount;
    const discountedTotal = Math.round(orderData.total * (1 - discount / 100));
    discountInfo = `
      <p>
        <strong>🎉 Promo Applied:</strong> ${discount}% OFF
        <br><strong>Final Total:</strong> ₹${discountedTotal}
      </p>
    `;
  }

  card.innerHTML = `
    <h5>Order #${orderId}</h5>
    <p><strong>Name:</strong> ${orderData.name}</p>
    <p><strong>Table:</strong> ${orderData.table}</p>
    <ul>${itemsHTML}</ul>
    ${updatesHTML}
    <p><strong>Total:</strong> ₹${orderData.total}</p>
    ${discountInfo}
    <p><strong>Time:</strong> ${new Date(
      orderData.timestamp
    ).toLocaleString()}</p>
    <button class="btn waves-effect waves-light orange darken-2" onclick="markAsDone('${orderId}')">
      ✅ Mark as Done
    </button>
  `;

  ordersDiv.appendChild(card);

  // 🔊 Play kitchen alert sound
  kitchenSound.play().catch(() => console.warn("🔇 Autoplay blocked"));

  // 🔔 Trigger browser notification
  if (Notification.permission === "granted") {
    new Notification("🍕 New Order!", {
      body: `Table ${orderData.table} placed an order.`,
      icon: "logo.png",
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

// ✅ Load and listen for orders
function loadOrders() {
  db.ref("orders").on("value", (snapshot) => {
    const orders = snapshot.val();
    ordersDiv.innerHTML = "";

    if (!orders) {
      ordersDiv.innerHTML = `<p class="center-align grey-text">No active orders 🎉</p>`;
      return;
    }

    const activeOrders = Object.entries(orders)
      .filter(([_, data]) => data.status === "preparing")
      .sort(([, a], [, b]) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

    if (activeOrders.length === 0) {
      ordersDiv.innerHTML = `<p class="center-align grey-text">No active orders 🎉</p>`;
      return;
    }

    activeOrders.forEach(([orderId, orderData]) => {
      db.ref(`orders/${orderId}/updates`)
        .orderByKey()
        .limitToLast(1)
        .once("value", (updateSnap) => {
          const updates = updateSnap.val();
          let latestUpdate = null;
          if (updates) {
            const key = Object.keys(updates)[0];
            latestUpdate = updates[key];
          }
          renderOrder(orderId, orderData, latestUpdate);
        });
    });
  });

  // ✅ Auto-remove done orders visually
  db.ref("orders").on("child_changed", (snapshot) => {
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

// ✅ Ask notification permission
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      console.log("🔔 Notification permission:", permission);
    });
  }
}

// ✅ Init on page load
window.onload = function () {
  // First load promo once
  db.ref("promo").once("value").then((snap) => {
    window.currentPromo = snap.val() || null;
    loadOrders(); // Only now load orders
  });

  // Then keep listening to future changes
  db.ref("promo").on("value", (snap) => {
    window.currentPromo = snap.val() || null;
  });

  requestNotificationPermission();
};
