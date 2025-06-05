const express = require('express');
const router = express.Router();

// Importe seus controladores
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

// Importe o novo middleware de autenticação via session
const authenticateSession = require('../middleware/auth.js');

// Rota raiz redirecionando para /login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Página de login (renderizada com EJS)
router.get('/login', (req, res) => {
  res.render('pages/login');
});

// Página de dashboard (protegida por autenticação via session)
router.get('/dashboard', authenticateSession, (req, res) => {
  res.render('pages/dashboard', { user: req.session.user });
});

// Rotas de autenticação (não protegidas)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rotas de usuários (protegidas)
router.get('/users', authenticateSession, getAllUsers);
router.get('/users/:id', authenticateSession, getUserById);
router.put('/users/:id', authenticateSession, updateUser);
router.delete('/users/:id', authenticateSession, deleteUser);

// Rotas de categorias (protegidas)
router.post('/categorias', authenticateSession, createCategory);
router.get('/categorias', authenticateSession, getAllCategories);
router.get('/categorias/:id', authenticateSession, getCategoryById);
router.put('/categorias/:id', authenticateSession, updateCategory);
router.delete('/categorias/:id', authenticateSession, deleteCategory);

// Rotas de contas (protegidas)
router.post('/contas', authenticateSession, createAccount);
router.get('/contas', authenticateSession, getAllAccounts);
router.get('/contas/:id', authenticateSession, getAccountById);
router.put('/contas/:id', authenticateSession, updateAccount);
router.delete('/contas/:id', authenticateSession, deleteAccount);

// Rotas de transações (protegidas)
router.post('/transacoes', authenticateSession, createTransaction);
router.get('/transacoes', authenticateSession, getAllTransactions);
router.get('/transacoes/:id', authenticateSession, getTransactionById);
router.put('/transacoes/:id', authenticateSession, updateTransaction);
router.delete('/transacoes/:id', authenticateSession, deleteTransaction);

module.exports = router;
