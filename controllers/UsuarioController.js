const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em';
    const values = [name, email, hashedPassword];

    const result = await pool.query(query, values);
    const registeredUser = result.rows[0];

    res.status(201).json({
      id: registeredUser.id,
      name: registeredUser.nome,
      email: registeredUser.email,
      created_at: registeredUser.criado_em
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  const query = 'SELECT * FROM usuarios WHERE email = $1';
  const values = [email];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.senha);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.nome, 
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const query = 'SELECT id, nome, email, criado_em FROM usuarios';

  try {
    const result = await pool.query(query);
    const users = result.rows.map(user => ({
      id: user.id,
      name: user.nome,
      email: user.email,
      created_at: user.criado_em
    }));

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1';
  const values = [id];

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = result.rows[0];
    res.status(200).json({
      id: user.id,
      name: user.nome,
      email: user.email,
      created_at: user.criado_em
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  let hashedPassword;
  if (password) {
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao criptografar a senha.' });
    }
  }

  const query = `
    UPDATE usuarios 
    SET nome = $1, email = $2${password ? ', senha = $3' : ''}, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ${password ? '$4' : '$3'} RETURNING id, nome, email, atualizado_em`;

  const values = password ? [name, email, hashedPassword, id] : [name, email, id];

  try {
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const updatedUser = result.rows[0];
    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.nome,
      email: updatedUser.email,
      updated_at: updatedUser.atualizado_em
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
  const values = [id];

  try {
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
