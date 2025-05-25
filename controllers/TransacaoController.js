const pool = require('../config/database');

exports.createTransaction = async (req, res) => {
  const { descricao, valor, tipo, categoria_id, conta_id } = req.body;
  const usuario_id = req.user.id; 

  
  if (!descricao || valor === undefined || isNaN(valor) || !tipo || !categoria_id || !conta_id) {
    return res.status(400).json({ message: 'Todos os campos (descrição, valor, tipo, categoria_id, conta_id) são obrigatórios e valor deve ser um número.' });
  }
  if (!['receita', 'despesa'].includes(tipo.toLowerCase())) { 
    return res.status(400).json({ message: 'Tipo de transação inválido. Deve ser "receita" ou "despesa".' });
  }

  try {
    // Verifique se a categoria e a conta pertencem ao usuário autenticado
    const categoriaCheck = await pool.query('SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2', [categoria_id, usuario_id]);
    if (categoriaCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada ou você não tem acesso a ela.' });
    }
    const contaCheck = await pool.query('SELECT id FROM contas WHERE id = $1 AND usuario_id = $2', [conta_id, usuario_id]);
    if (contaCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conta não encontrada ou você não tem acesso a ela.' });
    }

    const query = `
      INSERT INTO transacoes (descricao, valor, tipo, categoria_id, conta_id, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [descricao, valor, tipo.toLowerCase(), categoria_id, conta_id, usuario_id];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  const usuario_id = req.user.id; 
  const query = 'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY data_transacao DESC'; // Adicionei ordenação
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; // Filtrar por usuário autenticado

  const query = 'SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2';
  const values = [id, usuario_id];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transação não encontrada ou você não tem acesso.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, tipo, categoria_id, conta_id } = req.body;
  const usuario_id = req.user.id; // ID do usuário autenticado

  // Validação básica para atualização
  if (!descricao && valor === undefined && !tipo && !categoria_id && !conta_id) {
    return res.status(400).json({ message: 'Pelo menos um campo deve ser fornecido para atualização.' });
  }
  if (valor !== undefined && isNaN(valor)) {
    return res.status(400).json({ message: 'Valor deve ser um número válido.' });
  }
  if (tipo && !['receita', 'despesa'].includes(tipo.toLowerCase())) {
    return res.status(400).json({ message: 'Tipo de transação inválido. Deve ser "receita" ou "despesa".' });
  }

  try {
    // Verifique se a transação pertence ao usuário logado
    const checkOwnership = await pool.query('SELECT 1 FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou transação não encontrada para este usuário.' });
    }

    // Se categoria_id ou conta_id forem fornecidos, valide a propriedade
    if (categoria_id) {
      const categoriaCheck = await pool.query('SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2', [categoria_id, usuario_id]);
      if (categoriaCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Categoria fornecida não encontrada ou não pertence a você.' });
      }
    }
    if (conta_id) {
      const contaCheck = await pool.query('SELECT id FROM contas WHERE id = $1 AND usuario_id = $2', [conta_id, usuario_id]);
      if (contaCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Conta fornecida não encontrada ou não pertence a você.' });
      }
    }


    let query = 'UPDATE transacoes SET ';
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (descricao) {
      updates.push(`descricao = $${paramIndex++}`);
      values.push(descricao);
    }
    if (valor !== undefined) {
      updates.push(`valor = $${paramIndex++}`);
      values.push(valor);
    }
    if (tipo) {
      updates.push(`tipo = $${paramIndex++}`);
      values.push(tipo.toLowerCase());
    }
    if (categoria_id) {
      updates.push(`categoria_id = $${paramIndex++}`);
      values.push(categoria_id);
    }
    if (conta_id) {
      updates.push(`conta_id = $${paramIndex++}`);
      values.push(conta_id);
    }
    updates.push(`atualizado_em = CURRENT_TIMESTAMP`);

    query += updates.join(', ') + ` WHERE id = $${paramIndex} AND usuario_id = $${paramIndex + 1} RETURNING *;`;
    values.push(id, usuario_id);


    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transação não encontrada.' }); // Não deve acontecer após checkOwnership
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; // ID do usuário autenticado

  try {
    // Verifique se a transação pertence ao usuário logado
    const checkOwnership = await pool.query('SELECT 1 FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ message: 'Acesso negado ou transação não encontrada para este usuário.' });
    }

    const query = 'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2 RETURNING *';
    const values = [id, usuario_id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transação não encontrada.' }); 
    }
    res.status(200).json({ message: 'Transação excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};