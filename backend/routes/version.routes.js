const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DEPLOY_INFO_PATH = path.join(__dirname, '..', '.deploy-info.json');

function readDeployInfo() {
  try {
    return JSON.parse(fs.readFileSync(DEPLOY_INFO_PATH, 'utf8'));
  } catch {
    return null;
  }
}

router.get('/', (_req, res) => {
  const deploy = readDeployInfo();

  res.json({
    success: true,
    data: {
      commit: deploy?.commit ?? 'dev',
      deployedAt: deploy?.deployedAt ?? null,
    },
  });
});

module.exports = router;
