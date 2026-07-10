const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../app');

const DEPLOY_INFO_PATH = path.join(__dirname, '..', '.deploy-info.json');

describe('Version API', () => {
  afterEach(() => {
    if (fs.existsSync(DEPLOY_INFO_PATH)) {
      fs.unlinkSync(DEPLOY_INFO_PATH);
    }
  });

  it('GET /api/version deploy bilgisini doner', async () => {
    fs.writeFileSync(
      DEPLOY_INFO_PATH,
      JSON.stringify({ commit: 'abc1234', deployedAt: '2026-07-10T12:00:00+03:00' }),
    );

    const response = await request(app).get('/api/version');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.commit).toBe('abc1234');
  });

  it('deploy dosyasi yoksa dev doner', async () => {
    const response = await request(app).get('/api/version');

    expect(response.status).toBe(200);
    expect(response.body.data.commit).toBe('dev');
  });
});
