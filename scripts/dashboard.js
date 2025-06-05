const user = { name: "Usuário", saldo: 1000 };

let transactions = [
  { id: 1, description: 'Salário', amount: 3500, type: 'income', category: 'Salário', date: '2024-06-01' },
  { id: 2, description: 'Supermercado', amount: -250.50, type: 'expense', category: 'Alimentação', date: '2024-06-02' },
  { id: 3, description: 'Conta de luz', amount: -120.30, type: 'expense', category: 'Casa', date: '2024-06-03' },
];

function updateDashboard() {
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  const balance = user.saldo + total;
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);

  document.getElementById('user-name').textContent = user.name;
  document.getElementById('balance').textContent = `R$ ${balance.toFixed(2)}`;
  document.getElementById('income').textContent = `R$ ${income.toFixed(2)}`;
  document.getElementById('expenses').textContent = `R$ ${expenses.toFixed(2)}`;

  renderTransactions();
  renderChart(income, expenses);
}

function renderTransactions() {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';
  transactions.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.date} - ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category})`;
    list.appendChild(li);
  });
}

document.getElementById('transaction-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const type = document.getElementById('type').value;

  const newTransaction = {
    id: Date.now(),
    description,
    amount,
    type,
    category,
    date: new Date().toISOString().split('T')[0],
  };

  transactions.unshift(newTransaction);
  updateDashboard();
  this.reset();
});

document.getElementById('logout-btn').addEventListener('click', function () {
  alert('Logout realizado!');
  window.location.href = '/login.html';
});

let chart;

function renderChart(income, expenses) {
  const ctx = document.getElementById('financial-chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ['#10b981', '#ef4444']
      }]
    },
    options: {
      responsive: true
    }
  });
}

updateDashboard();
