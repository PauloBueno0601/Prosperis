const TransacaoController = require('../controllers/TransacaoController');
const pool = require('../config/database');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('TransacaoController', () => {
  let req, res;
  const testUserId = 1; // ID de um usuário de teste
  const testCategoryId = 10;
  const testAccountId = 20;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: testUserId } // Mock do usuário autenticado
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // Testes para createTransaction
  describe('createTransaction', () => {
    const newTransactionBody = {
      descricao: 'Compra de Mercado',
      valor: 150.75,
      tipo: 'despesa',
      categoria_id: testCategoryId,
      conta_id: testAccountId
    };
    const createdTransaction = { id: 1, ...newTransactionBody, usuario_id: testUserId, data_transacao: new Date().toISOString() };

    test('deve criar uma nova transação e retornar 201', async () => {
      req.body = newTransactionBody;
      // Mocks para verificação de propriedade de categoria e conta
      pool.query.mockResolvedValueOnce({ rows: [{ id: testCategoryId }] }); // Categoria pertence
      pool.query.mockResolvedValueOnce({ rows: [{ id: testAccountId }] }); // Conta pertence
      // Mock para a inserção da transação
      pool.query.mockResolvedValueOnce({ rows: [createdTransaction] });

      await TransacaoController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdTransaction);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2',
        [testCategoryId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM contas WHERE id = $1 AND usuario_id = $2',
        [testAccountId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transacoes'),
        [
          newTransactionBody.descricao,
          newTransactionBody.valor,
          newTransactionBody.tipo,
          newTransactionBody.categoria_id,
          newTransactionBody.conta_id,
          testUserId
        ]
      );
    });

    test('deve retornar 400 se faltarem campos obrigatórios', async () => {
      req.body = { descricao: 'Teste' }; // Faltando valor, tipo, categoria_id, conta_id

      await TransacaoController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Todos os campos (descrição, valor, tipo, categoria_id, conta_id) são obrigatórios e valor deve ser um número.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 400 se o tipo de transação for inválido', async () => {
      req.body = { ...newTransactionBody, tipo: 'invalido' };

      await TransacaoController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tipo de transação inválido. Deve ser "receita" ou "despesa".' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se a categoria não pertencer ao usuário', async () => {
      req.body = newTransactionBody;
      pool.query.mockResolvedValueOnce({ rows: [] }); // Categoria NÃO pertence

      await TransacaoController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria não encontrada ou você não tem acesso a ela.' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2',
        [testCategoryId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledTimes(1); // Apenas a primeira query de verificação
    });

    test('deve retornar 404 se a conta não pertencer ao usuário', async () => {
      req.body = newTransactionBody;
      pool.query.mockResolvedValueOnce({ rows: [{ id: testCategoryId }] }); // Categoria pertence
      pool.query.mockResolvedValueOnce({ rows: [] }); // Conta NÃO pertence

      await TransacaoController.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta não encontrada ou você não tem acesso a ela.' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2',
        [testCategoryId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM contas WHERE id = $1 AND usuario_id = $2',
        [testAccountId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledTimes(2); // Duas queries de verificação
    });
  });

  // Testes para getAllTransactions
  describe('getAllTransactions', () => {
    test('deve retornar todas as transações do usuário e 200', async () => {
      const mockTransactions = [
        { id: 1, descricao: 'Salário', valor: 2000, tipo: 'receita', usuario_id: testUserId },
        { id: 2, descricao: 'Aluguel', valor: 800, tipo: 'despesa', usuario_id: testUserId },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockTransactions });

      await TransacaoController.getAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY data_transacao DESC',
        [testUserId]
      );
    });
  });

  // Testes para getTransactionById
  describe('getTransactionById', () => {
    test('deve retornar a transação correta do usuário e 200', async () => {
      const mockTransaction = { id: 1, descricao: 'Salário', valor: 2000, tipo: 'receita', usuario_id: testUserId };
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [mockTransaction] });

      await TransacaoController.getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransaction);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 404 se a transação não for encontrada para o usuário', async () => {
      req.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await TransacaoController.getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Transação não encontrada ou você não tem acesso.' });
    });
  });

  // Testes para updateTransaction
  describe('updateTransaction', () => {
    const transactionId = 1;
    const updatedTransactionBody = { descricao: 'Compra Atualizada', valor: 160.00, tipo: 'despesa' };
    const updatedTransactionResult = { id: transactionId, ...updatedTransactionBody, usuario_id: testUserId };

    test('deve atualizar uma transação do usuário e retornar 200', async () => {
      req.params.id = transactionId;
      req.body = updatedTransactionBody;
      // Mock para verificação de propriedade da transação
      pool.query.mockResolvedValueOnce({ rows: [{ id: transactionId }] });
      // Mock para o update da transação
      pool.query.mockResolvedValueOnce({ rows: [updatedTransactionResult] });

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedTransactionResult);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM transacoes WHERE id = $1 AND usuario_id = $2',
        [transactionId, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transacoes SET descricao = $1, valor = $2, tipo = $3'),
        expect.arrayContaining([updatedTransactionBody.descricao, updatedTransactionBody.valor, updatedTransactionBody.tipo, transactionId, testUserId])
      );
    });

    test('deve retornar 400 se nenhum campo for fornecido na atualização', async () => {
      req.params.id = '1';
      req.body = {}; // Corpo vazio

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Pelo menos um campo deve ser fornecido para atualização.' });
    });

    test('deve retornar 400 se o valor fornecido for inválido', async () => {
      req.params.id = '1';
      req.body = { valor: 'abc' };

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Valor deve ser um número válido.' });
    });

    test('deve retornar 400 se o tipo de transação for inválido', async () => {
      req.params.id = '1';
      req.body = { tipo: 'qualquer' };

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tipo de transação inválido. Deve ser "receita" ou "despesa".' });
    });


    test('deve retornar 403 se a transação não pertencer ao usuário', async () => {
      req.params.id = '1';
      req.body = updatedTransactionBody;
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para simular que não pertence

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou transação não encontrada para este usuário.' });
    });

    test('deve retornar 404 se a categoria fornecida não pertencer ao usuário durante a atualização', async () => {
      req.params.id = '1';
      req.body = { ...updatedTransactionBody, categoria_id: 99 };
      // Mock para verificação de propriedade da transação
      pool.query.mockResolvedValueOnce({ rows: [{ id: transactionId }] });
      // Mock para verificação de propriedade da categoria (retorna vazio)
      pool.query.mockResolvedValueOnce({ rows: [] });

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoria fornecida não encontrada ou não pertence a você.' });
    });

    test('deve retornar 404 se a conta fornecida não pertencer ao usuário durante a atualização', async () => {
      req.params.id = '1';
      req.body = { ...updatedTransactionBody, conta_id: 99 };
      // Mock para verificação de propriedade da transação
      pool.query.mockResolvedValueOnce({ rows: [{ id: transactionId }] });
      // Mock para verificação de propriedade da categoria (retorna preenchido)
      pool.query.mockResolvedValueOnce({ rows: [{ id: testCategoryId }] });
      // Mock para verificação de propriedade da conta (retorna vazio)
      pool.query.mockResolvedValueOnce({ rows: [] });

      await TransacaoController.updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta fornecida não encontrada ou não pertence a você.' });
    });
  });

  // Testes para deleteTransaction
  describe('deleteTransaction', () => {
    test('deve deletar uma transação do usuário e retornar 200', async () => {
      const deletedTransaction = { id: 1, descricao: 'A deletar', usuario_id: testUserId };
      req.params.id = '1';
      // Mock para verificação de propriedade da transação
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Mock para a deleção
      pool.query.mockResolvedValueOnce({ rows: [deletedTransaction] });

      await TransacaoController.deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Transação excluída com sucesso!' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM transacoes WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2 RETURNING *',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 403 se a transação não pertencer ao usuário', async () => {
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para simular que não pertence

      await TransacaoController.deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou transação não encontrada para este usuário.' });
    });

    test('deve retornar 404 se a transação não for encontrada para exclusão', async () => {
      req.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [{ id: 999 }] }); // Mock para verificação de propriedade (simula que pertence)
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para deleção (simula que não deletou)

      await TransacaoController.deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Transação não encontrada.' });
    });
  });
});