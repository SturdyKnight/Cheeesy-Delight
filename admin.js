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

const form = document.getElementById('menu-form');
const menuList = document.getElementById('menu-items');

// Track editing state
let isEditing = false;
let editingCategory = null;
let editingId = null;

// ✅ Submit Handler (Add or Update)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const category = document.getElementById('item-category').value;
  const imageUrl = document.getElementById('item-image-url').value.trim();

  if (!name || !price || !category || !imageUrl) {
    alert("Please fill all fields.");
    return;
  }

  if (isEditing && editingId && editingCategory) {
    // 🛠️ Update Existing Item
    await db.ref(`menu/${editingCategory}/${editingId}`).remove(); // Remove from old category
    await db.ref(`menu/${category}/${editingId}`).set({ name, price, image: imageUrl }); // Re-add to new or same category
    M.toast({ html: 'Item updated!', classes: 'blue' });
  } else {
    // ➕ Add New Item
    const newItemRef = db.ref(`menu/${category}`).push();
    await newItemRef.set({ name, price, image: imageUrl });
    M.toast({ html: 'Menu item added!', classes: 'green' });
  }

  form.reset();
  M.updateTextFields();
  isEditing = false;
  editingId = null;
  editingCategory = null;
});

// ✅ Load Items Dynamically
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
        card.innerHTML = `
          <div class="card">
            <div class="card-image">
              <img src="${item.image}" style="aspect-ratio: 1 / 1; object-fit: cover;">
              <span class="card-title">${item.name}</span>
            </div>
            <div class="card-content">
              <p>Price: ₹${item.price}</p>
              <p>Category: ${category}</p>
            </div>
            <div class="card-action">
              <a href="#!" onclick="editItem('${category}', '${id}', '${encodeURIComponent(item.name)}', ${item.price}, '${encodeURIComponent(item.image)}')">Edit</a>
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
function editItem(category, id, name, price, imageUrl) {
  isEditing = true;
  editingId = id;
  editingCategory = category;

  document.getElementById('item-name').value = decodeURIComponent(name);
  document.getElementById('item-price').value = price;
  document.getElementById('item-category').value = category;
  document.getElementById('item-image-url').value = decodeURIComponent(imageUrl);

  M.updateTextFields();
  M.toast({ html: 'Editing mode activated', classes: 'blue' });
}

// ✅ Init
window.onload = loadMenuItems;
