const db = require('../config/database');

class User {
  static async getAll() {
    const result = await db.query('SELECT * FROM usuarios');
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
      [data.nome, data.email, data.senha]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    if (data.senha) {
      const result = await db.query(
        'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4 RETURNING *',
        [data.nome, data.email, data.senha, id]
      );
      return result.rows[0];
    } else {
      const result = await db.query(
        'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING *',
        [data.nome, data.email, id]
      );
      return result.rows[0];
    }
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
    return result.rowCount > 0;
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  }
}

module.exports = User;
