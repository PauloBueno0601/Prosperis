const pool = require('../config/database');

async function createCategory(nome, usuario_id) {
  const query = 'INSERT INTO categorias (nome, usuario_id) VALUES ($1, $2) RETURNING *';
  const values = [nome, usuario_id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getAllCategories(usuario_id) {
  const query = 'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nome ASC';
  const result = await pool.query(query, [usuario_id]);
  return result.rows;
}

async function getCategoryById(id, usuario_id) {
  console.log('Buscando categoria:', { id, usuario_id });
  const query = 'SELECT * FROM categorias WHERE id = $1 AND usuario_id = $2';
  const result = await pool.query(query, [id, usuario_id]);
  console.log('Resultado da busca:', result.rows[0]);
  return result.rows[0];
}

async function updateCategory(id, usuario_id, nome) {
  const query = 'UPDATE categorias SET nome = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *';
  const values = [nome, id, usuario_id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function deleteCategory(id, usuario_id) {
  const query = 'DELETE FROM categorias WHERE id = $1 AND usuario_id = $2 RETURNING *';
  const result = await pool.query(query, [id, usuario_id]);
  return result.rows[0];
}

async function categoryBelongsToUser(id, usuario_id) {
  const query = 'SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2';
  const result = await pool.query(query, [id, usuario_id]);
  return result.rows.length > 0;
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  categoryBelongsToUser
};
