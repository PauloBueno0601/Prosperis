const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSQLScript() {
  const client = await pool.connect();
  try {
    const sqlScript = fs.readFileSync('scripts/init.sql', 'utf8');
    
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      console.log(`Executando: ${command.substring(0, 50)}...`);
      await client.query(command);
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao executar o script SQL:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSQLScript().catch(err => {
  console.error(' Erro geral:', err.message);
});
