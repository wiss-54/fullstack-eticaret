const os = require('os');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const DEPLOY_INFO_PATH = path.join(__dirname, '..', '.deploy-info.json');

function readDeployInfo() {
  try {
    const raw = fs.readFileSync(DEPLOY_INFO_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatBackupSizeMb(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

function getBackupStatus() {
  const backupRoot = process.env.BACKUP_ROOT || '/home/beratav/backups';
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 14);

  try {
    if (!fs.existsSync(backupRoot)) {
      return {
        status: 'missing',
        backupRoot,
        retentionDays,
        count: 0,
        latest: null,
        recent: [],
      };
    }

    const files = fs
      .readdirSync(backupRoot)
      .filter((name) => /^eticaret_\d{8}_\d{6}\.tar\.gz$/.test(name))
      .map((fileName) => {
        const fullPath = path.join(backupRoot, fileName);
        const stat = fs.statSync(fullPath);
        return {
          fileName,
          sizeBytes: stat.size,
          sizeMb: formatBackupSizeMb(stat.size),
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const latest = files[0] || null;
    let status = 'ok';
    let ageHours = null;

    if (!latest) {
      status = 'empty';
    } else {
      ageHours = Number(
        ((Date.now() - new Date(latest.createdAt).getTime()) / 3_600_000).toFixed(1),
      );
      // Gunluk cron: 36 saatten eskiyse uyar
      if (ageHours > 36) status = 'stale';
    }

    return {
      status,
      backupRoot,
      retentionDays,
      count: files.length,
      latest: latest
        ? {
            fileName: latest.fileName,
            sizeMb: latest.sizeMb,
            createdAt: latest.createdAt,
            ageHours,
          }
        : null,
      recent: files.slice(0, 5).map((file) => ({
        fileName: file.fileName,
        sizeMb: file.sizeMb,
        createdAt: file.createdAt,
      })),
    };
  } catch (err) {
    return {
      status: 'error',
      backupRoot,
      retentionDays,
      count: 0,
      latest: null,
      recent: [],
      error: err instanceof Error ? err.message : 'Backup durumu okunamadi',
    };
  }
}

async function checkDatabase() {
  const start = Date.now();
  await pool.query('SELECT 1');
  return { status: 'up', latencyMs: Date.now() - start };
}

async function checkHttpUrl(url) {
  const start = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return {
      status: response.ok ? 'up' : 'down',
      statusCode: response.status,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'down',
      error: err instanceof Error ? err.message : 'Request failed',
      latencyMs: Date.now() - start,
    };
  }
}

async function getProductCount() {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  return result.rows[0].count;
}

async function getSystemStatus() {
  const shopUrl =
    process.env.MONITOR_SHOP_URL || 'https://eticaretshop.com.tr';
  const adminUrl =
    process.env.MONITOR_ADMIN_URL || 'https://admin.eticaretshop.com.tr/login';
  const apiUrl =
    process.env.MONITOR_API_URL || 'https://eticaretshop.com.tr/api/test-db';

  const [database, shop, adminPanel, api] = await Promise.all([
    checkDatabase().catch((err) => ({
      status: 'down',
      error: err instanceof Error ? err.message : 'Database check failed',
    })),
    checkHttpUrl(shopUrl),
    checkHttpUrl(adminUrl),
    checkHttpUrl(apiUrl),
  ]);

  let productCount = null;
  try {
    productCount = await getProductCount();
  } catch {
    productCount = null;
  }

  const deployInfo = readDeployInfo();
  const backup = getBackupStatus();
  const mem = process.memoryUsage();

  return {
    checkedAt: new Date().toISOString(),
    deploy: deployInfo,
    backup,
    services: {
      database,
      api,
      shop,
      adminPanel,
      backend: {
        status: 'up',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMb: Math.round(mem.rss / 1024 / 1024),
      },
    },
    server: {
      hostname: os.hostname(),
      loadAverage: os.loadavg().map((v) => Number(v.toFixed(2))),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    },
    stats: {
      productCount,
    },
    links: {
      githubActions: 'https://github.com/wiss-54/fullstack-eticaret/actions',
    },
  };
}

module.exports = {
  getSystemStatus,
};
