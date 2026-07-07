const request = require('supertest');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../db');
const app = require('../app');

describe('GET /api/test-db', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('veritabanı bağlantısı başarılı olduğunda 200 döner', async () => {
    const mockTime = new Date('2026-07-07T09:07:16.264Z');
    pool.query.mockResolvedValueOnce({ rows: [{ now: mockTime }] });

    const response = await request(app).get('/api/test-db');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'PostgreSQL bağlantısı fişek gibi kankam!',
      time: mockTime.toISOString(),
    });
    expect(pool.query).toHaveBeenCalledWith('SELECT NOW()');
  });

  it('veritabanı hatası olduğunda 500 döner', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection failed'));

    const response = await request(app).get('/api/test-db');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: 'Veritabanına bağlanırken bir hata oluştu.',
    });
  });
});
