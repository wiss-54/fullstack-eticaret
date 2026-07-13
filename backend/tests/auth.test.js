const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../services/users.service', () => ({
  createUser: jest.fn(),
  verifyUserCredentials: jest.fn(),
  getUserById: jest.fn(),
}));

const { createUser, verifyUserCredentials, getUserById } = require('../services/users.service');
const app = require('../app');

const mockUser = {
  id: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  phone: null,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

describe('auth routes', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/register yeni kullanici olusturur', async () => {
    createUser.mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
    expect(response.body.data.email).toBe('test@example.com');
  });

  it('POST /api/auth/login basarili giris yapar', async () => {
    verifyUserCredentials.mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
  });

  it('GET /api/auth/me musteri tokeni ile profil doner', async () => {
    getUserById.mockResolvedValueOnce(mockUser);
    const token = jwt.sign(
      { role: 'customer', userId: 1, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe('Test User');
  });

  it('GET /api/auth/me admin tokeni ile 401 doner', async () => {
    const token = jwt.sign(
      { role: 'admin', username: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
