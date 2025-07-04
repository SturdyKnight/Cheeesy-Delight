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

// ✅ DOM
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

// ✅ Track editing
let isEditing = false;
let editingId = null;
let editingCategory = null;

// ✅ Show/hide price fields on category change
categorySelect.addEventListener('change', () => {
  const value = categorySelect.value;
  if (value === 'pizzas') {
    priceWrapper.style.display = 'none';
    pizzaWrapper.style.display = 'block';
    noodleWrapper.style.display = 'none';
  } else if (value === 'noodles') {
    priceWrapper.style.display = 'none';
    pizzaWrapper.style.display = 'none';
    noodleWrapper.style.display = 'block';
  } else {
    priceWrapper.style.display = 'block';
    pizzaWrapper.style.display = 'none';
    noodleWrapper.style.display = 'none';
  }
});

// ✅ Submit handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('item-name').value.trim();
  const category = categorySelect.value;
  const imageUrl = document.getElementById('item-image-url').value.trim();

  let itemData = {};

  if (!name || !category || !imageUrl) {
    alert("Please fill all fields.");
    return;
  }

  if (category === 'pizzas') {
    const val7 = parseFloat(price7.value);
    const val10 = parseFloat(price10.value);
    if (isNaN(val7) || isNaN(val10)) {
      alert("Enter valid prices for both pizza sizes.");
      return;
    }
    itemData = {
      name,
      image: imageUrl,
      type: "pizza",
      size7: val7,
      size10: val10
    };
  } else if (category === 'noodles') {
    const half = parseFloat(noodleHalf.value);
    const full = parseFloat(noodleFull.value);
    if (isNaN(half) || isNaN(full)) {
      alert("Enter valid prices for half and full noodles.");
      return;
    }
    itemData = {
      name,
      image: imageUrl,
      type: "noodles",
      half: half,
      full: full
    };
  } else {
    const val = parseFloat(priceInput.value);
    if (isNaN(val)) {
      alert("Enter a valid price.");
      return;
    }
    itemData = {
      name,
      image: imageUrl,
      price: val
    };
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

// ✅ Load Menu Items
function loadMenuItems() {
  const categories = [
    'starters', 'main-course', 'desserts', 'drinks', 'pizzas', 'combos',
    'momos', 'maggi', 'rice-bowls', 'noodles', 'special-offers', 'fasting'
  ];
  menuList.innerHTML = '';

  categories.forEach(category => {
    db.ref(`menu/${category}`).on('value', snapshot => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(([id, item]) => {
        const card = document.createElement('div');
        card.className = 'col s12 m6 l4';
        let priceText = '';

        if (item.type === 'pizza') {
          priceText = `Price: 7" ₹${item.size7}, 10" ₹${item.size10}`;
        } else if (item.type === 'noodles') {
          priceText = `Price: Half ₹${item.half}, Full ₹${item.full}`;
        } else {
          priceText = `Price: ₹${item.price}`;
        }

        card.innerHTML = `
          <div class="card">
            <div class="card-image">
              <img src="${item.image}" style="aspect-ratio: 1 / 1; object-fit: cover;">
              <span class="card-title">${item.name}</span>
            </div>
            <div class="card-content">
              <p>${priceText}</p>
              <p>Category: ${category}</p>
            </div>
            <div class="card-action">
              <a href="#!" onclick="editItem('${category}', '${id}', '${encodeURIComponent(item.name)}', ${item.price || 0}, '${encodeURIComponent(item.image)}', ${item.size7 || 0}, ${item.size10 || 0}, '${item.type || ''}', ${item.half || 0}, ${item.full || 0})">Edit</a>
              <a href="#!" onclick="deleteItem('${category}', '${id}')">Delete</a>
            </div>
          </div>
        `;
        menuList.appendChild(card);
      });
    });
  });
}

// ✅ Delete Item
function deleteItem(category, id) {
  if (confirm("Delete this item?")) {
    db.ref(`menu/${category}/${id}`).remove();
    M.toast({ html: 'Item deleted.', classes: 'red' });
  }
}

// ✅ Edit Item
function editItem(category, id, name, price, imageUrl, size7 = 0, size10 = 0, type = '', half = 0, full = 0) {
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
  M.toast({ html: 'Editing mode activated', classes: 'blue' });
}

// ✅ Init
window.onload = loadMenuItems;
