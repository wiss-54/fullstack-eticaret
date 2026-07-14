const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../middleware/auth.middleware', () => ({
  requireAdmin: (_req, _res, next) => next(),
  requireCustomer: (_req, _res, next) => next(),
}));

const { pool } = require('../db');
const app = require('../app');

const sampleSettings = {
  brandName: 'Hatira Niyat',
  logoUrl: null,
  accentColor: '#92400e',
  heroEyebrow: 'Hatira Niyat',
  heroTitle: 'Baslik',
  heroSubtitle: 'Aciklama',
  heroCtaLabel: 'Kesfet',
  heroCtaHref: '#urunler',
  heroSecondaryCtaLabel: 'Sepet',
  heroSecondaryCtaHref: '/sepet',
  featureCards: [{ title: 'A', text: 'B' }],
  productsEyebrow: 'Koleksiyon',
  productsTitle: 'Urunler',
  productsSubtitle: 'Liste',
  footerLeft: 'Footer sol',
  footerRight: 'Footer sag',
  updatedAt: '2026-07-14T00:00:00.000Z',
};

describe('store settings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/store-settings ayarlari doner', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleSettings] });

    const response = await request(app).get('/api/store-settings');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.brandName).toBe('Hatira Niyat');
    expect(response.body.data.heroTitle).toBe('Baslik');
  });

  it('PUT /api/store-settings gunceller', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ ...sampleSettings, heroTitle: 'Yeni Baslik' }],
    });

    const token = jwt.sign({ role: 'admin', username: 'admin' }, 'test-secret');
    const response = await request(app)
      .put('/api/store-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...sampleSettings,
        heroTitle: 'Yeni Baslik',
        featureCards: [{ title: 'A', text: 'B' }],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.heroTitle).toBe('Yeni Baslik');
  });
});
