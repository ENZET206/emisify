require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  authSecret: required('AUTH_SECRET'),
  clientUrls: required('CLIENT_URL').split(',').map((s) => s.trim()).filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  tokenTtlDays: Number(process.env.AUTH_TOKEN_TTL_DAYS || 7),
  challengeCooldownHours: Number(process.env.CHALLENGE_CHECKIN_COOLDOWN_HOURS ?? 20),
  appUrl: process.env.APP_URL || required('CLIENT_URL').split(',')[0].trim(),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },
  resetTokenMinutes: Number(process.env.RESET_TOKEN_MINUTES || 60),
  ai: {
    provider: (process.env.AI_PROVIDER || 'demo').toLowerCase(),
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    bridgeUrl: process.env.AI_BRIDGE_URL || '',
    bridgeToken: process.env.AI_BRIDGE_TOKEN || '',
  },
};

module.exports = env;
