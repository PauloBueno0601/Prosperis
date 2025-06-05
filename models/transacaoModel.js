const pool = require('../config/database');

const TransactionModel = {
  async create({ descricao, valor, tipo, categoria_id, conta_id, usuario_id }) {
    const query = `
      INSERT INTO transacoes (descricao, valor, tipo, categoria_id, conta_id, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [descricao, valor, tipo, categoria_id, conta_id, usuario_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getAll(usuario_id) {
    const query = 'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY data DESC'; // CORRIGIDO AQUI
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  },

  async getById(id, usuario_id) {
    const query = 'SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2';
    const result = await pool.query(query, [id, usuario_id]);
    return result.rows[0];
  },

  async update(id, usuario_id, updates) {
    const campos = [];
    const values = [];
    let index = 1;

    for (const campo in updates) {
      campos.push(`${campo} = $${index++}`);
      values.push(updates[campo]);
    }

    campos.push(`atualizado_em = CURRENT_TIMESTAMP`);
    values.push(id, usuario_id);

    const query = `
      UPDATE transacoes SET ${campos.join(', ')}
      WHERE id = $${index++} AND usuario_id = $${index} RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async delete(id, usuario_id) {
    const query = 'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2 RETURNING *';
    const result = await pool.query(query, [id, usuario_id]);
    return result.rows[0];
  },

  async checkOwnership(id, usuario_id) {
    const result = await pool.query('SELECT 1 FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    return result.rows.length > 0;
  },

  async checkCategoria(categoria_id, usuario_id) {
    const result = await pool.query('SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2', [categoria_id, usuario_id]);
    return result.rows.length > 0;
  },

  async checkConta(conta_id, usuario_id) {
    const result = await pool.query('SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2', [conta_id, usuario_id]);
    return result.rows.length > 0;
  }
};

module.exports = TransactionModel;
