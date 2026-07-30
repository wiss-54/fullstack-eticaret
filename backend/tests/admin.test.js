const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2b$12$N8uyzcbAyFBmxHJ0BXJV2uHLdqgs2DDQVPpYGRWTm0v4uBzR0vFcG';
process.env.JWT_SECRET = 'test-jwt-secret';

const { pool } = require('../db');
const app = require('../app');

describe('Admin auth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dogru bilgilerle login olur', async () => {
    const response = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'HatiraAdmin2026!',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('yanlis sifre ile login olmaz', async () => {
    const response = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'yanlis',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('token olmadan urun eklenemez', async () => {
    const response = await request(app).post('/api/products').send({
      name: 'Telefon',
      description: 'Akilli telefon',
      price: 10000,
      stock: 5,
    });

    expect(response.status).toBe(401);
  });

  it('token ile urun eklenir', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET);

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          name: 'Telefon',
          description: 'Akilli telefon',
          price: '10000',
          stock: 5,
          imageUrl: null,
          createdAt: new Date('2026-07-09T06:00:00.000Z'),
          updatedAt: new Date('2026-07-09T06:00:00.000Z'),
        },
      ],
    });

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Telefon',
        description: 'Akilli telefon',
        price: 10000,
        stock: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Telefon');
  });

  it('token ile monitoring status doner', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const response = await request(app)
      .get('/api/admin/status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.services.database.status).toBe('up');
    expect(response.body.data.stats.productCount).toBe(2);
    expect(response.body.data.backup).toBeDefined();
    expect(response.body.data.backup.status).toBeDefined();
  });

  it('token ile monitoring meta ve tekil check doner', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    pool.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });

    const metaResponse = await request(app)
      .get('/api/admin/status/meta')
      .set('Authorization', `Bearer ${token}`);

    expect(metaResponse.status).toBe(200);
    expect(metaResponse.body.data.backend.status).toBe('up');
    expect(metaResponse.body.data.stats.productCount).toBe(3);
    expect(metaResponse.body.data.services).toBeUndefined();

    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const checkResponse = await request(app)
      .get('/api/admin/status/check/database')
      .set('Authorization', `Bearer ${token}`);

    expect(checkResponse.status).toBe(200);
    expect(checkResponse.body.data.name).toBe('database');
    expect(checkResponse.body.data.check.status).toBe('up');
  });

  it('token ile uptime skoru doner', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const response = await request(app)
      .get('/api/admin/status/uptime?attempts=3&target=api')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.attempts).toBe(3);
    expect(response.body.data.success).toBe(3);
    expect(response.body.data.scorePercent).toBe(100);
    expect(response.body.data.probes).toHaveLength(3);
  });
});
