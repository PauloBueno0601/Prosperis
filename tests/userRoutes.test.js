const request = require('supertest');
const app = require('../server'); // Importa a instância do Express app
const pool = require('../config/database'); // Importa o pool para mockar
const jwt = require('jsonwebtoken'); // Para criar tokens de teste
const bcrypt = require('bcrypt'); // Para simular hash/comparação de senhas no DB

// Mock do pool do banco de dados para isolar os testes de DB
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock do bcrypt para simular hashing e comparação de senhas
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock do jsonwebtoken, apenas para o jwt.verify no middleware de autenticação
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'), // Usa as implementações reais para tudo, menos sign
  sign: jest.fn(), // Mocka apenas sign para criar tokens de teste
  verify: jest.fn(), // Mocka verify para simular autenticação
}));


describe('User Routes', () => {
  const testUserId = 1;
  const testUserEmail = 'test@example.com';
  const testUserName = 'Test User';
  let authToken; // Para armazenar um token de autenticação válido para os testes

  beforeAll(() => {
    // Configura um token de teste válido antes de todos os testes
    // O jwt.sign real seria chamado durante um teste de login bem-sucedido
    // Para testes de rota, podemos gerar um token mockado diretamente
    authToken = jwt.sign({ id: testUserId, email: testUserEmail }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    // Mock do jwt.verify para que o middleware de autenticação funcione nos testes
    jwt.verify.mockImplementation((token, secret, callback) => {
      if (token === authToken && secret === (process.env.JWT_SECRET || 'your_jwt_secret')) {
        callback(null, { id: testUserId, email: testUserEmail }); // Simula um token válido
      } else {
        callback(new Error('Invalid token')); // Simula um token inválido
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Limpa mocks antes de cada teste
  });

  // Testes para POST /api/register
  describe('POST /api/register', () => {
    test('deve registrar um novo usuário e retornar 201', async () => {
      const newUser = { id: testUserId, nome: 'New User', email: 'newuser@example.com' };
      // Mock do bcrypt para hash
      bcrypt.hash.mockResolvedValue('hashed_password');
      // Mock do pool.query para a inserção do usuário
      pool.query.mockResolvedValueOnce({ rows: [newUser] });

      const res = await request(app)
        .post('/api/register')
        .send({
          nome: 'New User',
          email: 'newuser@example.com',
          senha: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(newUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
        ['New User', 'newuser@example.com', 'hashed_password']
      );
    });

    test('deve retornar 400 se faltarem campos obrigatórios no registro', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          nome: 'New User',
          email: 'newuser@example.com',
        }); // Senha faltando

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ message: 'Nome, email e senha são obrigatórios.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 409 para email duplicado no registro', async () => {
      // Simula o erro de violação de unique constraint do PostgreSQL
      pool.query.mockRejectedValueOnce({ code: '23505', constraint: 'usuarios_email_key' });
      bcrypt.hash.mockResolvedValue('hashed_password'); // hash ainda é chamado antes do erro DB

      const res = await request(app)
        .post('/api/register')
        .send({
          nome: 'Existing User',
          email: 'existing@example.com',
          senha: 'password123',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toEqual({ message: 'Este email já está cadastrado.' });
    });
  });

  // Testes para POST /api/login
  describe('POST /api/login', () => {
    const mockDbUser = { id: testUserId, nome: testUserName, email: testUserEmail, senha: 'hashed_password_from_db' };

    test('deve logar um usuário existente e retornar um token', async () => {
      // Mock do pool.query para encontrar o usuário
      pool.query.mockResolvedValueOnce({ rows: [mockDbUser] });
      // Mock do bcrypt.compare para simular senha correta
      bcrypt.compare.mockResolvedValueOnce(true);
      // Mock do jwt.sign para retornar um token
      jwt.sign.mockReturnValueOnce('mocked_jwt_token_for_login');

      const res = await request(app)
        .post('/api/login')
        .send({
          email: testUserEmail,
          senha: 'correct_password',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token', 'mocked_jwt_token_for_login');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toEqual({ id: testUserId, nome: testUserName, email: testUserEmail });
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM usuarios WHERE email = $1', [testUserEmail]);
      expect(bcrypt.compare).toHaveBeenCalledWith('correct_password', mockDbUser.senha);
      expect(jwt.sign).toHaveBeenCalledWith({ id: testUserId }, expect.any(String), { expiresIn: '1h' });
    });

    test('deve retornar 401 para credenciais inválidas', async () => {
      // Mock do pool.query para encontrar o usuário
      pool.query.mockResolvedValueOnce({ rows: [mockDbUser] });
      // Mock do bcrypt.compare para simular senha incorreta
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/login')
        .send({
          email: testUserEmail,
          senha: 'wrong_password',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ message: 'Email ou senha inválidos' });
    });

    test('deve retornar 404 se o usuário não for encontrado', async () => {
      // Mock do pool.query para não encontrar o usuário
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          senha: 'any_password',
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ message: 'Usuário não encontrado' });
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Não deve chamar bcrypt se o usuário não existe
    });
  });

  // Testes para GET /api/users/:id (Rota protegida)
  describe('GET /api/users/:id (Protected)', () => {
    test('deve retornar 200 e o usuário correto para um token válido', async () => {
      const mockUser = { id: testUserId, nome: testUserName, email: testUserEmail };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`); // Envia o token válido

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalled(); // Verifica se o middleware de autenticação foi chamado
      expect(pool.query).toHaveBeenCalledWith('SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1', [testUserId.toString()]);
    });

    test('deve retornar 401 para token ausente', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`); // Sem token

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ message: 'Token não fornecido.' });
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 403 para token inválido', async () => {
      // Re-mock do jwt.verify para simular token inválido
      jwt.verify.mockImplementationOnce((token, secret, callback) => {
        callback(new Error('jwt malformed')); // Simula um token que não pode ser verificado
      });

      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer invalid_token`); // Token inválido

      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual({ message: 'Token inválido.' });
      expect(jwt.verify).toHaveBeenCalled();
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se o usuário não for encontrado (mesmo com token válido)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // Usuário não encontrado no DB

      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ message: 'Usuário não encontrado' });
    });
  });

  // Testes para PUT /api/users/:id (Rota protegida)
  describe('PUT /api/users/:id (Protected)', () => {
    test('deve retornar 200 e o usuário atualizado para token válido', async () => {
      const updatedInfo = { nome: 'Updated Name', email: 'updated@example.com' };
      const updatedUser = { id: testUserId, ...updatedInfo };

      // Mock para a query de update
      pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedInfo);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET'),
        expect.arrayContaining([updatedInfo.nome, updatedInfo.email, testUserId.toString()])
      );
    });

    test('deve retornar 403 se tentar atualizar outro usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId + 1}`) // Tenta atualizar outro ID
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: 'Hacker' });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual({ message: 'Acesso negado. Você só pode atualizar seu próprio perfil.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 400 se nenhum campo for fornecido na atualização', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Corpo vazio

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ message: 'Pelo menos um campo (nome, email, senha) deve ser fornecido para atualização.' });
    });
  });

  // Testes para DELETE /api/users/:id (Rota protegida)
  describe('DELETE /api/users/:id (Protected)', () => {
    test('deve retornar 200 e mensagem de sucesso para token válido', async () => {
      // Mock do pool.query para simular exclusão bem-sucedida
      pool.query.mockResolvedValueOnce({ rows: [{ id: testUserId }], rowCount: 1 });

      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Usuário excluído com sucesso' });
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM usuarios WHERE id = $1 RETURNING *', [testUserId.toString()]);
    });

    test('deve retornar 403 se tentar deletar outro usuário', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId + 1}`) // Tenta deletar outro ID
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual({ message: 'Acesso negado. Você só pode deletar seu próprio perfil.' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se o usuário não for encontrado para deletar', async () => {
      // Mock do pool.query para simular que o usuário não foi encontrado para exclusão
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ message: 'Usuário não encontrado' });
    });
  });
});