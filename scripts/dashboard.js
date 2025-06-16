// Variáveis globais
let transactions = [];
let balance = 0;

// Função para formatar valores monetários
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

// Função para formatar input de valor em reais
function formatCurrencyInput(input) {
  // Remove tudo que não é número
  let value = input.value.replace(/\D/g, '');
  
  // Converte para número e divide por 100 para considerar os centavos
  value = (parseInt(value) / 100).toFixed(2);
  
  // Formata o número como moeda
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  
  // Atualiza o valor do input
  input.value = formattedValue;
}

// Função para converter valor formatado em número
function parseCurrencyValue(formattedValue) {
  return parseFloat(
    formattedValue
      .replace(/\s|[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  );
}

// Função para atualizar os totais
function updateTotals() {
  const income = transactions
    .filter(tx => tx.tipo === 'receita')
    .reduce((sum, tx) => sum + parseFloat(tx.valor), 0);

  const expenses = transactions
    .filter(tx => tx.tipo === 'despesa')
    .reduce((sum, tx) => sum + parseFloat(tx.valor), 0);

  balance = income - expenses;

  document.getElementById('income').textContent = formatCurrency(income);
  document.getElementById('expenses').textContent = formatCurrency(expenses);
  document.getElementById('balance').textContent = formatCurrency(balance);

  // Atualiza o gráfico
  updateChart(income, expenses);
}

// Função para atualizar o gráfico
function updateChart(income, expenses) {
  const ctx = document.getElementById('financial-chart');
  if (!ctx) return;

  // Destrói o gráfico anterior se existir
  if (window.financialChart) {
    window.financialChart.destroy();
  }

  // Cria o novo gráfico
  window.financialChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderColor: ['#27ae60', '#c0392b'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.raw);
            }
          }
        }
      }
    }
  });
}

// Atualiza a lista de transações no HTML
function updateTransactionList() {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.innerHTML = '';

  transactions
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .forEach(tx => {
      const li = document.createElement('li');
      li.className = `transaction-item ${tx.tipo}`;

      const date = new Date(tx.data);
      const formattedDate = date.toLocaleDateString('pt-BR');

      li.innerHTML = `
        <div class="transaction-info">
          <span class="transaction-description">${tx.descricao}</span>
          <span class="transaction-date">${formattedDate}</span>
        </div>
        <div class="transaction-details">
          <span class="transaction-category">${tx.categoria_nome || 'Sem categoria'}</span>
          <span class="transaction-account">${tx.conta_nome || 'Sem conta'}</span>
          <span class="transaction-value ${tx.tipo === 'receita' ? 'positive' : 'negative'}">
            ${formatCurrency(tx.valor)}
          </span>
        </div>
        <div class="transaction-actions">
          <button class="btn-icon edit" data-id="${tx.id}">✏️</button>
          <button class="btn-icon delete" data-id="${tx.id}">🗑️</button>
        </div>
      `;

      list.appendChild(li);
    });

  addTransactionEditDeleteListeners();
}

// Adiciona listeners para editar/deletar nas transações
function addTransactionEditDeleteListeners() {
  document.querySelectorAll('.transaction-actions .edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const tx = transactions.find(t => t.id == id);
      if (!tx) return alert('Transação não encontrada');

      // Preenche formulário para edição
      document.getElementById('description').value = tx.descricao;
      document.getElementById('value').value = formatCurrency(tx.valor);
      document.getElementById('type').value = tx.tipo;
      document.getElementById('category').value = tx.categoria_id || '';
      document.getElementById('account').value = tx.conta_id || '';

      const submitBtn = document.querySelector('#transaction-form button[type="submit"]');
      submitBtn.textContent = 'Salvar alterações';
      submitBtn.dataset.id = id;
    });
  });

  document.querySelectorAll('.transaction-actions .delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Deseja realmente deletar esta transação?')) return;
      const id = btn.dataset.id;

      try {
        const res = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao deletar transação');

        await loadTransactions();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

// Carregar transações do backend
async function loadTransactions() {
  try {
    const res = await fetch('/api/transacoes');
    if (!res.ok) throw new Error('Erro ao buscar transações');

    transactions = await res.json();
    console.log('Transações carregadas:', transactions);
    
    updateTransactionList();
    updateTotals();
  } catch (err) {
    console.error('Erro ao carregar transações:', err);
    alert(err.message);
  }
}

// Carregar categorias do backend
async function loadCategories() {
  try {
    const response = await fetch('/api/categorias');
    if (!response.ok) throw new Error('Erro ao carregar categorias');
    
    const categorias = await response.json();
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    // Limpa as opções existentes, mantendo apenas a primeira (placeholder)
    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }
    
    // Adiciona as categorias do backend
    categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id;
      option.textContent = categoria.nome;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Função para atualizar a lista de contas
async function updateAccountsList() {
  try {
    const response = await fetch('/api/contas');
    if (!response.ok) {
      throw new Error('Erro ao carregar contas');
    }
    
    const contas = await response.json();
    console.log('Contas carregadas:', contas);
    
    // Atualiza o select de contas no formulário
    const accountSelect = document.getElementById('account');
    if (accountSelect) {
      // Limpa as opções existentes, mantendo apenas a primeira (placeholder)
      while (accountSelect.options.length > 1) {
        accountSelect.remove(1);
      }
      
      // Adiciona as contas do backend
      contas.forEach(conta => {
        const option = document.createElement('option');
        option.value = conta.id;
        option.textContent = conta.nome;
        accountSelect.appendChild(option);
      });
    }

    // Atualiza a lista de contas no painel
    const accountsList = document.getElementById('accountsList');
    if (accountsList) {
      accountsList.innerHTML = '';
      
      contas.forEach(conta => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        accountItem.innerHTML = `
          <div class="account-info">
            <h3>${conta.nome}</h3>
            <p class="account-balance ${conta.saldo >= 0 ? 'positive' : 'negative'}">
              R$ ${conta.saldo.toFixed(2)}
            </p>
          </div>
        `;
        accountsList.appendChild(accountItem);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar contas:', error);
  }
}

// Função para lidar com o envio do formulário
async function handleTransactionSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const isEdit = submitBtn.dataset.id;

  const description = document.getElementById('description').value.trim();
  const rawValue = document.getElementById('value').value.trim();
  const type = document.getElementById('type').value;
  const categoryId = document.getElementById('category').value;
  const accountId = document.getElementById('account').value;

  console.log('Dados do formulário:', {
    description,
    rawValue,
    type,
    categoryId,
    accountId
  });

  if (!description || !rawValue || !type || !categoryId || !accountId) {
    alert('Todos os campos são obrigatórios.');
    return;
  }

  // Usa a nova função para converter o valor
  const valor = parseCurrencyValue(rawValue);

  if (isNaN(valor)) {
    alert('Valor inválido. Digite um número no formato correto (ex: 1.234,56).');
    return;
  }

  const data = {
    descricao: description,
    valor: valor,
    tipo: type,
    categoria_id: parseInt(categoryId),
    conta_id: parseInt(accountId),
  };

  console.log('Dados a serem enviados:', data);

  try {
    const response = await fetch(`/api/transacoes${isEdit ? `/${isEdit}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro na resposta:', error);
      throw new Error(error.message || `Erro ao ${isEdit ? 'atualizar' : 'criar'} transação`);
    }

    const result = await response.json();
    console.log('Transação criada com sucesso:', result);

    e.target.reset();
    submitBtn.textContent = 'Adicionar';
    delete submitBtn.dataset.id;

    await loadTransactions();
    await updateAccountsList();
  } catch (err) {
    console.error('Erro ao processar transação:', err);
    alert(err.message);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  // Adiciona o event listener para o formulário de transações
  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.addEventListener('submit', handleTransactionSubmit);
  }

  // Adiciona o event listener para formatação do campo de valor
  const valueInput = document.getElementById('value');
  if (valueInput) {
    valueInput.addEventListener('input', (e) => {
      formatCurrencyInput(e.target);
    });
    
    // Formata o valor quando o campo recebe foco
    valueInput.addEventListener('focus', (e) => {
      if (!e.target.value) {
        e.target.value = '0,00';
      }
    });
  }

  // Carrega os dados iniciais
  await loadCategories();
  await updateAccountsList();
  await loadTransactions();
});
