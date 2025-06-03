const TransactionModel = require('../models/transactionModel');

exports.createTransaction = async (req, res) => {
  const { descricao, valor, tipo, categoria_id, conta_id } = req.body;
  const usuario_id = req.user.id;

  if (!descricao || valor === undefined || isNaN(valor) || !tipo || !categoria_id || !conta_id) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios e valor deve ser um número.' });
  }
  if (!['receita', 'despesa'].includes(tipo.toLowerCase())) {
    return res.status(400).json({ message: 'Tipo inválido. Use "receita" ou "despesa".' });
  }

  try {
    if (!(await TransactionModel.checkCategoria(categoria_id, usuario_id))) {
      return res.status(404).json({ message: 'Categoria não encontrada ou inacessível.' });
    }
    if (!(await TransactionModel.checkConta(conta_id, usuario_id))) {
      return res.status(404).json({ message: 'Conta não encontrada ou inacessível.' });
    }

    const nova = await TransactionModel.create({
      descricao,
      valor,
      tipo: tipo.toLowerCase(),
      categoria_id,
      conta_id,
      usuario_id
    });

    res.status(201).json(nova);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transacoes = await TransactionModel.getAll(req.user.id);
    res.status(200).json(transacoes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transacao = await TransactionModel.getById(req.params.id, req.user.id);
    if (!transacao) {
      return res.status(404).json({ message: 'Transação não encontrada ou inacessível.' });
    }
    res.status(200).json(transacao);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  const { descricao, valor, tipo, categoria_id, conta_id } = req.body;
  const { id } = req.params;
  const usuario_id = req.user.id;

  if (!descricao && valor === undefined && !tipo && !categoria_id && !conta_id) {
    return res.status(400).json({ message: 'Informe pelo menos um campo para atualizar.' });
  }
  if (valor !== undefined && isNaN(valor)) {
    return res.status(400).json({ message: 'Valor deve ser numérico.' });
  }
  if (tipo && !['receita', 'despesa'].includes(tipo.toLowerCase())) {
    return res.status(400).json({ message: 'Tipo inválido.' });
  }

  try {
    if (!(await TransactionModel.checkOwnership(id, usuario_id))) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    if (categoria_id && !(await TransactionModel.checkCategoria(categoria_id, usuario_id))) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    if (conta_id && !(await TransactionModel.checkConta(conta_id, usuario_id))) {
      return res.status(404).json({ message: 'Conta não encontrada.' });
    }

    const campos = {};
    if (descricao) campos.descricao = descricao;
    if (valor !== undefined) campos.valor = valor;
    if (tipo) campos.tipo = tipo.toLowerCase();
    if (categoria_id) campos.categoria_id = categoria_id;
    if (conta_id) campos.conta_id = conta_id;

    const atualizada = await TransactionModel.update(id, usuario_id, campos);
    res.status(200).json(atualizada);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    if (!(await TransactionModel.checkOwnership(req.params.id, req.user.id))) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const excluida = await TransactionModel.delete(req.params.id, req.user.id);
    if (!excluida) {
      return res.status(404).json({ message: 'Transação não encontrada.' });
    }

    res.status(200).json({ message: 'Transação excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
