const accountModel = require('../models/contaModel');

exports.createAccount = async (req, res) => {
  const { nome, saldo } = req.body;
  const usuario_id = req.user.id;

  if (!nome || saldo === undefined || isNaN(saldo)) {
    return res.status(400).json({ message: 'Nome e saldo da conta são obrigatórios e saldo deve ser um número.' });
  }

  try {
    const account = await accountModel.createAccount(nome, saldo, usuario_id);
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const accounts = await accountModel.getAllAccounts(usuario_id);
    res.status(200).json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const account = await accountModel.getAccountById(id, usuario_id);
    if (!account) {
      return res.status(404).json({ message: 'Conta não encontrada ou você não tem acesso.' });
    }
    res.status(200).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  const { id } = req.params;
  const { nome, saldo } = req.body;
  const usuario_id = req.user.id;

  if (!nome && saldo === undefined) {
    return res.status(400).json({ message: 'Pelo menos o nome ou saldo deve ser fornecido para atualização.' });
  }
  if (saldo !== undefined && isNaN(saldo)) {
    return res.status(400).json({ message: 'Saldo deve ser um número válido.' });
  }

  try {
    const authorized = await accountModel.accountBelongsToUser(id, usuario_id);
    if (!authorized) {
      return res.status(403).json({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    }

    const updated = await accountModel.updateAccount(id, usuario_id, { nome, saldo });
    if (!updated) {
      return res.status(404).json({ message: 'Conta não encontrada.' });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const authorized = await accountModel.accountBelongsToUser(id, usuario_id);
    if (!authorized) {
      return res.status(403).json({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    }

    const deleted = await accountModel.deleteAccount(id, usuario_id);
    if (!deleted) {
      return res.status(404).json({ message: 'Conta não encontrada.' });
    }
    res.status(200).json({ message: 'Conta excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
