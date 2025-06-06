const pool = require('../config/database');

async function initUserData(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Inserir categorias padrão
    const categorias = [
      { nome: 'Saúde' },
      { nome: 'Alimentação' },
      { nome: 'Transporte' },
      { nome: 'Lazer' },
      { nome: 'Educação' },
      { nome: 'Moradia' },
      { nome: 'Outros' }
    ];

    for (const categoria of categorias) {
      await client.query(
        'INSERT INTO categorias (nome, usuario_id) VALUES ($1, $2)',
        [categoria.nome, userId]
      );
    }

    // Inserir contas padrão
    const contas = [
      { nome: 'Conta corrente', saldo: 0 },
      { nome: 'Conta poupança', saldo: 0 },
      { nome: 'Cartão de crédito', saldo: 0 }
    ];

    for (const conta of contas) {
      await client.query(
        'INSERT INTO contas (nome, saldo, usuario_id) VALUES ($1, $2, $3)',
        [conta.nome, conta.saldo, userId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initUserData; 