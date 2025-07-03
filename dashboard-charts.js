// ✅ Uses global `db` from owner.js
let pieChart, salesChart, ordersChart;
let currentStart = 0;
let currentEnd = Date.now();

const todayStr = new Date().toISOString().split("T")[0];

// ✅ Date Filter Modal (Modern, Mobile-Ready)
const dateFilterHTML = `
  <div id="dateFilter" style="
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
    font-family: 'Inter', sans-serif;
  ">
    <div style="
      background: #fff;
      padding: 24px 20px;
      border-radius: 12px;
      width: 90%;
      max-width: 350px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      text-align: center;
    ">
      <h5 style="margin-bottom: 16px;">📅 Filter by Date</h5>
      <input type="date" id="startDate" max="${todayStr}" style="width: 100%; margin-bottom: 10px; padding: 8px; border-radius: 6px; border: 1px solid #ccc;" />
      <input type="date" id="endDate" max="${todayStr}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;" />
      <div style="margin-top: 16px; display: flex; justify-content: space-between;">
        <button onclick="closeDateFilter()" style="padding: 8px 12px; background: #eee; border: none; border-radius: 6px;">Cancel</button>
        <button onclick="applyDateFilter()" style="padding: 8px 12px; background: #ff7043; color: white; border: none; border-radius: 6px;">Apply</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', dateFilterHTML);

// ✅ Date Filter Logic
function closeDateFilter() {
  document.getElementById('dateFilter').style.display = 'none';
}
function applyDateFilter() {
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  if (!s || !e) return alert('Please select both dates');
  if (e < s) return alert("End date can't be before start date");

  currentStart = new Date(s).getTime();
  currentEnd = new Date(e).getTime() + 86400000; // add full day
  renderCharts(globalData);
  closeDateFilter();
}

// ⌨️ Hotkeys: F = filter | ESC = close
window.addEventListener('keydown', e => {
  if (e.key === 'f') document.getElementById('dateFilter').style.display = 'flex';
  if (e.key === 'Escape') closeDateFilter();
});

// ✅ Global live snapshot
let globalData = {};

// ✅ Realtime Orders Listener
db.ref('orders').on('value', snapshot => {
  globalData = snapshot.val() || {};
  renderCharts(globalData);
});

// ✅ Renderer
function renderCharts(data) {
  const itemCount = {}; // 🧾 item name → qty
  const monthly = {};
  let totalSales = 0, totalOrders = 0;

  Object.values(data).forEach(order => {
    if (!order.timestamp || order.status !== 'done') return;

    const ts = new Date(order.timestamp).getTime();
    if (ts < currentStart || ts > currentEnd) return;

    // Monthly grouping
    const mKey = new Date(ts).toLocaleDateString('default', { year: 'numeric', month: 'short' });
    monthly[mKey] = monthly[mKey] || { sales: 0, orders: 0 };
    monthly[mKey].sales += order.total || 0;
    monthly[mKey].orders += 1;

    totalSales += order.total || 0;
    totalOrders += 1;

    // Count items
    (order.items || []).forEach(i => {
      const name = i.name || 'Unknown';
      itemCount[name] = (itemCount[name] || 0) + (i.qty || 0);
    });
  });

  // 🔁 Update total sales
  const totalDiv = document.getElementById('total-sales');
  if (totalDiv) totalDiv.textContent = `Total Sales: ₹${totalSales}`;

  // 🥧 PIE CHART — Most Ordered Items
  const pieCtx = document.getElementById('categoryPieChart')?.getContext('2d');
  if (pieCtx) {
    const sortedItems = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // top 6

    const pieLabels = sortedItems.map(i => i[0]);
    const pieData = sortedItems.map(i => i[1]);

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: ['#FFAB91', '#A5D6A7', '#CE93D8', '#90CAF9', '#FFD54F', '#80DEEA']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // 📈 Revenue & Orders Line Charts
  const sorted = Object.entries(monthly).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const labels = sorted.map(x => x[0]);
  const salesData = sorted.map(x => x[1].sales);
  const ordersData = sorted.map(x => x[1].orders);

  const salesCtx = document.getElementById('salesChart')?.getContext('2d');
  if (salesCtx) {
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: salesData,
          borderColor: '#FF7043',
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const ordersCtx = document.getElementById('ordersChart')?.getContext('2d');
  if (ordersCtx) {
    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(ordersCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Orders',
          data: ordersData,
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
