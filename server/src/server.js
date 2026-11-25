const env = require('./config/env');
const app = require('./app');
const db = require('./config/db');

const server = app.listen(env.port, () => {
  console.log(`Emisify API running on http://localhost:${env.port} (AI provider: ${env.ai.provider})`);
});

const shutdown = async () => {
  server.close();
  await db.pool.end();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
