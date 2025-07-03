// ✅ Uses global `db` from owner.js

let pieChart, salesChart, ordersChart;

const todayStr = new Date().toISOString().split("T")[0];
const dateFilterHTML = `
  <div id="dateFilter" style="
    position: fixed; top: 50%; left:50%;
    transform: translate(-50%,-50%);
    background:white; padding:20px; border-radius:8px;
    box-shadow:0 2px 10px rgba(0,0,0,0.2); display:none; z-index:1000;">
    <h6>Select Date Range</h6>
    <input type="date" id="startDate" max="${todayStr}" /> to
    <input type="date" id="endDate" max="${todayStr}" />
    <div style="text-align:right;margin-top:12px">
      <button onclick="applyDateFilter()">Apply</button>
      <button onclick="closeDateFilter()">Cancel</button>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', dateFilterHTML);

function closeDateFilter() {
  document.getElementById('dateFilter').style.display = 'none';
}

function applyDateFilter() {
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  if (!s || !e) return alert('Please select both dates');
  if (e < s) return alert("End date can't be before start date");

  const start = new Date(s).getTime();
  const end = new Date(e).getTime() + 24 * 3600 * 1000;
  fetchAndRender(start, end);
  closeDateFilter();
}

window.addEventListener('keydown', e => {
  if (e.key === 'f') {
    document.getElementById('dateFilter').style.display = 'block';
  }
});

function fetchAndRender(start = 0, end = Date.now()) {
  db.ref('orders').once('value', snap => {
    const data = snap.val() || {};
    const catSales = { starters: 0, "main-course": 0, desserts: 0, drinks: 0 };
    const monthly = {};
    let totalSales = 0, totalOrders = 0;

    Object.values(data).forEach(o => {
      if (!o.timestamp) return;
      const ts = new Date(o.timestamp).getTime();
      if (ts < start || ts > end) return;

      const m = new Date(ts).toLocaleDateString('default', { year: 'numeric', month: 'short' });
      monthly[m] = monthly[m] || { sales: 0, orders: 0 };

      if (o.status === 'done') {
        totalSales += o.total;
        totalOrders += 1;
        monthly[m].sales += o.total;
        monthly[m].orders += 1;

        (o.items || []).forEach(i => {
          if (i.category && catSales[i.category] !== undefined) {
            catSales[i.category] += i.price * i.qty;
          }
        });
      }
    });

    // 🧾 Update total sales label
    const salesDiv = document.getElementById('total-sales');
    if (salesDiv) salesDiv.textContent = `Total Sales: ₹${totalSales}`;

    // 🥧 Pie Chart: Category Sales
    const pieCtx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (pieCtx) {
      if (pieChart) pieChart.destroy();
      pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(catSales),
          datasets: [{
            data: Object.values(catSales),
            backgroundColor: ['#FFAB91', '#A5D6A7', '#CE93D8', '#90CAF9'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    const sorted = Object.entries(monthly).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const labels = sorted.map(x => x[0]);
    const salesData = sorted.map(x => x[1].sales);
    const ordersData = sorted.map(x => x[1].orders);

    // 📈 Sales Chart
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

    // 📈 Orders Chart
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
  });
}

// 🔁 Initial render
fetchAndRender();
