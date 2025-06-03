const categoryModel = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  const { nome } = req.body;
  const usuario_id = req.user.id;

  if (!nome) {
    return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
  }

  try {
    const category = await categoryModel.createCategory(nome, usuario_id);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories(req.user.id);
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const category = await categoryModel.getCategoryById(id, usuario_id);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada ou você não tem acesso.' });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  const usuario_id = req.user.id;

  if (!nome) {
    return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
  }

  try {
    const authorized = await categoryModel.categoryBelongsToUser(id, usuario_id);
    if (!authorized) {
      return res.status(403).json({ message: 'Acesso negado ou categoria não encontrada.' });
    }

    const updated = await categoryModel.updateCategory(id, usuario_id, nome);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const authorized = await categoryModel.categoryBelongsToUser(id, usuario_id);
    if (!authorized) {
      return res.status(403).json({ message: 'Acesso negado ou categoria não encontrada.' });
    }

    await categoryModel.deleteCategory(id, usuario_id);
    res.status(200).json({ message: 'Categoria excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
