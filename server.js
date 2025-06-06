const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const routes = require('./routes'); // Arquivo de rotas
const pool = require('./config/database'); // Conexão com o banco de dados

// Conexão com o banco de dados
pool.connect()
  .then(() => console.log('Conectado ao banco de dados!'))
  .catch((err) => console.error('Erro ao conectar ao banco de dados:', err));

const app = express();
const PORT = process.env.PORT || 3002;

// Configura o motor de visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve arquivos estáticos da pasta views/css (CSS)
app.use('/css', express.static(path.join(__dirname, 'views/css')));

// Serve arquivos estáticos da pasta scripts (JS)
app.use('/js', express.static(path.join(__dirname, 'scripts')));

// Middlewares
app.use(cors()); // Habilita CORS para requisições cruzadas
app.use(bodyParser.json()); // Parseia JSON nas requisições
app.use(bodyParser.urlencoded({ extended: true })); // Parseia dados de formulários

// Configuração da sessão
app.use(session({
  secret: '010067', // TODO: Substitua por uma chave segura (ex.: crypto.randomBytes(32).toString('hex'))
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } // Duração da sessão: 1 hora
}));

// Expõe o usuário logado para as views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Define as rotas
app.use('/', routes);

// Inicia o servidor (exceto em ambiente de teste)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse → http://localhost:${PORT}/`);
  });
}

module.exports = app;