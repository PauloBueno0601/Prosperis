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
router.post('/categorias', authenticateSession, createCategory);
router.get('/categorias', authenticateSession, getAllCategories);
router.get('/categorias/:id', authenticateSession, getCategoryById);
router.put('/categorias/:id', authenticateSession, updateCategory);
router.delete('/categorias/:id', authenticateSession, deleteCategory);

// Contas
router.post('/contas', authenticateSession, createAccount);
router.get('/contas', authenticateSession, getAllAccounts);
router.get('/contas/:id', authenticateSession, getAccountById);
router.put('/contas/:id', authenticateSession, updateAccount);
router.delete('/contas/:id', authenticateSession, deleteAccount);

// Transações
router.post('/transacoes', authenticateSession, createTransaction);
router.get('/transacoes', authenticateSession, getAllTransactions);
router.get('/transacoes/:id', authenticateSession, getTransactionById);
router.put('/transacoes/:id', authenticateSession, updateTransaction);
router.delete('/transacoes/:id', authenticateSession, deleteTransaction);

module.exports = router;
