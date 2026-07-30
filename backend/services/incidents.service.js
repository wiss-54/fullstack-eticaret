const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const INCIDENTS_PATH = path.join(DATA_DIR, 'incidents.json');
const MAX_INCIDENTS = 100;

const TARGET_LABELS = {
  database: 'Veritabani',
  api: 'Backend API',
  shop: 'Magaza Sitesi',
  adminPanel: 'Admin Panel',
  backend: 'Backend',
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INCIDENTS_PATH)) {
    fs.writeFileSync(INCIDENTS_PATH, JSON.stringify({ incidents: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(INCIDENTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.incidents)) return { incidents: [] };
    return parsed;
  } catch {
    return { incidents: [] };
  }
}

function writeStore(store) {
  ensureStore();
  const trimmed = {
    incidents: store.incidents.slice(0, MAX_INCIDENTS),
  };
  fs.writeFileSync(INCIDENTS_PATH, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

function listIncidents({ limit = 50, includeOpen = true } = {}) {
  const store = readStore();
  let items = store.incidents;
  if (!includeOpen) {
    items = items.filter((item) => item.status === 'resolved');
  }
  return items.slice(0, Math.min(100, Math.max(1, Number(limit) || 50)));
}

function getOpenIncident(target) {
  const store = readStore();
  return store.incidents.find((item) => item.target === target && item.status === 'open') || null;
}

/**
 * Idempotent sync: down opens/updates, up resolves open incident.
 */
function syncIncident(target, { ok, message } = {}) {
  if (!TARGET_LABELS[target]) return null;

  const store = readStore();
  const now = new Date().toISOString();
  const openIndex = store.incidents.findIndex(
    (item) => item.target === target && item.status === 'open',
  );

  if (!ok) {
    if (openIndex >= 0) {
      store.incidents[openIndex].lastSeenAt = now;
      store.incidents[openIndex].message =
        message || store.incidents[openIndex].message || 'Servis yanit vermiyor';
      writeStore(store);
      return store.incidents[openIndex];
    }

    const incident = {
      id: `${target}-${Date.now()}`,
      target,
      label: TARGET_LABELS[target],
      status: 'open',
      message: message || 'Servis yanit vermiyor',
      startedAt: now,
      lastSeenAt: now,
      endedAt: null,
      durationSeconds: null,
    };
    store.incidents.unshift(incident);
    writeStore(store);
    return incident;
  }

  if (openIndex >= 0) {
    const started = new Date(store.incidents[openIndex].startedAt).getTime();
    store.incidents[openIndex].status = 'resolved';
    store.incidents[openIndex].endedAt = now;
    store.incidents[openIndex].lastSeenAt = now;
    store.incidents[openIndex].durationSeconds = Math.max(
      0,
      Math.round((Date.now() - started) / 1000),
    );
    writeStore(store);
    return store.incidents[openIndex];
  }

  return null;
}

function getIncidentSummary() {
  const incidents = listIncidents({ limit: 100 });
  const open = incidents.filter((item) => item.status === 'open');
  const lastResolved = incidents.find((item) => item.status === 'resolved') || null;
  return {
    openCount: open.length,
    open,
    lastResolved,
    recent: incidents.slice(0, 20),
  };
}

module.exports = {
  TARGET_LABELS,
  listIncidents,
  getOpenIncident,
  syncIncident,
  getIncidentSummary,
};
