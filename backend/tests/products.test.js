const request = require('supertest');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../middleware/auth.middleware', () => ({
  requireAdmin: (_req, _res, next) => next(),
}));

const { pool } = require('../db');
const app = require('../app');

describe('Product CRUD', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/products ile ürün ekler', async () => {
    const createdAt = new Date('2026-07-07T09:07:16.264Z');
    const updatedAt = new Date('2026-07-07T09:07:16.264Z');

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '24999.99',
          stock: 10,
          imageUrl: 'https://example.com/laptop.png',
          createdAt,
          updatedAt,
        },
      ],
    });

    const payload = {
      name: 'Laptop',
      description: 'Gaming laptop',
      price: 24999.99,
      stock: 10,
      imageUrl: 'https://example.com/laptop.png',
    };

    const response = await request(app).post('/api/products').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Laptop');
    expect(response.body.data.price).toBe(24999.99);
    expect(response.body.data.stock).toBe(10);
    expect(response.body.data.createdAt).toBe(createdAt.toISOString());
  });

  it('POST /api/products ile geçersiz veri gelirse 400 döner', async () => {
    const response = await request(app).post('/api/products').send({
      // name yok
      description: 'Gaming laptop',
      price: -5,
      stock: -1,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('GET /api/products ile ürün listesini döner', async () => {
    const createdAt = new Date('2026-07-07T09:07:16.264Z');
    const updatedAt = new Date('2026-07-07T09:07:16.264Z');

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '24999.99',
          stock: 10,
          imageUrl: null,
          createdAt,
          updatedAt,
        },
      ],
    });

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(1);
  });

  it('GET /api/products/:id bulunamazsa 404 döner', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/products/999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

