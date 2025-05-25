// routes/index.js
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

// Importe o middleware de autenticação
const authenticateToken = require('../middleware/auth'); 


router.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Bem-vindo à Prosperis!',
        endpoints: {
            usuarios: '/usuarios',
            categorias: '/categorias',
            contas: '/contas',
            transacoes: '/transacoes',
        }
    });
});


// Rotas de autenticação (não protegidas)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rotas de usuários (PROTEGIDAS)
router.get('/users', authenticateToken, getAllUsers);
router.get('/users/:id', authenticateToken, getUserById);
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, deleteUser);

// Rotas de categorias (AGORA PROTEGIDAS NOVAMENTE)
router.post('/categorias', authenticateToken, createCategory);
router.get('/categorias', authenticateToken, getAllCategories);
router.get('/categorias/:id', authenticateToken, getCategoryById);
router.put('/categorias/:id', authenticateToken, updateCategory);
router.delete('/categorias/:id', authenticateToken, deleteCategory);

// Rotas de contas (AGORA PROTEGIDAS NOVAMENTE)
router.post('/contas', authenticateToken, createAccount);
router.get('/contas', authenticateToken, getAllAccounts);
router.get('/contas/:id', authenticateToken, getAccountById);
router.put('/contas/:id', authenticateToken, updateAccount);
router.delete('/contas/:id', authenticateToken, deleteAccount);

// Rotas de transações (AGORA PROTEGIDAS NOVAMENTE)
router.post('/transacoes', authenticateToken, createTransaction);
router.get('/transacoes', authenticateToken, getAllTransactions);
router.get('/transacoes/:id', authenticateToken, getTransactionById);
router.put('/transacoes/:id', authenticateToken, updateTransaction);
router.delete('/transacoes/:id', authenticateToken, deleteTransaction);

module.exports = router;