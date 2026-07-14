const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const app = require('../app');
const { UPLOAD_DIR } = require('../middleware/upload.middleware');

describe('admin uploads', () => {
  const originalSecret = process.env.JWT_SECRET;
  let uploadedFile;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
    if (uploadedFile) {
      const filePath = path.join(UPLOAD_DIR, uploadedFile);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  it('POST /api/admin/uploads ile gorsel yukler', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const response = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pngBuffer, {
        filename: 'pixel.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.imageUrl).toMatch(/^\/uploads\//);

    uploadedFile = response.body.data.filename;
    expect(fs.existsSync(path.join(UPLOAD_DIR, uploadedFile))).toBe(true);
  });

  it('token olmadan 401 doner', async () => {
    const response = await request(app).post('/api/admin/uploads');
    expect(response.status).toBe(401);
  });
});
