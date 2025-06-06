const pool = require('../config/database');
const categoriaModel = require('../models/categoriaModel');
const contaModel = require('../models/contaModel');

async function initUserData(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Categorias padrão
    const categorias = [
      'Saúde',
      'Alimentação',
      'Transporte',
      'Lazer',
      'Educação',
      'Moradia',
      'Outros'
    ];

    // Contas padrão
    const contas = [
      { nome: 'Conta corrente', saldo: 0 },
      { nome: 'Conta poupança', saldo: 0 },
      { nome: 'Cartão de crédito', saldo: 0 },
      { nome: 'Conta principal', saldo: 0 }
    ];

    // Busca categorias existentes
    const categoriasExistentes = await categoriaModel.getAllCategories(userId);
    const nomesExistentes = categoriasExistentes.map(cat => cat.nome.toLowerCase());

    // Insere apenas categorias que não existem
    for (const nome of categorias) {
      if (!nomesExistentes.includes(nome.toLowerCase())) {
        await categoriaModel.createCategory(nome, userId);
      }
    }

    // Busca contas existentes
    const contasExistentes = await contaModel.getAllAccounts(userId);
    const nomesContasExistentes = contasExistentes.map(conta => conta.nome.toLowerCase());

    // Insere apenas contas que não existem
    for (const conta of contas) {
      if (!nomesContasExistentes.includes(conta.nome.toLowerCase())) {
        await contaModel.createAccount(conta.nome, conta.saldo, userId);
      }
    }

    await client.query('COMMIT');
    console.log('Dados padrão criados com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar dados padrão:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = initUserData; 