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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const sessionId = new URLSearchParams(window.location.search).get("session");
const customerName = localStorage.getItem("cheesy_name");
const tableNumber = localStorage.getItem("cheesy_table");
let cart = [];
let promo = null;

db.ref("promo").on("value", (snap) => {
  promo = snap.val();
  if (promo?.image && promo?.discount) {
    showPromoToast(promo.image, promo.discount);
  }
  updateCart();
});

// ✅ Toast Notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ✅ Render Menu Item
function renderMenuItem(category, itemId, itemData) {
  const section = document.getElementById(category);
  if (!section) return;

  const existing = document.getElementById(`menu-${itemId}`);
  if (existing) existing.remove();

  const itemDiv = document.createElement("div");
  itemDiv.className = "menu-item";
  itemDiv.id = `menu-${itemId}`;
  const safeName = itemData.name?.replace(/'/g, "\\'");

  let controlsHTML = "";
  let priceHTML = "";

  // 👉 Combo Items
  if (category === "combos" && Array.isArray(itemData.items)) {
    const comboQty = cart.find((i) => i.id === itemId)?.qty || 0;
    const renderComboItems = (items) =>
      items
        .map(
          (i) => `
        <div style="text-align:center; width: 110px;">
          <img src="${i.image}" alt="${i.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px; margin-bottom: 6px;" />
          <div style="font-size: 14px; font-weight: 500;">${i.name}</div>
        </div>
      `
        )
        .join("");

    const comboImagesHTML = `<div class="combo-images">${renderComboItems(
      itemData.items
    )}</div>`;
    priceHTML = `<p style="font-size: 16px; font-weight: 200; color: #000;">₹${itemData.price}</p>`;

    controlsHTML =
      comboQty === 0
        ? `<button class="add-btn" onclick="addToCart('${itemId}', '${safeName}', ${itemData.price})">Add</button>`
        : `<div class="qty-controls">
          <button onclick="updateQuantity('${itemId}', -1)">−</button>
          <span>${comboQty}</span>
          <button onclick="updateQuantity('${itemId}', 1, '${safeName}', ${itemData.price})">+</button>
        </div>`;

    itemDiv.innerHTML = `
      ${comboImagesHTML}
      <div class="menu-info">
        <p><strong>${itemData.name}</strong></p>
        ${priceHTML}
        <div class="control-box">${controlsHTML}</div>
      </div>
    `;
    section.appendChild(itemDiv);
    return;
  }

  // 🍕 Pizza
  if (itemData.type === "pizza") {
    const sizes = [
      { label: '7"', suffix: "_7", price: itemData.size7 ?? 0 },
      { label: '10"', suffix: "_10", price: itemData.size10 ?? 0 },
    ];
    controlsHTML = sizes
      .map((size) => {
        const fullId = itemId + size.suffix;
        const qty = cart.find((i) => i.id === fullId)?.qty || 0;
        return `
        <div style="margin: 6px 0;">
          <div style="font-size: 14px; font-weight: 500; color: #000;">${size.label} - ₹${size.price}</div>
          <div class="qty-controls">
            <button onclick="updateQuantity('${fullId}', -1)">−</button>
            <span>${qty}</span>
            <button onclick="updateQuantity('${fullId}', 1, '${safeName}', ${size.price})">+</button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 🍜 Noodles
  else if (itemData.type === "noodles") {
    const sizes = [
      { label: "Half", suffix: "_half", price: itemData.half ?? 0 },
      { label: "Full", suffix: "_full", price: itemData.full ?? 0 },
    ];
    controlsHTML = sizes
      .map((size) => {
        const fullId = itemId + size.suffix;
        const qty = cart.find((i) => i.id === fullId)?.qty || 0;
        return `
        <div style="margin: 6px 0;">
          <div style="font-size: 14px; font-weight: 500; color: #000;">${size.label} - ₹${size.price}</div>
          <div class="qty-controls">
            <button onclick="updateQuantity('${fullId}', -1)">−</button>
            <span>${qty}</span>
            <button onclick="updateQuantity('${fullId}', 1, '${safeName} (${size.label})', ${size.price})">+</button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 🧁 Regular item
  else {
    const qty = cart.find((i) => i.id === itemId)?.qty || 0;
    priceHTML = `<p style="font-size: 16px; font-weight: 200; color: #000;">₹${
      itemData.price ?? 0
    }</p>`;
    controlsHTML =
      qty === 0
        ? `<button class="add-btn" onclick="addToCart('${itemId}', '${safeName}', ${
            itemData.price ?? 0
          })">Add</button>`
        : `<div class="qty-controls">
          <button onclick="updateQuantity('${itemId}', -1)">−</button>
          <span>${qty}</span>
          <button onclick="updateQuantity('${itemId}', 1, '${safeName}', ${
            itemData.price ?? 0
          })">+</button>
        </div>`;
  }

  itemDiv.innerHTML = `
    <div class="menu-image-box">
      <img src="${itemData.image || "https://via.placeholder.com/100"}" alt="${
    itemData.name
  }" />
    </div>
    <div class="menu-info">
      <p><strong>${itemData.name}</strong></p>
      ${
        itemData.type === "pizza" || itemData.type === "noodles"
          ? ""
          : priceHTML
      }
      <div id="qty-${itemId}">${controlsHTML}</div>
    </div>
  `;
  section.appendChild(itemDiv);
}

// ✅ Quantity Handling
function addToCart(id, name, price) {
  cart.push({ id, name, price, qty: 1 });
  updateCart();
  loadMenu();
  showToast(`✅ 1 ${name} added`);
}

function updateQuantity(id, delta, name, price) {
  const item = cart.find((i) => i.id === id);
  if (!item && delta > 0) {
    cart.push({ id, name, price, qty: 1 });
  } else if (item) {
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  }
  updateCart();
  loadMenu();
}

// ✅ Cart UI
function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const total = document.getElementById("total");
  const discountLine = document.getElementById("discount-line"); // 👈 Add this in HTML
  cartItems.innerHTML = "";

  let sum = 0;

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} × ${item.qty} - ₹${item.price * item.qty}
      <button onclick="updateQuantity('${item.id}', -1)">×</button>`;
    cartItems.appendChild(li);
    sum += item.price * item.qty;
  });

  // 🟠 Apply promo discount if available
  let finalTotal = sum;
  if (promo?.discount) {
    finalTotal = Math.round(sum * (1 - promo.discount / 100));
  }

  total.textContent = finalTotal;

  // ✅ Show discount line if discount is active
  if (promo?.discount && sum > finalTotal && discountLine) {
    const saved = sum - finalTotal;
    discountLine.innerHTML = `🎉 ${promo.discount}% OFF applied! You saved ₹${saved}`;
    discountLine.style.display = "block";
  } else if (discountLine) {
    discountLine.style.display = "none";
  }

  // sticky bar update
  document.getElementById("sticky-total").textContent = finalTotal;
  document.getElementById("sticky-summary-btn").disabled = cart.length === 0;

  document.getElementById("order-btn").disabled = cart.length === 0;
  document.getElementById("checkout-btn").disabled = true;
}

// ✅ Load Menu from Firebase
function loadMenu() {
  const preferredOrder = ["starters", "main-course", "desserts", "drinks"];
  db.ref("menu").on("value", (snapshot) => {
    const menu = snapshot.val();
    if (!menu) return;
    const menuSection = document.getElementById("menu-section");
    menuSection.innerHTML = "";
    const allCategories = Object.keys(menu);
    const orderedCategories = [
      ...preferredOrder.filter((cat) => allCategories.includes(cat)),
      ...allCategories.filter((cat) => !preferredOrder.includes(cat)),
    ];
    orderedCategories.forEach((category) => {
      const sectionTitle = category
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const section = document.createElement("div");
      section.innerHTML = `<h2>${sectionTitle}</h2><div class="menu-category" id="${category}"></div>`;
      menuSection.appendChild(section);
      const items = menu[category];
      if (items) {
        for (let itemId in items) {
          renderMenuItem(category, itemId, items[itemId]);
        }
      }
    });
    renderCategoryBar(menu);
  });
}

function renderCategoryBar(menu) {
  const bar = document.getElementById("category-bar");
  bar.innerHTML = "";

  const desiredOrder = [
    "starters",
    "drinks",
    "mocktails",
    "tea-ice-tea",
    "soup",
    "salad",
    "sandwich",
    "burger",
    "fries",
    "pizza",
    "pasta",
    "noodles",
    "rice-noodles",
    "maggi",
    "momos",
    "indian-menu",
    "main-course",
    "combos",
    "special-offers",
    "sizzlers",
    "breads-toast",
    "twisto-cold-coffee-choco-cad",
    "choco-cad",
    "shake-smoothies",
    "brownies",
    "desserts",
    "filled-toastie",
    "nachos",
    "hot-coffee",
    "beverages",
    "fasting",
    "chinese-starter",
    "fresh-lemon",
    "papad",
  ];

  const actualCategories = Object.keys(menu);
  const orderedCategories = [
    ...desiredOrder.filter((cat) => actualCategories.includes(cat)),
    ...actualCategories.filter((cat) => !desiredOrder.includes(cat)),
  ];

  orderedCategories.forEach((cat) => {
    const catData = menu[cat];
    if (!catData) return;

    const firstItem = Object.values(catData)[0];
    const image = firstItem?.image || "/img/default_category.png";
    const catName = cat
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const div = document.createElement("div");
    div.className = "category";
    div.setAttribute("data-id", cat);

    // ✅ Scroll logic
    div.onclick = () => {
      const target = document.getElementById(cat);
      if (!target) return;

      // The heading we want to scroll into view
      const heading = target.querySelector("h2") || target;

      // Measure total sticky header height
      const stickyHeader = document.querySelector(".sticky-header");
      const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;

      // Add a small padding buffer
      const buffer = 190;

      // Where to scroll
      const scrollY =
        heading.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        buffer;

      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "smooth" });
      });
    };

    // ✅ Build HTML and append
    div.innerHTML = `
      <div class="category-image-container">
        <img src="${image}" alt="${catName}" class="category-image" />
      </div>
      <div class="category-name text-capitalise">${catName}</div>
    `;
    bar.appendChild(div);
  });
}

function orderNow() {
  if (!cart.length) return;

  const mobileNumber = localStorage.getItem("cheesy_mobile") || ""; // ✅ Get mobile from localStorage

  db.ref("orders/" + sessionId)
    .once("value")
    .then((snapshot) => {
      const prev = snapshot.val();
      const allItems = prev ? [...prev.items, ...cart] : [...cart];

      const merged = {};
      allItems.forEach((item) => {
        if (!merged[item.id]) merged[item.id] = { ...item };
        else merged[item.id].qty += item.qty;
      });

      const finalItems = Object.values(merged);
      const newTotal = finalItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );

      // ✅ Save to orders with mobile number
      const orderPayload = {
        orderId: sessionId,
        name: customerName,
        table: tableNumber,
        mobile: mobileNumber,
        items: finalItems,
        total: newTotal,
        timestamp: new Date().toISOString(),
        status: "preparing",
      };

      if (promo?.discount) {
        orderPayload.promo = {
          discount: promo.discount,
          timestamp: Date.now(),
        };
      }

      db.ref("orders/" + sessionId).set(orderPayload);

      db.ref(`orders/${sessionId}/updates`).push({
        timestamp: new Date().toISOString(),
        added: [...cart],
        total: newTotal,
      });

      cart = [];
      updateCart();
      loadMenu();
      showToast("🧾 Order sent to kitchen");
    });
}

function checkout() {
  db.ref("orders/" + sessionId)
    .once("value")
    .then((snapshot) => {
      const order = snapshot.val();
      if (!order || order.status !== "done") {
        showToast("⌛ Order not ready yet");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const subtotal = order.items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );
      const discount = order.promo?.discount || 0;
      const finalTotal = Math.round(subtotal * (1 - discount / 100));

      // Header Info
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CHEESY DELIGHT", 105, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${order.name}`, 14, 25);
      doc.text(`Table: ${order.table || "-"}`, 100, 25);
      doc.text(`Date: ${new Date(order.timestamp).toLocaleString()}`, 14, 31);

      // Item Table
      const tableData = order.items.map((item) => [
        item.name,
        item.qty,
        `₹${item.price}`,
        `₹${item.price * item.qty}`,
      ]);

      doc.autoTable({
        startY: 35,
        head: [["Item", "Qty", "Rate", "Total"]],
        body: order.items.map((item) => [
          item.name,
          item.qty,
          `Rs. ${item.price}`,
          `Rs. ${item.price * item.qty}`,
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
        theme: "grid", // optional
        columnStyles: {
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });

      // Totals
      const endY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal: Rs.${subtotal}`, 130, endY);
      if (discount > 0) {
        doc.text(`Discount: ${discount}%`, 130, endY + 6);
        doc.text(`Final Total: Rs.${finalTotal}`, 130, endY + 12);
      } else {
        doc.text(`Total: Rs.${finalTotal}`, 130, endY + 6);
      }

      // Footer
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Thank you! Visit again.", 105, endY + 25, { align: "center" });

      // Save
      doc.save(`Cheesy_Delight_Receipt_${order.orderId}.pdf`);
      localStorage.clear();
      setTimeout(() => (window.location.href = "index.html"), 2000);
    })
    .catch((err) => {
      console.error("Firebase fetch error:", err);
      showToast("⚠️ Failed to retrieve order");
    });
}

// ✅ Kitchen Status Watcher
function listenForKitchenUpdate() {
  db.ref("orders/" + sessionId).on("value", (snapshot) => {
    const order = snapshot.val();
    if (order && order.status === "done") {
      document.getElementById("checkout-btn").disabled = false;
      document.getElementById("order-btn").disabled = true;
      showToast("🍽 Order marked as done");
    } else {
      document.getElementById("checkout-btn").disabled = true;
    }
  });
}

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const closeIcon = document.querySelector(".close-icon");

// Search all items when typing
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.style.display = "none";
    closeIcon.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }

  closeIcon.style.display = "inline-block";

  // search through Firebase-loaded menu
  db.ref("menu")
    .once("value")
    .then((snapshot) => {
      const menu = snapshot.val();
      if (!menu) return;

      const matches = [];
      for (const cat in menu) {
        const items = menu[cat];
        for (const id in items) {
          const item = items[id];
          if (item.name && item.name.toLowerCase().includes(query)) {
            matches.push({ ...item, id, category: cat });
          }
        }
      }

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="empty-menu-msg">No items found</div>`;
      } else {
        searchResults.innerHTML = matches
          .map((item) => {
            let priceDisplay = "";

            if (item.type === "pizza" || item.type === "noodles") {
              priceDisplay = `<p class="price">Tap to view options</p>`;
            } else {
              priceDisplay = `<p class="price">₹${item.price ?? "N/A"}</p>`;
            }

            return `
    <div class="search-result-item" onclick="goToMenuItem('${item.id}')">
      <div class="menu-image-box">
        <img src="${item.image || "https://via.placeholder.com/100"}" alt="${
              item.name
            }" />
      </div>
      <div class="menu-info">
        <p><strong>${item.name}</strong></p>
        ${priceDisplay}
      </div>
    </div>
  `;
          })
          .join("");
        searchResults.style.display = "block";
        document.body.style.overflow = "hidden"; // Disable background scroll
        document
          .getElementById("category-bar")
          .classList.add("hide-when-searching");
      }
    });
});

// Clear search
function clearSearch() {
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchResults.style.display = "none";
  closeIcon.style.display = "none";
  document.body.style.overflow = ""; // Re-enable scroll
  document
    .getElementById("category-bar")
    .classList.remove("hide-when-searching");
}

function goToMenuItem(itemId) {
  clearSearch();
  const target = document.getElementById(`menu-${itemId}`);
  if (target) {
    const stickyHeader = document.querySelector(".sticky-header");
    const categoriesBar = document.getElementById("category-bar");

    const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
    const categoryHeight = categoriesBar ? categoriesBar.offsetHeight : 0;
    const buffer = 16;

    const totalOffset = headerHeight + categoryHeight + buffer;

    const y = target.getBoundingClientRect().top + window.scrollY - totalOffset;

    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

function renderPromoBanner() {
  const banner = document.getElementById("promo-banner");
  if (!banner) return;
  if (!promo || !promo.image || !promo.discount) {
    banner.style.display = "none";
    return;
  }
  banner.innerHTML = `
    <img src="${promo.image}" alt="Promo" style="width:100%;border-radius:8px;margin-bottom:10px;" />
    <p style="text-align:center;font-weight:bold;color:#ff5722;">🔥 ${promo.discount}% OFF Applied!</p>
  `;
  banner.style.display = "block";
}

function showPromoToast(imageUrl, discount) {
  const overlay = document.getElementById("promo-overlay");
  const toast = document.getElementById("promo-toast");
  const img = document.getElementById("promo-toast-img");
  const msg = document.getElementById("promo-toast-msg");

  if (!overlay || !toast || !img || !msg) return;

  img.src = imageUrl;
  msg.textContent = `🎉 ${discount}% OFF Applied to Your Order!`;

  overlay.style.display = "flex";

  overlay.onclick = () => {
    overlay.style.display = "none";
  };
}

// ✅ Init
document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  updateCart();
  listenForKitchenUpdate();

  document.getElementById("order-btn").addEventListener("click", orderNow);
  document.getElementById("checkout-btn").addEventListener("click", checkout);

  document
    .getElementById("sticky-summary-btn")
    .addEventListener("click", () => {
      document.getElementById("cart").scrollIntoView({ behavior: "smooth" });
    });

  // Sticky bar hide logic:
  const footer = document.querySelector(".site-footer");
  const stickyBar = document.getElementById("sticky-bar");

  if (footer && stickyBar) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stickyBar.style.transform = "translateY(100%)"; // hide
          } else {
            stickyBar.style.transform = "translateY(0)"; // show
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(footer);
  }
});
