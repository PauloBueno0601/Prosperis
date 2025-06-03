const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/usuarioModel');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, hashedPassword });

    res.status(201).json({
      id: user.id,
      name: user.nome,
      email: user.email,
      created_at: user.criado_em
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

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

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

exports.getAllUsers = async (_req, res) => {
  try {
    const users = await UserModel.getAll();
    const formatted = users.map(u => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      created_at: u.criado_em
    }));
    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

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

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await UserModel.update({ id, name, email, hashedPassword });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

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

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const deleted = await UserModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
