const env = require('./config/env');
const app = require('./app');
const prisma = require('./config/prisma');

const server = app.listen(env.port, () => {
  console.log(`Emisify API running on http://localhost:${env.port} (AI provider: ${env.ai.provider})`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
