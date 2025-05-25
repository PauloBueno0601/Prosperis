const pool = require('../config/database');

exports.createAccount = async (req, res) => {
  const { nome, saldo } = req.body;
  const usuario_id = req.user.id; 

  if (!nome || saldo === undefined || isNaN(saldo)) { 
    return res.status(400).json({ message: 'Nome e saldo da conta são obrigatórios e saldo deve ser um número.' });
  }

  const query = 'INSERT INTO contas (nome, saldo, usuario_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [nome, saldo, usuario_id];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  const usuario_id = req.user.id; 
  const query = 'SELECT * FROM contas WHERE usuario_id = $1 ORDER BY nome ASC';
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; // Filtrar por usuário autenticado

  const query = 'SELECT * FROM contas WHERE id = $1 AND usuario_id = $2';
  const values = [id, usuario_id];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conta não encontrada ou você não tem acesso.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  const { id } = req.params;
  const { nome, saldo } = req.body;
  const usuario_id = req.user.id; // ID do usuário autenticado

  if (!nome && saldo === undefined) {
    return res.status(400).json({ message: 'Pelo menos o nome ou saldo deve ser fornecido para atualização.' });
  }
  if (saldo !== undefined && isNaN(saldo)) {
    return res.status(400).json({ message: 'Saldo deve ser um número válido.' });
  }

  try {
    // Verifique se a conta pertence ao usuário logado
    const checkOwnership = await pool.query('SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    }

    let query = 'UPDATE contas SET ';
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nome) {
      updates.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (saldo !== undefined) {
      updates.push(`saldo = $${paramIndex++}`);
      values.push(saldo);
    }

    query += updates.join(', ') + ` WHERE id = $${paramIndex} AND usuario_id = $${paramIndex + 1} RETURNING *;`;
    values.push(id, usuario_id);


    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conta não encontrada.' }); // Geralmente não deve acontecer
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; 

  try {
    
    const checkOwnership = await pool.query('SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    }

    const query = 'DELETE FROM contas WHERE id = $1 AND usuario_id = $2 RETURNING *';
    const values = [id, usuario_id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conta não encontrada.' }); 
    }
    res.status(200).json({ message: 'Conta excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};