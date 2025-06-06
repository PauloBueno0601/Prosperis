// routes/index.js
const express = require('express');
const router = express.Router();

// Controllers
const {
  registerUser, loginUser, getAllUsers, getUserById, updateUser, deleteUser
} = require('../controllers/UsuarioController');

const {
  createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory
} = require('../controllers/CategoriaController');

const {
  createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount
} = require('../controllers/ContaController');

const {
  createTransaction, getAllTransactions, getTransactionById, updateTransaction, deleteTransaction
} = require('../controllers/TransacaoController');

// Models para o dashboard
const categoriaModel = require('../models/categoriaModel');
const contaModel = require('../models/contaModel');
const transacaoModel = require('../models/transacaoModel');

// Middleware
const authenticateSession = require('../middleware/auth.js');

// Rota raiz
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Login page
router.get('/login', (req, res) => {
  res.render('pages/login');
});

// Dashboard com dados do banco
router.get('/dashboard', authenticateSession, async (req, res) => {
  const usuarioId = req.session.user.id;

  try {
    const contas = await contaModel.getAllAccounts(usuarioId);
    const categorias = await categoriaModel.getAllCategories(usuarioId);
    const transacoes = await transacaoModel.getAll(usuarioId);

    res.render('pages/dashboard', {
      user: req.session.user,
      contas,
      categorias,
      transacoes
    });
  } catch (err) {
    res.status(500).send('Erro ao carregar o dashboard: ' + err.message);
  }
});

// Auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar a sessão:', err);
      return res.status(500).send('Erro ao encerrar a sessão');
    }
    res.clearCookie('connect.sid'); // limpa o cookie da sessão
    res.sendStatus(200); // sucesso
  });
});

// Usuários
router.get('/users', authenticateSession, getAllUsers);
router.get('/users/:id', authenticateSession, getUserById);
router.put('/users/:id', authenticateSession, updateUser);
router.delete('/users/:id', authenticateSession, deleteUser);

// Categorias
router.post('/api/categorias', authenticateSession, createCategory);
router.get('/api/categorias', authenticateSession, getAllCategories);
router.get('/api/categorias/:id', authenticateSession, getCategoryById);
router.put('/api/categorias/:id', authenticateSession, updateCategory);
router.delete('/api/categorias/:id', authenticateSession, deleteCategory);

// Contas
router.post('/api/contas', authenticateSession, createAccount);
router.get('/api/contas', authenticateSession, getAllAccounts);
router.get('/api/contas/:id', authenticateSession, getAccountById);
router.put('/api/contas/:id', authenticateSession, updateAccount);
router.delete('/api/contas/:id', authenticateSession, deleteAccount);

// Transações
router.post('/api/transacoes', authenticateSession, createTransaction);
router.get('/api/transacoes', authenticateSession, getAllTransactions);
router.get('/api/transacoes/:id', authenticateSession, getTransactionById);
router.put('/api/transacoes/:id', authenticateSession, updateTransaction);
router.delete('/api/transacoes/:id', authenticateSession, deleteTransaction);

module.exports = router;
