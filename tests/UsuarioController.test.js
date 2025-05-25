const UsuarioController = require('../controllers/UsuarioController');
const pool = require('../config/database');
const bcrypt = require('bcrypt'); // Necessário para mockar bcrypt.hash e compare
const jwt = require('jsonwebtoken'); // Necessário para mockar jwt.sign

// Mock do módulo database.js (ou pool.js, dependendo do nome do seu arquivo)
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock do módulo bcrypt para simular o hash e comparação de senha
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)), // Retorna uma senha "hasheada" mock
  compare: jest.fn((password, hash) => Promise.resolve(password === hash.replace('hashed_', ''))), // Simula a comparação
}));

// Mock do módulo jsonwebtoken para simular a criação do token
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_jwt_token'), // Sempre retorna um token de teste fixo
}));


describe('UsuarioController', () => {
  let req, res;

  beforeEach(() => {
    req = {}; // O objeto req da requisição
    res = {
      status: jest.fn().mockReturnThis(), // Retorna 'this' para encadeamento como .status(200).json(...)
      json: jest.fn(), // A função para enviar a resposta JSON
    };
    // Limpar todos os mocks antes de cada teste para isolá-los
    jest.clearAllMocks();
  });

  // Testes para registerUser (anteriormente createUser)
  describe('registerUser', () => {
    test('deve criar um novo usuário e retornar 201', async () => {
      const newUser = { id: 1, nome: 'John Doe', email: 'john@example.com', criado_em: new Date().toISOString() };
      req.body = { nome: 'John Doe', email: 'john@example.com', senha: 'password123' };
      pool.query.mockResolvedValueOnce({ rows: [newUser] });

      await UsuarioController.registerUser(req, res); // CORRIGIDO AQUI: de createUser para registerUser

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10); // Verifica se o hash foi chamado
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
        ['John Doe', 'john@example.com', 'hashed_password123'] // A senha hasheada mockada
      );
    });

    test('deve retornar 400 se faltarem campos obrigatórios', async () => {
      req.body = { nome: 'John Doe', email: 'john@example.com' }; // Senha faltando

      await UsuarioController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome, email e senha são obrigatórios.' });
      expect(pool.query).not.toHaveBeenCalled(); // Nenhuma interação com o DB
    });

    test('deve retornar 409 para email duplicado', async () => {
      req.body = { nome: 'Jane Doe', email: 'jane@example.com', senha: 'password123' };
      // Simula o erro de violação de unique constraint do PostgreSQL (código '23505')
      pool.query.mockRejectedValueOnce({ code: '23505', constraint: 'usuarios_email_key', message: 'duplicate key value violates unique constraint "usuarios_email_key"' });

      await UsuarioController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Este email já está cadastrado.' });
    });

    test('deve retornar 500 para outros erros no DB', async () => {
      req.body = { nome: 'Jane Doe', email: 'jane@example.com', senha: 'password123' };
      pool.query.mockRejectedValueOnce(new Error('DB connection error')); // Simula um erro genérico do DB

      await UsuarioController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB connection error' });
    });
  });

  // Testes para loginUser
  describe('loginUser', () => {
    // Usuário mockado com a senha já hasheada (como seria no DB)
    const mockUser = { id: 1, nome: 'John Doe', email: 'john@example.com', senha: 'hashed_password123', criado_em: new Date() };

    test('deve logar o usuário e retornar um token', async () => {
      req.body = { email: 'john@example.com', senha: 'password123' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] }); // Simula que o usuário foi encontrado
      bcrypt.compare.mockResolvedValueOnce(true); // Senha válida
      jwt.sign.mockReturnValueOnce('mocked_jwt_token'); // Retorna o token mockado

      await UsuarioController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mocked_jwt_token',
        user: { id: mockUser.id, nome: mockUser.nome, email: mockUser.email } // Verifica o formato da resposta
      });
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM usuarios WHERE email = $1', ['john@example.com']);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password123'); // Verifica a comparação de senha
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Verifica a criação do token
    });

    test('deve retornar 400 se faltarem email ou senha', async () => {
      req.body = { email: 'john@example.com' }; // Senha faltando

      await UsuarioController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email e senha são obrigatórios.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se o usuário não for encontrado', async () => {
      req.body = { email: 'nonexistent@example.com', senha: 'password123' };
      pool.query.mockResolvedValueOnce({ rows: [] }); // Usuário não encontrado

      await UsuarioController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado' });
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Não deve chamar bcrypt se o usuário não existe
    });

    test('deve retornar 401 para senha inválida', async () => {
      req.body = { email: 'john@example.com', senha: 'wrongpassword' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] }); // Usuário encontrado
      bcrypt.compare.mockResolvedValueOnce(false); // Senha inválida

      await UsuarioController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email ou senha inválidos' });
    });

    test('deve retornar 500 para erro no DB durante o login', async () => {
      req.body = { email: 'john@example.com', senha: 'password123' };
      pool.query.mockRejectedValueOnce(new Error('Login DB error'));

      await UsuarioController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Login DB error' });
    });
  });

  // Testes para getAllUsers
  test('getAllUsers deve retornar todos os usuários', async () => {
    const mockUsers = [
      { id: 1, nome: 'John Doe', email: 'john@example.com', criado_em: new Date() },
      { id: 2, nome: 'Jane Doe', email: 'jane@example.com', criado_em: new Date() },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockUsers });

    await UsuarioController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsers);
    expect(pool.query).toHaveBeenCalledWith('SELECT id, nome, email, criado_em FROM usuarios');
  });

  // Testes para getUserById
  test('getUserById deve retornar o usuário correto', async () => {
    const mockUser = { id: 1, nome: 'John Doe', email: 'john@example.com', criado_em: new Date() };
    req.params = { id: '1' };
    pool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

    await UsuarioController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser);
    expect(pool.query).toHaveBeenCalledWith('SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1', ['1']);
  });

  test('getUserById deve retornar 404 se o usuário não for encontrado', async () => {
    req.params = { id: '999' };
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Usuário não encontrado

    await UsuarioController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado' });
  });

  test('getUserById deve retornar 500 para erro no DB', async () => {
    req.params = { id: '1' };
    pool.query.mockRejectedValueOnce(new Error('DB error on getUserById'));

    await UsuarioController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error on getUserById' });
  });


  // Testes para updateUser
  describe('updateUser', () => {
    test('deve atualizar um usuário e retornar 200', async () => {
      const updatedUser = { id: 1, nome: 'John Doe Updated', email: 'john_updated@example.com', criado_em: new Date(), atualizado_em: new Date() };
      req.params = { id: '1' };
      req.body = { nome: 'John Doe Updated', email: 'john_updated@example.com' };
      req.user = { id: 1 }; // Mock do authenticateToken: usuário logado é o 1
      pool.query.mockResolvedValueOnce({ rows: [updatedUser], rowCount: 1 });

      await UsuarioController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedUser);
      // Verifica a query e os valores dinâmicos. Note que a senha pode ser hasheada se estiver no body.
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET'),
        expect.arrayContaining(['John Doe Updated', 'john_updated@example.com', '1'])
      );
    });

    test('deve retornar 400 se nenhum campo for fornecido para atualização', async () => {
      req.params = { id: '1' };
      req.body = {}; 
      req.user = { id: 1 };

      await UsuarioController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Pelo menos um campo (nome, email, senha) deve ser fornecido para atualização.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 403 se o usuário tentar atualizar outro perfil', async () => {
      req.params = { id: '2' }; // Tentando atualizar o usuário 2
      req.body = { nome: 'Evil Hacker' };
      req.user = { id: 1 }; // Usuário logado é o 1

      await UsuarioController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado. Você só pode atualizar seu próprio perfil.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 409 para email duplicado durante a atualização', async () => {
      req.params = { id: '1' };
      req.body = { email: 'existing@example.com' };
      req.user = { id: 1 };
      pool.query.mockRejectedValueOnce({ code: '23505', constraint: 'usuarios_email_key' }); // Simula erro de email duplicado

      await UsuarioController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Este email já está em uso por outro usuário.' });
    });

    test('deve retornar 500 para outros erros no DB durante a atualização', async () => {
      req.params = { id: '1' };
      req.body = { nome: 'Test' };
      req.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('DB update error'));

      await UsuarioController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB update error' });
    });
  });

  // Testes para deleteUser
  describe('deleteUser', () => {
    test('deve deletar um usuário e retornar 200', async () => {
      const deletedUser = { id: 1, nome: 'John Doe', email: 'john@example.com', criado_em: new Date() };
      req.params = { id: '1' };
      req.user = { id: 1 }; 
      pool.query.mockResolvedValueOnce({ rows: [deletedUser], rowCount: 1 });

      await UsuarioController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário excluído com sucesso' });
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM usuarios WHERE id = $1 RETURNING *', ['1']);
    });

    test('deve retornar 403 se o usuário tentar deletar outro perfil', async () => {
      req.params = { id: '2' }; // Tentando deletar o usuário 2
      req.user = { id: 1 }; // Usuário logado é o 1

      await UsuarioController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado. Você só pode deletar seu próprio perfil.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se o usuário a ser deletado não for encontrado', async () => {
      req.params = { id: '1' };
      req.user = { id: 1 };
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Nenhum usuário deletado (simula 0 rows afetadas)

      await UsuarioController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado' });
    });

    test('deve retornar 500 para erro no DB durante a exclusão', async () => {
      req.params = { id: '1' };
      req.user = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('DB delete error'));

      await UsuarioController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB delete error' });
    });
  });
});