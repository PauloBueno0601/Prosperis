const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes'); // Importa o seu Express Router de routes/index.js
const pool = require('./config/database'); 


pool.connect()
  .then(() => console.log('Conectado ao banco de dados!'))
  .catch((err) => console.error('Erro ao conectar ao banco de dados:', err));

const app = express();
const port = 3001; 

app.use(cors());
app.use(bodyParser.json()); 


app.use('/', routes); 

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`); 
    console.log(`Servidor rodando → http://localhost:${port}/`); // Ajuste a mensagem para refletir a URL base
  });
}

module.exports = app;