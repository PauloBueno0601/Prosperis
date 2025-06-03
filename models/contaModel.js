const pool = require('../config/database');

async function createAccount(nome, saldo, usuario_id) {
  const query = 'INSERT INTO contas (nome, saldo, usuario_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [nome, saldo, usuario_id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getAllAccounts(usuario_id) {
  const query = 'SELECT * FROM contas WHERE usuario_id = $1 ORDER BY nome ASC';
  const result = await pool.query(query, [usuario_id]);
  return result.rows;
}

async function getAccountById(id, usuario_id) {
  const query = 'SELECT * FROM contas WHERE id = $1 AND usuario_id = $2';
  const result = await pool.query(query, [id, usuario_id]);
  return result.rows[0];
}

async function updateAccount(id, usuario_id, updatesObj) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (updatesObj.nome) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(updatesObj.nome);
  }

  if (updatesObj.saldo !== undefined) {
    updates.push(`saldo = $${paramIndex++}`);
    values.push(updatesObj.saldo);
  }

  const query = `
    UPDATE contas SET ${updates.join(', ')}
    WHERE id = $${paramIndex++} AND usuario_id = $${paramIndex} RETURNING *;
  `;
  values.push(id, usuario_id);

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function deleteAccount(id, usuario_id) {
  const query = 'DELETE FROM contas WHERE id = $1 AND usuario_id = $2 RETURNING *';
  const result = await pool.query(query, [id, usuario_id]);
  return result.rows[0];
}

async function accountBelongsToUser(id, usuario_id) {
  const query = 'SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2';
  const result = await pool.query(query, [id, usuario_id]);
  return result.rows.length > 0;
}

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  accountBelongsToUser
};
