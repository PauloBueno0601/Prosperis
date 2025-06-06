// Variáveis globais
let transactions = [];
let balance = 0; // Saldo inicial zerado

// Formatar valor monetário
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Atualiza totais de receitas, despesas e saldo na tela
function updateTotals() {
  let receitas = 0;
  let despesas = 0;
  
  transactions.forEach(transaction => {
    if (transaction.tipo === 'receita') {
      receitas += parseFloat(transaction.valor);
    } else {
      despesas += parseFloat(transaction.valor);
    }
  });
  
  balance = receitas - despesas;
  
  document.getElementById('total-receitas').textContent = formatCurrency(receitas);
  document.getElementById('total-despesas').textContent = formatCurrency(despesas);
  document.getElementById('saldo').textContent = formatCurrency(balance);
}

// Atualiza a lista de transações no HTML
function updateTransactionList() {
  const transactionList = document.getElementById('transaction-list');
  transactionList.innerHTML = '';
  
  transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(transaction => {
    const li = document.createElement('li');
    li.className = `transaction-item ${transaction.tipo}`;
    
    const date = new Date(transaction.data);
    const formattedDate = date.toLocaleDateString('pt-BR');
    
    li.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-description">${transaction.descricao}</span>
        <span class="transaction-date">${formattedDate}</span>
      </div>
      <div class="transaction-details">
        <span class="transaction-category">${transaction.categoria}</span>
        <span class="transaction-account">${transaction.conta}</span>
        <span class="transaction-value">${formatCurrency(transaction.valor)}</span>
      </div>
      <div class="transaction-actions">
        <button class="btn-icon edit" data-id="${transaction.id}">✏️</button>
        <button class="btn-icon delete" data-id="${transaction.id}">🗑️</button>
      </div>
    `;
    
    transactionList.appendChild(li);
  });
  
  // Adicionar eventos aos botões de editar e excluir
  addTransactionEditDeleteListeners();
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

// Formatar valor monetário no input
document.getElementById('value').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  value = (parseInt(value) / 100).toFixed(2);
  e.target.value = value.replace('.', ',');
});

// Evento de submit do formulário de transações
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const isEdit = submitBtn.dataset.id;
  
  const data = {
    descricao: document.getElementById('description').value.trim(),
    valor: parseFloat(document.getElementById('value').value.replace(/\./g, '').replace(',', '.')),
    data: document.getElementById('date').value,
    tipo: document.getElementById('type').value,
    categoria_id: document.getElementById('category').value,
    conta_id: document.getElementById('account').value
  };
  
  if (isNaN(data.valor)) {
    alert('Por favor, insira um valor válido');
    return;
  }
  
  try {
    const response = await fetch(`/transacoes${isEdit ? `/${isEdit}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} transação`);
    
    // Limpar formulário
    e.target.reset();
    submitBtn.textContent = 'Adicionar Transação';
    delete submitBtn.dataset.id;
    
    // Recarregar dados
    loadTransactions();
  } catch (err) {
    console.error('Erro:', err.message);
    alert(`Erro ao ${isEdit ? 'atualizar' : 'criar'} transação`);
  }
});

// Evento de logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Erro ao fazer logout');
    
    window.location.href = '/login';
  } catch (err) {
    console.error('Erro:', err.message);
    alert('Erro ao fazer logout');
  }
});

// Carregar dados do usuário
async function loadUserData() {
  try {
    const response = await fetch('/usuarios/profile');
    if (!response.ok) throw new Error('Erro ao buscar dados do usuário');
    
    const user = await response.json();
    document.getElementById('user-name').textContent = user.nome;
    document.getElementById('profile-name').value = user.nome;
    document.getElementById('profile-email').value = user.email;
  } catch (err) {
    console.error('Erro ao carregar dados do usuário:', err.message);
    alert('Erro ao carregar dados do usuário');
  }
}

// Carregar dados iniciais
async function loadInitialData() {
  await Promise.all([
    loadUserData(),
    loadTransactions(),
    loadCategories(),
    loadAccounts()
  ]);
}

// Gerenciamento de Modais
const modals = {
  settings: document.getElementById('settings-modal'),
  category: document.getElementById('category-modal'),
  account: document.getElementById('account-modal')
};

// Botões de abrir modal
document.getElementById('settings-btn').addEventListener('click', () => {
  modals.settings.classList.add('active');
  loadSettingsData();
});

document.getElementById('add-category-btn').addEventListener('click', () => {
  modals.category.classList.add('active');
});

document.getElementById('add-account-btn').addEventListener('click', () => {
  modals.account.classList.add('active');
});

// Botões de fechar modal
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    Object.values(modals).forEach(modal => modal.classList.remove('active'));
  });
});

// Fechar modal ao clicar fora
Object.values(modals).forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Tabs de configurações
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Adiciona active na tab clicada
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
  });
});

// Carregar dados das configurações
async function loadSettingsData() {
  try {
    // Carregar categorias
    const categoriasResponse = await fetch('/categorias');
    if (!categoriasResponse.ok) throw new Error('Erro ao buscar categorias');
    const categorias = await categoriasResponse.json();
    
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = categorias.map(cat => `
      <li>
        <div class="item-info">
          <span class="item-name">${cat.nome}</span>
        </div>
        <div class="item-actions">
          <button class="btn-icon edit" data-id="${cat.id}">✏️</button>
          <button class="btn-icon delete" data-id="${cat.id}">🗑️</button>
        </div>
      </li>
    `).join('');

    // Carregar contas
    const contasResponse = await fetch('/contas');
    if (!contasResponse.ok) throw new Error('Erro ao buscar contas');
    const contas = await contasResponse.json();
    
    const accountsList = document.getElementById('accounts-list');
    accountsList.innerHTML = contas.map(conta => `
      <li>
        <div class="item-info">
          <span class="item-name">${conta.nome}</span>
          <span class="item-balance">Saldo: ${formatCurrency(conta.saldo)}</span>
        </div>
        <div class="item-actions">
          <button class="btn-icon edit" data-id="${conta.id}">✏️</button>
          <button class="btn-icon delete" data-id="${conta.id}">🗑️</button>
        </div>
      </li>
    `).join('');

    // Adicionar eventos aos botões de editar e excluir
    addEditDeleteListeners();
  } catch (err) {
    console.error('Erro ao carregar dados:', err.message);
    alert('Erro ao carregar dados das configurações');
  }
}

// Adicionar eventos aos botões de editar e excluir
function addEditDeleteListeners() {
  // Editar categoria
  document.querySelectorAll('#categories-list .btn-icon.edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/categorias/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar categoria');
        const categoria = await response.json();
        
        document.getElementById('category-name').value = categoria.nome;
        modals.category.classList.add('active');
        // TODO: Implementar edição
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao carregar categoria');
      }
    });
  });

  // Excluir categoria
  document.querySelectorAll('#categories-list .btn-icon.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
      
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/categorias/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir categoria');
        
        loadSettingsData();
        loadInitialData(); // Recarrega os selects do formulário
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao excluir categoria');
      }
    });
  });

  // Editar conta
  document.querySelectorAll('#accounts-list .btn-icon.edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/contas/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar conta');
        const conta = await response.json();
        
        document.getElementById('account-name').value = conta.nome;
        document.getElementById('account-balance').value = conta.saldo;
        modals.account.classList.add('active');
        // TODO: Implementar edição
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao carregar conta');
      }
    });
  });

  // Excluir conta
  document.querySelectorAll('#accounts-list .btn-icon.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
      
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/contas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir conta');
        
        loadSettingsData();
        loadInitialData(); // Recarrega os selects do formulário
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao excluir conta');
      }
    });
  });
}

// Formulário de Nova Categoria
document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('category-name').value.trim();
  
  try {
    const response = await fetch('/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome })
    });

    if (!response.ok) throw new Error('Erro ao criar categoria');

    modals.category.classList.remove('active');
    e.target.reset();
    loadSettingsData();
    loadInitialData(); // Recarrega os selects do formulário
  } catch (err) {
    console.error('Erro:', err.message);
    alert('Erro ao criar categoria');
  }
});

// Formulário de Nova Conta
document.getElementById('account-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('account-name').value.trim();
  const saldo = parseFloat(document.getElementById('account-balance').value.replace(/\./g, '').replace(',', '.'));
  
  if (isNaN(saldo)) {
    alert('Por favor, insira um valor válido para o saldo');
    return;
  }

  try {
    const response = await fetch('/contas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, saldo })
    });

    if (!response.ok) throw new Error('Erro ao criar conta');

    modals.account.classList.remove('active');
    e.target.reset();
    loadSettingsData();
    loadInitialData(); // Recarrega os selects do formulário
  } catch (err) {
    console.error('Erro:', err.message);
    alert('Erro ao criar conta');
  }
});

// Formulário de Perfil
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const senha = document.getElementById('profile-password').value;

  const data = { nome, email };
  if (senha) data.senha = senha;

  try {
    const response = await fetch('/usuarios/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Erro ao atualizar perfil');

    alert('Perfil atualizado com sucesso!');
    document.getElementById('user-name').textContent = nome;
  } catch (err) {
    console.error('Erro:', err.message);
    alert('Erro ao atualizar perfil');
  }
});

// Carregar transações
async function loadTransactions() {
  try {
    const response = await fetch('/transacoes');
    if (!response.ok) throw new Error('Erro ao buscar transações');
    
    transactions = await response.json();
    updateTotals();
    updateTransactionList();
    initializeChart();
  } catch (err) {
    console.error('Erro ao carregar transações:', err.message);
    alert('Erro ao carregar transações');
  }
}

// Carregar categorias
async function loadCategories() {
  try {
    const response = await fetch('/categorias');
    if (!response.ok) throw new Error('Erro ao buscar categorias');
    
    const categorias = await response.json();
    
    // Atualiza select de categorias
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nome;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar categorias:', err.message);
    alert('Erro ao carregar categorias');
  }
}

// Carregar contas
async function loadAccounts() {
  try {
    const response = await fetch('/contas');
    if (!response.ok) throw new Error('Erro ao buscar contas');
    
    const contas = await response.json();
    
    // Atualiza select de contas
    const accountSelect = document.getElementById('account');
    accountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta</option>';
    contas.forEach(conta => {
      const option = document.createElement('option');
      option.value = conta.id;
      option.textContent = conta.nome;
      accountSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar contas:', err.message);
    alert('Erro ao carregar contas');
  }
}

// Adicionar eventos aos botões de editar e excluir transações
function addTransactionEditDeleteListeners() {
  // Editar transação
  document.querySelectorAll('.transaction-item .btn-icon.edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/transacoes/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar transação');
        
        const transaction = await response.json();
        
        // Preencher formulário com dados da transação
        document.getElementById('description').value = transaction.descricao;
        document.getElementById('value').value = transaction.valor;
        document.getElementById('date').value = transaction.data.split('T')[0];
        document.getElementById('type').value = transaction.tipo;
        document.getElementById('category').value = transaction.categoria_id;
        document.getElementById('account').value = transaction.conta_id;
        
        // Atualizar botão de submit
        const submitBtn = document.querySelector('#transaction-form button[type="submit"]');
        submitBtn.textContent = 'Atualizar Transação';
        submitBtn.dataset.id = id;
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao carregar transação');
      }
    });
  });

  // Excluir transação
  document.querySelectorAll('.transaction-item .btn-icon.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
      
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/transacoes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir transação');
        
        loadTransactions();
      } catch (err) {
        console.error('Erro:', err.message);
        alert('Erro ao excluir transação');
      }
    });
  });
}

// Carregar dados iniciais ao iniciar a página
document.addEventListener('DOMContentLoaded', loadInitialData);

// Inicializar gráfico
function initializeChart() {
  const ctx = document.getElementById('chart').getContext('2d');
  
  // Agrupar transações por categoria
  const categoryData = {};
  transactions.forEach(transaction => {
    if (transaction.tipo === 'despesa') {
      if (!categoryData[transaction.categoria]) {
        categoryData[transaction.categoria] = 0;
      }
      categoryData[transaction.categoria] += parseFloat(transaction.valor);
    }
  });
  
  // Criar dados para o gráfico
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  
  // Criar cores aleatórias para cada categoria
  const colors = labels.map(() => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  });
  
  // Destruir gráfico anterior se existir
  if (window.chart) {
    window.chart.destroy();
  }
  
  // Criar novo gráfico
  window.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        title: {
          display: true,
          text: 'Despesas por Categoria'
        }
      }
    }
  });
}
