const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session'); // <- Importar express-session

const routes = require('./routes'); // index.js
const pool = require('./config/database');

pool.connect()
  .then(() => console.log('Conectado ao banco de dados!'))
  .catch((err) => console.error('Erro ao conectar ao banco de dados:', err));

const app = express();
const port = 3001;

// View engine: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para arquivos estáticos (CSS, imagens)
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para forms HTML

// Configuração de sessão
app.use(session({
  secret: 'sua_chave_secreta_super_segura',  // <- Troque por uma chave forte
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));

// Middleware para expor o usuário logado nas views (opcional)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rotas
app.use('/', routes);

// Inicia o servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse → http://localhost:${port}/`);
  });
}

module.exports = app;
