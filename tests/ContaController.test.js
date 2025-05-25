const ContaController = require('../controllers/ContaController');
const pool = require('../config/database');

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('ContaController', () => {
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

  // Testes para createAccount
  describe('createAccount', () => {
    test('deve criar uma nova conta e retornar 201', async () => {
      const newAccount = { id: 1, nome: 'Conta Corrente', saldo: 1000.00, usuario_id: testUserId };
      req.body = { nome: 'Conta Corrente', saldo: 1000.00 };
      pool.query.mockResolvedValueOnce({ rows: [newAccount] });

      await ContaController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newAccount);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO contas (nome, saldo, usuario_id) VALUES ($1, $2, $3) RETURNING *',
        [req.body.nome, req.body.saldo, testUserId]
      );
    });

    test('deve retornar 400 se o nome da conta estiver ausente', async () => {
      req.body = { saldo: 500 }; // Nome ausente

      await ContaController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome e saldo da conta são obrigatórios e saldo deve ser um número.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 400 se o saldo estiver ausente ou inválido', async () => {
      req.body = { nome: 'Poupança' }; // Saldo ausente

      await ContaController.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome e saldo da conta são obrigatórios e saldo deve ser um número.' });
      expect(pool.query).not.toHaveBeenCalled();

      req.body = { nome: 'Poupança', saldo: 'abc' }; // Saldo inválido
      jest.clearAllMocks(); 
      await ContaController.createAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome e saldo da conta são obrigatórios e saldo deve ser um número.' });
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  // Testes para getAllAccounts
  describe('getAllAccounts', () => {
    test('deve retornar todas as contas do usuário e 200', async () => {
      const mockAccounts = [
        { id: 1, nome: 'Conta Corrente', saldo: 1000.00, usuario_id: testUserId },
        { id: 2, nome: 'Poupança', saldo: 5000.00, usuario_id: testUserId },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockAccounts });

      await ContaController.getAllAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAccounts);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM contas WHERE usuario_id = $1 ORDER BY nome ASC',
        [testUserId]
      );
    });
  });

  // Testes para getAccountById
  describe('getAccountById', () => {
    test('deve retornar a conta correta do usuário e 200', async () => {
      const mockAccount = { id: 1, nome: 'Conta Corrente', saldo: 1000.00, usuario_id: testUserId };
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [mockAccount] });

      await ContaController.getAccountById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAccount);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM contas WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 404 se a conta não for encontrada para o usuário', async () => {
      req.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await ContaController.getAccountById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta não encontrada ou você não tem acesso.' });
    });
  });

  // Testes para updateAccount
  describe('updateAccount', () => {
    test('deve atualizar uma conta do usuário e retornar 200', async () => {
      const updatedAccount = { id: 1, nome: 'Conta Corrente Atualizada', saldo: 1200.00, usuario_id: testUserId };
      req.params.id = '1';
      req.body = { nome: 'Conta Corrente Atualizada', saldo: 1200.00 };
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Mock para verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [updatedAccount] }); // Mock para update

      await ContaController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedAccount);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contas SET nome = $1, saldo = $2'),
        expect.arrayContaining([req.body.nome, req.body.saldo, req.params.id, testUserId])
      );
    });

    test('deve retornar 400 se nenhum campo for fornecido na atualização', async () => {
      req.params.id = '1';
      req.body = {}; // Corpo vazio

      await ContaController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Pelo menos o nome ou saldo deve ser fornecido para atualização.' });
    });

    test('deve retornar 400 se o saldo fornecido for inválido', async () => {
      req.params.id = '1';
      req.body = { saldo: 'abc' };

      await ContaController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Saldo deve ser um número válido.' });
    });

    test('deve retornar 403 se a conta não pertencer ao usuário', async () => {
      req.params.id = '1';
      req.body = { nome: 'Outro Nome' };
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para simular que não pertence

      await ContaController.updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    });
  });

  // Testes para deleteAccount
  describe('deleteAccount', () => {
    test('deve deletar uma conta do usuário e retornar 200', async () => {
      const deletedAccount = { id: 1, nome: 'Conta a Deletar', usuario_id: testUserId };
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Mock para verificação de propriedade
      pool.query.mockResolvedValueOnce({ rows: [deletedAccount] }); // Mock para delete

      await ContaController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta excluída com sucesso!' });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT 1 FROM contas WHERE id = $1 AND usuario_id = $2',
        [req.params.id, testUserId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM contas WHERE id = $1 AND usuario_id = $2 RETURNING *',
        [req.params.id, testUserId]
      );
    });

    test('deve retornar 403 se a conta não pertencer ao usuário', async () => {
      req.params.id = '1';
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para simular que não pertence

      await ContaController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado ou conta não encontrada para este usuário.' });
    });

    test('deve retornar 404 se a conta não for encontrada para exclusão', async () => {
      req.params.id = '999';
      pool.query.mockResolvedValueOnce({ rows: [{ id: 999 }] }); // Mock para verificação de propriedade (simula que pertence, mas a deleção não encontra)
      pool.query.mockResolvedValueOnce({ rows: [] }); // Mock para delete (simula que não deletou nada)

      await ContaController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta não encontrada.' });
    });
  });
});