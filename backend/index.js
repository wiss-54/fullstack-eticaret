require('dotenv').config();

const app = require('./app');
const { runMigrations } = require('./migrate');

const PORT = process.env.PORT || 5000;

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Backend sunucusu ${PORT} portunda fırtına gibi çalışıyor!`);
  });
}

start().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
