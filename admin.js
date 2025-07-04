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
const form = document.getElementById('menu-form');
const menuList = document.getElementById('menu-items');
const categorySelect = document.getElementById('item-category');
const priceWrapper = document.getElementById('price-wrapper');
const pizzaWrapper = document.getElementById('pizza-wrapper');
const noodleWrapper = document.getElementById('noodle-wrapper');
const priceInput = document.getElementById('item-price');
const price7 = document.getElementById('pizza-price-7');
const price10 = document.getElementById('pizza-price-10');
const noodleHalf = document.getElementById('noodle-price-half');
const noodleFull = document.getElementById('noodle-price-full');
const searchInput = document.getElementById('search-input');
const comboContainer = document.getElementById('combo-select-items');
const comboName = document.getElementById('combo-name');
const comboPrice = document.getElementById('combo-price');
const saveComboBtn = document.getElementById('save-combo-btn');

// ✅ State
let isEditing = false;
let editingId = null;
let editingCategory = null;
let editingComboId = null;

// ✅ Toggle price fields
categorySelect.addEventListener('change', () => {
  const value = categorySelect.value;
  priceWrapper.style.display = (value !== 'pizzas' && value !== 'noodles') ? 'block' : 'none';
  pizzaWrapper.style.display = value === 'pizzas' ? 'block' : 'none';
  noodleWrapper.style.display = value === 'noodles' ? 'block' : 'none';
});

// ✅ Submit Menu Item
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('item-name').value.trim();
  const category = categorySelect.value;
  const imageUrl = document.getElementById('item-image-url').value.trim();
  if (!name || !category || !imageUrl) return alert("Please fill all fields.");

  let itemData;
  if (category === 'pizzas') {
    const val7 = parseFloat(price7.value);
    const val10 = parseFloat(price10.value);
    if (isNaN(val7) || isNaN(val10)) return alert("Enter valid pizza prices.");
    itemData = { name, image: imageUrl, type: "pizza", size7: val7, size10: val10 };
  } else if (category === 'noodles') {
    const half = parseFloat(noodleHalf.value);
    const full = parseFloat(noodleFull.value);
    if (isNaN(half) || isNaN(full)) return alert("Enter valid noodle prices.");
    itemData = { name, image: imageUrl, type: "noodles", half, full };
  } else {
    const price = parseFloat(priceInput.value);
    if (isNaN(price)) return alert("Enter a valid price.");
    itemData = { name, image: imageUrl, price };
  }

  if (isEditing && editingId && editingCategory) {
    await db.ref(`menu/${editingCategory}/${editingId}`).remove();
    await db.ref(`menu/${category}/${editingId}`).set(itemData);
    M.toast({ html: 'Item updated!', classes: 'blue' });
  } else {
    const newItemRef = db.ref(`menu/${category}`).push();
    await newItemRef.set(itemData);
    M.toast({ html: 'Menu item added!', classes: 'green' });
  }

  form.reset();
  M.updateTextFields();
  isEditing = false;
  editingId = null;
  editingCategory = null;
  priceWrapper.style.display = 'block';
  pizzaWrapper.style.display = 'none';
  noodleWrapper.style.display = 'none';
});

// ✅ Render Menu Cards
function renderMenuItem(category, id, item) {
  const cardId = `card-${category}-${id}`;
  document.getElementById(cardId)?.remove();

  const card = document.createElement('div');
  card.className = 'menu-card card';
  card.id = cardId;

  const priceText = item.type === 'pizza'
    ? `Price: 7" ₹${item.size7}, 10" ₹${item.size10}`
    : item.type === 'noodles'
    ? `Price: Half ₹${item.half}, Full ₹${item.full}`
    : `Price: ₹${item.price}`;

  let actionHTML = `
    <a href="#!" onclick="editItem('${category}', '${id}', '${encodeURIComponent(item.name)}', ${item.price || 0}, '${encodeURIComponent(item.image)}', ${item.size7 || 0}, ${item.size10 || 0}, '${item.type || ''}', ${item.half || 0}, ${item.full || 0})">Edit</a>
    <a href="#!" onclick="deleteItem('${category}', '${id}')">Delete</a>
  `;

  if (category === 'combos' && Array.isArray(item.items)) {
    actionHTML = `
      <a href="#!" onclick="editCombo('${id}')">Edit Combo</a>
      <a href="#!" onclick="deleteItem('${category}', '${id}')">Delete</a>
    `;
  }

  card.innerHTML = `
    <div class="card-image">
      <img src="${item.image}" alt="${item.name}" style="aspect-ratio: 1 / 1; object-fit: cover;" />
      <span class="card-title">${item.name}</span>
    </div>
    <div class="card-content">
      <p>${priceText}</p>
      <p>Category: ${category}</p>
    </div>
    <div class="card-action">${actionHTML}</div>
  `;
  menuList.appendChild(card);
}

// ✅ Load Menu Items
function loadMenuItems() {
  const categories = [
    'starters', 'main-course', 'desserts', 'drinks', 'pizzas',
    'momos', 'maggi', 'rice-bowls', 'noodles', 'special-offers', 'fasting', 'combos'
  ];
  menuList.innerHTML = '';
  categories.forEach(category => {
    const ref = db.ref(`menu/${category}`);
    ref.on('child_added', snap => renderMenuItem(category, snap.key, snap.val()));
    ref.on('child_changed', snap => renderMenuItem(category, snap.key, snap.val()));
    ref.on('child_removed', snap => document.getElementById(`card-${category}-${snap.key}`)?.remove());
  });
}

// ✅ Update Selection Counter and Highlight
function updateComboSelectionUI() {
  const checks = document.querySelectorAll('.combo-check');
  let count = 0;
  checks.forEach(cb => {
    const wrapper = cb.closest('label.combo-option');
    if (cb.checked) {
      wrapper.classList.add('selected');
      count++;
    } else {
      wrapper.classList.remove('selected');
    }
  });

  const label = document.getElementById('combo-selection-count');
  if (label) label.innerText = `Selected: ${count}`;
}

// ✅ Load Combo Builder Recipes
function loadComboBuilderOptions() {
  comboContainer.innerHTML = '';
  db.ref('menu').once('value', snap => {
    const data = snap.val();
    if (!data) return;

    Object.entries(data).forEach(([category, items]) => {
      if (category === 'combos') return;

      Object.entries(items).forEach(([id, item]) => {
        const div = document.createElement('div');
        div.className = 'col s12 m6 l4';
        div.innerHTML = `
          <label class="combo-option" style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;transition:0.2s;">
            <input type="checkbox" class="combo-check filled-in" data-id="${id}" data-name="${item.name}" data-image="${item.image}" data-category="${category}" style="pointer-events:auto;" />
            <img src="${item.image}" width="40" height="40" style="object-fit:cover;border-radius:6px;">
            <span style="font-size:14px;">${item.name}</span>
          </label>
        `;
        comboContainer.appendChild(div);
      });
    });

    document.querySelectorAll('.combo-check').forEach(cb => {
      cb.addEventListener('change', updateComboSelectionUI);
    });

    if (!document.getElementById('combo-selection-count')) {
      const counter = document.createElement('p');
      counter.id = 'combo-selection-count';
      counter.style = 'font-weight:600; margin-top:10px;';
      counter.innerText = 'Selected: 0';
      comboContainer.parentElement.insertBefore(counter, comboContainer);
    }

    updateComboSelectionUI();
  });
}

// ✅ Save Combo
if (saveComboBtn) {
  saveComboBtn.addEventListener('click', async () => {
    const name = comboName.value.trim();
    const price = parseFloat(comboPrice.value);
    if (!name || isNaN(price)) return alert("Enter combo name and valid price.");

    const selected = [...document.querySelectorAll('.combo-check:checked')].map(cb => ({
      id: cb.dataset.id,
      name: cb.dataset.name,
      image: cb.dataset.image,
      category: cb.dataset.category
    }));

    if (selected.length < 2) return alert("Select at least 2 recipes.");

    const data = {
      name,
      price,
      items: selected,
      image: selected[0].image,
      type: "combo"
    };

    if (editingComboId) {
      await db.ref(`menu/combos/${editingComboId}`).set(data);
      M.toast({ html: 'Combo updated!', classes: 'blue' });
    } else {
      await db.ref('menu/combos').push(data);
      M.toast({ html: 'Combo saved!', classes: 'green' });
    }

    comboName.value = '';
    comboPrice.value = '';
    editingComboId = null;
    document.querySelectorAll('.combo-check').forEach(cb => cb.checked = false);
    updateComboSelectionUI();
  });
}

// ✅ Edit Combo
function editCombo(id) {
  db.ref(`menu/combos/${id}`).once('value').then(snap => {
    const combo = snap.val();
    if (!combo) return;

    comboName.value = combo.name;
    comboPrice.value = combo.price;
    editingComboId = id;

    document.querySelectorAll('.combo-check').forEach(cb => cb.checked = false);
    combo.items.forEach(sel => {
      const cb = document.querySelector(`.combo-check[data-id="${sel.id}"]`);
      if (cb) cb.checked = true;
    });

    updateComboSelectionUI();
    M.updateTextFields();
    comboName.scrollIntoView({ behavior: 'smooth' });
    M.toast({ html: 'Editing combo...', classes: 'blue' });
  });
}

// ✅ Edit Menu Item
function editItem(category, id, name, price, imageUrl, size7, size10, type, half, full) {
  isEditing = true;
  editingId = id;
  editingCategory = category;

  document.getElementById('item-name').value = decodeURIComponent(name);
  document.getElementById('item-category').value = category;
  document.getElementById('item-image-url').value = decodeURIComponent(imageUrl);

  if (type === 'pizza') {
    priceWrapper.style.display = 'none';
    pizzaWrapper.style.display = 'block';
    noodleWrapper.style.display = 'none';
    price7.value = size7;
    price10.value = size10;
  } else if (type === 'noodles') {
    priceWrapper.style.display = 'none';
    pizzaWrapper.style.display = 'none';
    noodleWrapper.style.display = 'block';
    noodleHalf.value = half;
    noodleFull.value = full;
  } else {
    priceWrapper.style.display = 'block';
    pizzaWrapper.style.display = 'none';
    noodleWrapper.style.display = 'none';
    priceInput.value = price;
  }

  M.updateTextFields();
  const section = document.querySelector('.collapsible li');
  if (section && !section.classList.contains('active')) {
    M.Collapsible.getInstance(document.querySelector('.collapsible')).open(0);
  }
  M.toast({ html: 'Editing mode activated', classes: 'blue' });
}

// ✅ Delete
function deleteItem(category, id) {
  if (confirm("Delete this item?")) {
    db.ref(`menu/${category}/${id}`).remove();
    M.toast({ html: 'Item deleted.', classes: 'red' });
  }
}

// ✅ Search
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll('#menu-items .menu-card').forEach(card => {
      const name = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const category = card.querySelector('.card-content p:nth-child(2)')?.textContent.toLowerCase() || '';
      card.style.display = name.includes(query) || category.includes(query) ? 'block' : 'none';
    });
  });
}

// ✅ Init
document.addEventListener('DOMContentLoaded', () => {
  M.AutoInit();
  loadMenuItems();
  loadComboBuilderOptions();
});
