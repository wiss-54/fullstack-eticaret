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
  brandName: 'EticaretShop',
  logoUrl: null,
  accentColor: '#92400e',
  themeId: 'classic-amber',
  surfaceStyle: 'warm',
  radiusStyle: 'rounded',
  buttonStyle: 'pill',
  heroLayout: 'split',
  fontStyle: 'classic',
  heroEyebrow: 'EticaretShop',
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
  navItem1Label: 'Kategoriler',
  navItem1Href: '#urunler',
  navItem2Label: 'Koleksiyon',
  navItem2Href: '#urunler',
  footerLeft: 'Footer sol',
  footerRight: 'Footer sag',
  sections: [
    { id: 'hero', type: 'hero', enabled: true },
    { id: 'products', type: 'products', enabled: true },
  ],
  updatedAt: '2026-07-14T00:00:00.000Z',
};

describe('store settings themes', () => {
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

  it('GET /api/store-settings/themes hazir temalari doner', async () => {
    const response = await request(app).get('/api/store-settings/themes');
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    expect(response.body.data[0]).toHaveProperty('id');
    expect(response.body.data[0]).toHaveProperty('name');
  });

  it('GET /api/store-settings ayarlari doner', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleSettings] });
    const response = await request(app).get('/api/store-settings');
    expect(response.status).toBe(200);
    expect(response.body.data.themeId).toBe('classic-amber');
    expect(response.body.data.sections).toHaveLength(2);
  });

  it('POST /api/store-settings/apply-theme temayi uygular', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [sampleSettings] })
      .mockResolvedValueOnce({
        rows: [{ ...sampleSettings, themeId: 'modern-slate', accentColor: '#334155' }],
      });

    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET);
    const response = await request(app)
      .post('/api/store-settings/apply-theme')
      .set('Authorization', `Bearer ${token}`)
      .send({ themeId: 'modern-slate' });

    expect(response.status).toBe(200);
    expect(response.body.data.themeId).toBe('modern-slate');
  });
});
