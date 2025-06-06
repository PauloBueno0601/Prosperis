const bcrypt = require('bcrypt');
const UserModel = require('../models/usuarioModel');
const initUserData = require('../scripts/initUserData');  // Importa o script de inicialização

// Registro de usuário - retorna JSON
exports.registerUser = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = await UserModel.create({ nome, email, senha: hashedPassword });

    // Inicializa categorias e contas padrão para o novo usuário
    await initUserData(user.id);

    return res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};

// Login de usuário - retorna JSON
exports.loginUser = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    // Verifica se o usuário já tem categorias e contas
    const hasCategories = await UserModel.hasCategories(user.id);
    const hasAccounts = await UserModel.hasAccounts(user.id);

    // Se não tiver categorias ou contas, inicializa os dados padrão
    if (!hasCategories || !hasAccounts) {
      await initUserData(user.id);
    }

    req.session.user = {
      id: user.id,
      nome: user.nome,
      email: user.email
    };

    res.status(200).json({ message: 'Login realizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout de usuário - retorna JSON
exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao encerrar a sessão.' });
    }
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  });
};

// Listar todos os usuários (API)
exports.getAllUsers = async (_req, res) => {
  try {
    const users = await UserModel.getAll();
    const formatted = users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      criado_em: u.criado_em
    }));
    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buscar usuário por ID (API)
exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      criado_em: user.criado_em
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar usuário (API)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  if (req.session.user?.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  try {
    let hashedPassword = null;
    if (senha) {
      hashedPassword = await bcrypt.hash(senha, 10);
    }

    const updatedUser = await UserModel.update(id, { nome, email, senha: hashedPassword });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      atualizado_em: updatedUser.atualizado_em
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deletar usuário (API)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.session.user?.id !== parseInt(id)) {
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
