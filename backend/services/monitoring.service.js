const os = require('os');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const DEPLOY_INFO_PATH = path.join(__dirname, '..', '.deploy-info.json');

const SERVICE_CHECK_KEYS = ['database', 'api', 'shop', 'adminPanel'];

let sslCache = {
  at: 0,
  shop: null,
  admin: null,
};
const SSL_CACHE_MS = 5 * 60 * 1000;

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

function monitorUrls() {
  return {
    shopUrl: process.env.MONITOR_SHOP_URL || 'https://eticaretshop.com.tr',
    adminUrl: process.env.MONITOR_ADMIN_URL || 'https://admin.eticaretshop.com.tr/login',
    apiUrl: process.env.MONITOR_API_URL || 'https://eticaretshop.com.tr/api/test-db',
  };
}

function getBackendSnapshot() {
  const mem = process.memoryUsage();
  return {
    status: 'up',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMb: Math.round(mem.rss / 1024 / 1024),
  };
}

function getDiskSnapshot() {
  try {
    if (typeof fs.statfsSync !== 'function') {
      return null;
    }
    const stat = fs.statfsSync('/');
    const total = Number(stat.blocks) * Number(stat.bsize);
    const free = Number(stat.bavail) * Number(stat.bsize);
    const used = Math.max(0, total - free);
    return {
      totalGb: Number((total / 1024 / 1024 / 1024).toFixed(1)),
      usedGb: Number((used / 1024 / 1024 / 1024).toFixed(1)),
      freeGb: Number((free / 1024 / 1024 / 1024).toFixed(1)),
      usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  } catch {
    return null;
  }
}

function getNetworkSnapshot() {
  try {
    if (!fs.existsSync('/proc/net/dev')) return null;
    const raw = fs.readFileSync('/proc/net/dev', 'utf8');
    let rx = 0;
    let tx = 0;
    for (const line of raw.split('\n').slice(2)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('lo:')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length < 10) continue;
      rx += Number(parts[1]) || 0;
      tx += Number(parts[9]) || 0;
    }
    return {
      rxMb: Number((rx / 1024 / 1024).toFixed(1)),
      txMb: Number((tx / 1024 / 1024).toFixed(1)),
    };
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  const cpus = os.cpus()?.length || 1;
  const load = os.loadavg().map((v) => Number(v.toFixed(2)));
  const totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);
  const usedMemoryMb = Math.max(0, totalMemoryMb - freeMemoryMb);

  return {
    hostname: os.hostname(),
    loadAverage: load,
    cpuCount: cpus,
    cpuPercent: Math.min(100, Math.round((load[0] / cpus) * 100)),
    freeMemoryMb,
    totalMemoryMb,
    usedMemoryMb,
    memoryUsedPercent:
      totalMemoryMb > 0 ? Math.round((usedMemoryMb / totalMemoryMb) * 100) : 0,
    disk: getDiskSnapshot(),
    network: getNetworkSnapshot(),
  };
}

async function getSslStatus(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return { status: 'skipped', daysRemaining: null, validTo: null, host: url.hostname };
    }

    const tls = require('tls');
    const cert = await new Promise((resolve, reject) => {
      const socket = tls.connect(
        {
          host: url.hostname,
          port: Number(url.port || 443),
          servername: url.hostname,
          timeout: 8000,
        },
        () => {
          const peer = socket.getPeerCertificate();
          socket.end();
          resolve(peer);
        },
      );
      socket.on('error', reject);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('SSL timeout'));
      });
    });

    if (!cert?.valid_to) {
      return { status: 'unknown', daysRemaining: null, validTo: null, host: url.hostname };
    }

    const validTo = new Date(cert.valid_to);
    const daysRemaining = Math.ceil((validTo.getTime() - Date.now()) / 86_400_000);
    return {
      status: daysRemaining <= 14 ? 'expiring' : 'ok',
      daysRemaining,
      validTo: validTo.toISOString(),
      host: url.hostname,
      issuer: cert.issuer?.O || cert.issuer?.CN || null,
    };
  } catch (err) {
    return {
      status: 'error',
      daysRemaining: null,
      validTo: null,
      host: null,
      error: err instanceof Error ? err.message : 'SSL okunamadi',
    };
  }
}

/** Local/meta info without remote HTTP probes — resolves quickly. */
async function getStatusMeta() {
  let productCount = null;
  try {
    productCount = await getProductCount();
  } catch {
    productCount = null;
  }

  const { shopUrl, adminUrl } = monitorUrls();
  const now = Date.now();
  let shopSsl = sslCache.shop;
  let adminSsl = sslCache.admin;
  if (!shopSsl || !adminSsl || now - sslCache.at > SSL_CACHE_MS) {
    [shopSsl, adminSsl] = await Promise.all([getSslStatus(shopUrl), getSslStatus(adminUrl)]);
    sslCache = { at: now, shop: shopSsl, admin: adminSsl };
  }

  return {
    checkedAt: new Date().toISOString(),
    deploy: readDeployInfo(),
    backup: getBackupStatus(),
    backend: getBackendSnapshot(),
    server: getServerSnapshot(),
    ssl: {
      shop: shopSsl,
      admin: adminSsl,
    },
    stats: { productCount },
    monitor: {
      intervalSeconds: 30,
      probeAttempts: 10,
      timeoutSeconds: 8,
      targets: ['backend', 'database', 'api', 'shop', 'adminPanel'],
    },
    links: {
      githubActions: 'https://github.com/wiss-54/fullstack-eticaret/actions',
      shop: shopUrl,
      admin: adminUrl,
    },
  };
}

async function runServiceCheck(name) {
  const { shopUrl, adminUrl, apiUrl } = monitorUrls();

  if (name === 'database') {
    return checkDatabase().catch((err) => ({
      status: 'down',
      error: err instanceof Error ? err.message : 'Database check failed',
    }));
  }
  if (name === 'shop') return checkHttpUrl(shopUrl);
  if (name === 'adminPanel') return checkHttpUrl(adminUrl);
  if (name === 'api') return checkHttpUrl(apiUrl);

  const error = new Error(`Bilinmeyen servis kontrolu: ${name}`);
  error.statusCode = 400;
  throw error;
}

/**
 * Uptime skoru: ayni hedefe N kez istek at, kacinin donup "up" oldugunu olc.
 * Varsayilan hedef: public API health URL.
 */
async function runUptimeScore({ attempts = 10, target = 'api' } = {}) {
  const total = Math.min(20, Math.max(1, Number(attempts) || 10));
  if (!SERVICE_CHECK_KEYS.includes(target)) {
    const error = new Error(`Gecerli uptime hedefleri: ${SERVICE_CHECK_KEYS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const startedAt = Date.now();
  const probes = await Promise.all(
    Array.from({ length: total }, async (_, index) => {
      const result = await runServiceCheck(target);
      return {
        index: index + 1,
        ok: result.status === 'up',
        status: result.status,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        error: result.error,
      };
    }),
  );

  const success = probes.filter((probe) => probe.ok).length;
  const failed = total - success;

  return {
    target,
    targetUrl:
      target === 'shop'
        ? monitorUrls().shopUrl
        : target === 'adminPanel'
          ? monitorUrls().adminUrl
          : target === 'api'
            ? monitorUrls().apiUrl
            : 'database',
    attempts: total,
    success,
    failed,
    scorePercent: Math.round((success / total) * 100),
    durationMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
    probes,
  };
}

async function getSystemStatus() {
  const [meta, database, shop, adminPanel, api] = await Promise.all([
    getStatusMeta(),
    runServiceCheck('database'),
    runServiceCheck('shop'),
    runServiceCheck('adminPanel'),
    runServiceCheck('api'),
  ]);

  return {
    checkedAt: meta.checkedAt,
    deploy: meta.deploy,
    backup: meta.backup,
    services: {
      database,
      api,
      shop,
      adminPanel,
      backend: meta.backend,
    },
    server: meta.server,
    stats: meta.stats,
    links: meta.links,
  };
}

module.exports = {
  SERVICE_CHECK_KEYS,
  getStatusMeta,
  runServiceCheck,
  runUptimeScore,
  getSystemStatus,
};
