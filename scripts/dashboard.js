// Dados iniciais zerados
let transactions = [];
let balance = 0; // Saldo inicial zerado

// Função para atualizar os totais
function updateTotals() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  document.getElementById('balance').textContent = `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('income').textContent = `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('expenses').textContent = `R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Função para atualizar a lista de transações
function updateTransactionList() {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';
  transactions.forEach(t => {
    const li = document.createElement('li');
    li.className = t.type;
    li.innerHTML = `<span>${t.description} (${t.category})</span><span>${t.amount < 0 ? '-' : ''}R$ ${Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`;
    list.appendChild(li);
  });
}

// Gráfico financeiro
const ctx = document.getElementById('financial-chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      label: 'Resumo Financeiro',
      data: [
        transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0)
      ],
      backgroundColor: ['#16a34a', '#dc2626'],
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    }
  }
});

// Lidar com o formulário
document.getElementById('transaction-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const description = document.getElementById('description').value;
  let amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const type = document.getElementById('type').value;

  // Ajustar o valor com base no tipo de transação
  if (type === 'expense') {
    amount = -Math.abs(amount); // Garantir que despesa seja negativa
  } else {
    amount = Math.abs(amount); // Garantir que receita seja positiva
  }

  const newTransaction = {
    id: Date.now(),
    description,
    amount,
    type,
    category,
    date: new Date().toISOString().split('T')[0]
  };

  transactions.unshift(newTransaction);
  balance += amount; // Somar ou subtrair do saldo
  updateTotals();
  updateTransactionList();

  // Atualizar o gráfico
  chart.data.datasets[0].data = [
    transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0)
  ];
  chart.update();

  // Limpar o formulário
  e.target.reset();
});

// Simular logout
document.getElementById('logout-btn').addEventListener('click', () => {
  alert('Logout realizado!');
});

// Inicializar ao carregar
updateTotals();
updateTransactionList();