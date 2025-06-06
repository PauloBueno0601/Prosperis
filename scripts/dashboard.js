// Dados iniciais
let transactions = [];
let balance = 0; // Saldo inicial zerado

// Formata número para moeda BRL
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Atualiza totais de receitas, despesas e saldo na tela
function updateTotals() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  balance = transactions.reduce((acc, t) => acc + t.amount, 0);

  document.getElementById('balance').textContent = formatCurrency(balance);
  document.getElementById('income').textContent = formatCurrency(totalIncome);
  document.getElementById('expenses').textContent = formatCurrency(Math.abs(totalExpenses));
}

// Atualiza a lista de transações no HTML
function updateTransactionList() {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';

  transactions.slice().reverse().forEach(t => {
    const li = document.createElement('li');
    li.className = t.type;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'transaction-details';

    const descriptionSpan = document.createElement('span');
    descriptionSpan.className = 'description';
    descriptionSpan.textContent = t.description;
    detailsDiv.appendChild(descriptionSpan);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'category';
    categorySpan.textContent = t.category;
    detailsDiv.appendChild(categorySpan);

    li.appendChild(detailsDiv);

    const amountSpan = document.createElement('span');
    amountSpan.className = `amount ${t.type}`;
    amountSpan.textContent = formatCurrency(t.amount);
    li.appendChild(amountSpan);

    list.appendChild(li);
  });
}

// Configura o gráfico financeiro com Chart.js
const ctx = document.getElementById('financial-chart').getContext('2d');
let financialChart;

function initializeChart() {
  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  if (financialChart) {
    financialChart.destroy();
  }

  financialChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        label: 'Resumo Financeiro',
        data: [incomeTotal, expenseTotal],
        backgroundColor: ['rgba(39, 174, 96, 0.7)', 'rgba(231, 76, 60, 0.7)'],
        borderColor: ['rgba(39, 174, 96, 1)', 'rgba(231, 76, 60, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => {
              let label = ctx.dataset.label || '';
              if (label) label += ': ';
              if (ctx.parsed.y !== null) label += formatCurrency(ctx.parsed.y);
              return label;
            }
          }
        }
      }
    }
  });
}

// Atualiza dados do gráfico
function updateChartData() {
  if (!financialChart) return;

  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  financialChart.data.datasets[0].data = [incomeTotal, expenseTotal];
  financialChart.update();
}

// Máscara para formatação do campo de valor
const amountInput = document.getElementById('amount');
amountInput.addEventListener('input', (e) => {
  let value = e.target.value;
  value = value.replace(/\D/g, '');
  value = (Number(value) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  e.target.value = value;
});

// Manipulador do formulário — envia para seu backend
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amountInputValue = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const type = document.getElementById('type').value;

  if (!description || !amountInputValue || !category) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  let amount = parseFloat(amountInputValue.replace(/\./g, '').replace(',', '.'));
  if (isNaN(amount)) {
    alert('Por favor, insira um valor numérico válido.');
    return;
  }

  amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
  const date = new Date().toISOString();

  try {
    const response = await fetch('/transacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, type, category, date })
    });

    if (!response.ok) throw new Error('Erro ao adicionar transação');

    const data = await response.json();
    transactions.unshift(data);

    updateTotals();
    updateTransactionList();
    updateChartData();

    e.target.reset();
  } catch (err) {
    console.error('Erro ao adicionar transação:', err.message);
    alert('Erro ao adicionar transação no servidor');
  }
});

// Botão logout
document.getElementById('logout-btn').addEventListener('click', () => {
  fetch('/logout', { method: 'POST' })
    .then(() => {
      transactions = [];
      balance = 0;
      updateTotals();
      updateTransactionList();
      updateChartData();
      window.location.href = '/login';
    })
    .catch(err => {
      console.error('Erro no logout:', err);
      alert('Erro ao tentar sair. Tente novamente.');
    });
});

// Carrega dados do backend ao iniciar
async function loadInitialData() {
  try {
    const response = await fetch('/transacoes');
    if (!response.ok) throw new Error('Erro ao buscar transações');
    transactions = await response.json();

    updateTotals();
    updateTransactionList();
    initializeChart();
  } catch (err) {
    console.error('Erro ao carregar transações:', err.message);
    alert('Erro ao carregar as transações do servidor');
  }
}

document.addEventListener('DOMContentLoaded', loadInitialData);
