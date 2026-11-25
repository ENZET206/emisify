// PostgreSQL connection with the `pg` driver. All data access uses raw SQL with $1, $2 … parameters
// (never string concatenation), so user input can't change the query (SQL injection safe).
const crypto = require('crypto');
const pg = require('pg');
const env = require('./env');

// TIMESTAMP columns store UTC: read them as UTC and send JS Dates as UTC.
pg.types.setTypeParser(1114, (s) => new Date(`${s.replace(' ', 'T')}Z`));
pg.defaults.parseInputDatesAsUTC = true;

// `?schema=public` in DATABASE_URL is not a libpq option; drop query params `pg` doesn't understand.
function connectionString(url) {
  const u = new URL(url);
  u.searchParams.delete('schema');
  return u.toString();
}

// Session time zone UTC, so NOW() / CURRENT_TIMESTAMP defaults are stored in UTC like the dates sent from JS.
const pool = new pg.Pool({ connectionString: connectionString(env.databaseUrl), options: '-c TimeZone=UTC' });

// Runs one parameterized query and returns the rows.
async function query(text, params = [], client = pool) {
  const { rows } = await client.query(text, params);
  return rows;
}

// First row or null.
async function one(text, params = [], client = pool) {
  return (await query(text, params, client))[0] || null;
}

// Runs `fn(client)` inside BEGIN … COMMIT; any error rolls everything back.
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Primary keys are TEXT; new rows get a random UUID.
const newId = () => crypto.randomUUID();

// JSONB values are sent as JSON text so arrays aren't mistaken for PostgreSQL arrays.
const json = (v) => JSON.stringify(v);

module.exports = { pool, query, one, transaction, newId, json };
