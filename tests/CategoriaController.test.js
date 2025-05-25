const CategoriaController = require('../controllers/CategoriaController');
const pool = require('../config/database');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('CategoriaController', () => {
  let req, res;
  const testUserId = 1; 

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: testUserId } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // Testes para createCategory
  describe('createCategory', () => {
    test('deve criar uma nova categoria e retornar 201', async () => {
      const newCategory = { id: 1, nome: 'Alimentação', usuario_id: testUserId };
      req.body = { nome: 'Alimentação' };
      pool.query.mockResolvedValueOnce({ rows: [newCategory] });

      await CategoriaController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newCategory);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO categorias (nome, usuario_id) VALUES ($1, $2) RETURNING *',
        [req.body.nome, testUserId]
      );
    });

    test('deve retornar 400 se o nome da categoria estiver ausente', async () => {
      req.body = {}; // Sem nome

      await CategoriaController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'O nome da categoria é obrigatório.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 500 para erro no DB', async () => {
      req.body = { nome: 'Transporte' };
      pool.query.mockRejectedValueOnce(new Error('DB error on createCategory'));

      await CategoriaController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error on createCategory' });
    });
  });

  // Testes para getAllCategories
  describe('getAllCategories', () => {
    test('deve retornar todas as categorias do usuário e 200', async () => {
      const mockCategories = [
        { id: 1, nome: 'Alimentação', usuario_id: testUserId },
        { id: 2, nome: 'Moradia', usuario_id: testUserId },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockCategories });

      await CategoriaController.getAllCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategories);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nome ASC',
        [testUserId]
      );
    });

    test('deve retornar um array vazio se não houver categorias para o usuário', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await CategoriaController.getAllCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('deve retornar 500 para erro no DB', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error on getAllCategories'));

      await CategoriaController.getAllCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error on getAllCategories' });
    });
  });

  // Testes para getCategoryById
  describe('getCategoryById', () => {
    test('deve retornar a categoria correta do usuário e 200', async () => {
      const mockCategory = { id: 1, nome: 'Alimentação', usuario_id: testUserId };
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [mockCategory] });

      await CategoriaController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM categorias WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 404 se a categoria não for encontrada para o usuário', async () => {
      req.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await CategoriaController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria não encontrada ou você não tem acesso.' });
    });

    test('deve retornar 500 para erro no DB', async () => {
      req.params.id = '1';
      pool.query.mockRejectedValueOnce(new Error('DB error on getCategoryById'));

      await CategoriaController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error on getCategoryById' });
    });
  });

  // Testes para updateCategory
  describe('updateCategory', () => {
    test('deve atualizar uma categoria do usuário e retornar 200', async () => {
      const updatedCategory = { id: 1, nome: 'Alimentação Atualizada', usuario_id: testUserId };
      req.params.id = '1';
      req.body = { nome: 'Alimentação Atualizada' };
      // Primeiro mock para a verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Segundo mock para a query de update
      pool.query.mockResolvedValueOnce({ rows: [updatedCategory] });

      await CategoriaController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedCategory);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE categorias SET nome = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *;',
        [req.body.nome, req.params.id, testUserId]
      );
    });

    test('deve retornar 400 se o nome estiver ausente na atualização', async () => {
      req.params.id = '1';
      req.body = {}; // Sem nome

      await CategoriaController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'O nome da categoria é obrigatório para atualização.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 403 se a categoria não pertencer ao usuário', async () => {
      req.params.id = '1';
      req.body = { nome: 'Outro Nome' };
      // Mock para simular que a categoria não pertence ao usuário
      pool.query.mockResolvedValueOnce({ rows: [] });

      await CategoriaController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou categoria não encontrada para este usuário.' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 500 para erro no DB durante a atualização', async () => {
      req.params.id = '1';
      req.body = { nome: 'Teste' };
      // Mock para verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Mock para erro na query de update
      pool.query.mockRejectedValueOnce(new Error('DB error on updateCategory'));

      await CategoriaController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error on updateCategory' });
    });
  });

  // Testes para deleteCategory
  describe('deleteCategory', () => {
    test('deve deletar uma categoria do usuário e retornar 200', async () => {
      const deletedCategory = { id: 1, nome: 'Alimentação', usuario_id: testUserId };
      req.params.id = '1';
      // Primeiro mock para a verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Segundo mock para a query de delete
      pool.query.mockResolvedValueOnce({ rows: [deletedCategory] });

      await CategoriaController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria excluída com sucesso!' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM categorias WHERE id = $1 AND usuario_id = $2 RETURNING *',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 403 se a categoria não pertencer ao usuário', async () => {
      req.params.id = '1';
      // Mock para simular que a categoria não pertence ao usuário
      pool.query.mockResolvedValueOnce({ rows: [] });

      await CategoriaController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou categoria não encontrada para este usuário.' });
    });

    test('deve retornar 404 se a categoria não for encontrada durante a exclusão', async () => {
      req.params.id = '999';
      // Mock para verificação de propriedade (simula que pertence, mas a deleção não encontra)
      pool.query.mockResolvedValueOnce({ rows: [{ id: 999 }] });
      // Mock para a query de delete (simula que não deletou nada)
      pool.query.mockResolvedValueOnce({ rows: [] });


      await CategoriaController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria não encontrada.' });
    });

    test('deve retornar 500 para erro no DB durante a exclusão', async () => {
      req.params.id = '1';
      // Mock para verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Mock para erro na query de delete
      pool.query.mockRejectedValueOnce(new Error('DB error on deleteCategory'));

      await CategoriaController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error on deleteCategory' });
    });
  });
});