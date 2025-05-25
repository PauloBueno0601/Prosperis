const pool = require('../config/database');

exports.createCategory = async (req, res) => {
  const { nome } = req.body;
  const usuario_id = req.user.id; 

  if (!nome) {
    return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
  }

  const query = 'INSERT INTO categorias (nome, usuario_id) VALUES ($1, $2) RETURNING *';
  const values = [nome, usuario_id];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  const usuario_id = req.user.id; // Filtrar por usuário autenticado
  const query = 'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nome ASC'; 
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; 

  const query = 'SELECT * FROM categorias WHERE id = $1 AND usuario_id = $2';
  const values = [id, usuario_id];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      // Retorna 404 para não revelar se a categoria existe mas não pertence ao usuário
      return res.status(404).json({ message: 'Categoria não encontrada ou você não tem acesso.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  const usuario_id = req.user.id; // ID do usuário autenticado

  if (!nome) {
    return res.status(400).json({ message: 'O nome da categoria é obrigatório para atualização.' });
  }

  try {
    // Verifique se a categoria pertence ao usuário logado
    const checkOwnership = await pool.query('SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou categoria não encontrada para este usuário.' });
    }

    const query = 'UPDATE categorias SET nome = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *;';
    const values = [nome, id, usuario_id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada.' }); // Geralmente não deve acontecer após checkOwnership
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; // ID do usuário autenticado

  try {
    // Verifique se a categoria pertence ao usuário logado
    const checkOwnership = await pool.query('SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou categoria não encontrada para este usuário.' });
    }

    const query = 'DELETE FROM categorias WHERE id = $1 AND usuario_id = $2 RETURNING *';
    const values = [id, usuario_id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada.' }); // Geralmente não deve acontecer após checkOwnership
    }
    res.status(200).json({ message: 'Categoria excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};