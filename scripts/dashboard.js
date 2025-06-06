// Variáveis globais
let transactions = [];
let balance = 0;

// Formatar valor monetário (BRL)
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

// Atualiza totais de receitas, despesas e saldo na tela
function updateTotals() {
  let receitas = 0;
  let despesas = 0;

  transactions.forEach(tx => {
    if (tx.tipo === 'receita') receitas += parseFloat(tx.valor);
    else despesas += parseFloat(tx.valor);
  });

  balance = receitas - despesas;

  document.getElementById('income').textContent = formatCurrency(receitas);
  document.getElementById('expenses').textContent = formatCurrency(despesas);
  document.getElementById('balance').textContent = formatCurrency(balance);
}

// Atualiza a lista de transações no HTML
function updateTransactionList() {
  const list = document.getElementById('transaction-list');
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
          <span class="transaction-value">${formatCurrency(tx.valor)}</span>
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
        const res = await fetch(`/transacoes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao deletar transação');

        await loadTransactions();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

// Evento submit do formulário
document.getElementById('transaction-form').addEventListener('submit', async e => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const isEdit = submitBtn.dataset.id;

  const description = document.getElementById('description').value.trim();
  const rawValue = document.getElementById('value').value.trim();
  const type = document.getElementById('type').value;
  const categoryId = document.getElementById('category').value;
  const accountId = document.getElementById('account').value;

  if (!description || !rawValue || !type || !categoryId || !accountId) {
    alert('Todos os campos são obrigatórios.');
    return;
  }

  // 🔧 Conversão segura do valor (corrige erro de R$ 1.600,00 não ser reconhecido)
  const valor = parseFloat(
    rawValue
      .replace(/\s|[^\d,.-]/g, '') // remove espaços e caracteres não numéricos
      .replace(/\./g, '')          // remove pontos de milhar
      .replace(',', '.')           // troca vírgula decimal por ponto
  );

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

  try {
    const response = await fetch(`/transacoes${isEdit ? `/${isEdit}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erro ao ${isEdit ? 'atualizar' : 'criar'} transação`);
    }

    e.target.reset();
    submitBtn.textContent = 'Adicionar';
    delete submitBtn.dataset.id;

    await loadTransactions();
  } catch (err) {
    alert(err.message);
  }
});

// Máscara para valor (formatação BRL) ao perder foco
document.getElementById('value').addEventListener('blur', () => {
  const input = document.getElementById('value');
  const raw = input.value;

  const valor = parseFloat(
    raw
      .replace(/\s|[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  );

  input.value = isNaN(valor) ? '' : formatCurrency(valor);
});

// Carregar transações do backend
async function loadTransactions() {
  try {
    const res = await fetch('/transacoes');
    if (!res.ok) throw new Error('Erro ao buscar transações');

    transactions = await res.json();

    updateTransactionList();
    updateTotals();
  } catch (err) {
    alert(err.message);
  }
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
});
