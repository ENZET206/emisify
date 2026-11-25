// HTTP tests for register/login/session and the Profile page endpoints, against an in-memory database.
const { db, startServer } = require('./helpers/setup');
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

let api;
let close;
let jars;
before(async () => { ({ request: api, close, jars } = await startServer()); });
after(() => close());
beforeEach(() => {
  db._users.clear();
  db._resetTokens.clear();
  for (const k of Object.keys(jars)) delete jars[k];
});

const PASSWORD = 'Rahasia123';
const register = (device = 'hp', overrides = {}) => api(device, 'POST', '/auth/register', { name: 'Budi', email: 'budi@contoh.id', password: PASSWORD, ...overrides });
const fieldCode = (res, field) => res.body.error?.details?.fields?.[field]?.code;

// Logs in a Google-only account (no password) by signing a session cookie directly.
function loginAsGoogleUser(device, user) {
  jars[device] = `emisify_token=${jwt.sign({ sub: user.id, ver: user.tokenVersion }, process.env.AUTH_SECRET, { algorithm: 'HS256' })}`;
}

describe('daftar & masuk', () => {
  test('daftar membuat sesi, password tidak pernah dikirim ke frontend', async () => {
    const res = await register();
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.email, 'budi@contoh.id');
    assert.equal(res.body.data.user.hasPassword, true);
    for (const secret of ['passwordHash', 'password', 'tokenVersion']) assert.ok(!(secret in res.body.data.user), `${secret} bocor`);
    assert.equal((await api('hp', 'GET', '/auth/me')).status, 200);
  });

  test('email yang sudah terdaftar ditolak', async () => {
    await register();
    const res = await register('laptop', { email: 'BUDI@contoh.id' });
    assert.equal(res.status, 409);
    assert.equal(fieldCode(res, 'email'), 'emailTaken');
  });

  test('password lemah ditolak', async () => {
    assert.equal(fieldCode(await register('hp', { password: 'pendek1' }), 'password'), 'passwordMin');
    assert.equal(fieldCode(await register('hp', { password: 'tanpaangka' }), 'password'), 'passwordNumber');
  });

  test('masuk dengan password salah ditolak dengan pesan yang sama seperti email tak terdaftar', async () => {
    await register();
    const wrong = await api('laptop', 'POST', '/auth/login', { email: 'budi@contoh.id', password: 'Salah12345' });
    const unknown = await api('laptop', 'POST', '/auth/login', { email: 'siapa@contoh.id', password: 'Salah12345' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error.message, unknown.body.error.message);
  });

  test('keluar menghapus sesi', async () => {
    await register();
    await api('hp', 'POST', '/auth/logout');
    assert.equal((await api('hp', 'GET', '/auth/me')).status, 401);
  });

  test('endpoint pribadi butuh login', async () => {
    assert.equal((await api('tamu', 'PATCH', '/user/profile', { name: 'X', age: null })).status, 401);
    assert.equal((await api('tamu', 'DELETE', '/user', {})).status, 401);
  });

  test('permintaan dari situs lain ditolak (CSRF), meski membawa cookie sesi', async () => {
    await register();
    const res = await api('hp', 'DELETE', '/user', { password: PASSWORD }, { Origin: 'https://situs-jahat.example' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN_ORIGIN');
    assert.equal(db._users.size, 1);
  });
});

describe('profil', () => {
  test('ubah nama dan umur', async () => {
    await register();
    const res = await api('hp', 'PATCH', '/user/profile', { name: '  Budi Santoso ', age: 21 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, 'Budi Santoso');
    assert.equal(res.body.data.user.age, 21);
    assert.ok(!('tokenVersion' in res.body.data.user));
  });

  test('umur boleh dikosongkan', async () => {
    await register('hp', { age: 30 });
    assert.equal((await api('hp', 'PATCH', '/user/profile', { name: 'Budi', age: null })).body.data.user.age, null);
  });

  test('nama terlalu pendek dan umur di luar batas ditolak', async () => {
    await register();
    const res = await api('hp', 'PATCH', '/user/profile', { name: 'B', age: 5 });
    assert.equal(res.status, 422);
    assert.equal(fieldCode(res, 'name'), 'nameMin');
    assert.equal(fieldCode(res, 'age'), 'ageMin');
  });

  test('email tidak bisa diubah lewat profil', async () => {
    await register();
    const res = await api('hp', 'PATCH', '/user/profile', { name: 'Budi', age: null, email: 'baru@contoh.id' });
    assert.equal(res.body.data.user.email, 'budi@contoh.id');
  });
});

describe('ganti password', () => {
  test('password lama wajib dan harus benar', async () => {
    await register();
    assert.equal(fieldCode(await api('hp', 'PATCH', '/user/password', { newPassword: 'Baru12345' }), 'currentPassword'), 'required');
    assert.equal(fieldCode(await api('hp', 'PATCH', '/user/password', { currentPassword: 'Salah123', newPassword: 'Baru12345' }), 'currentPassword'), 'wrongPassword');
  });

  test('password baru harus berbeda dan cukup kuat', async () => {
    await register();
    assert.equal(fieldCode(await api('hp', 'PATCH', '/user/password', { currentPassword: PASSWORD, newPassword: PASSWORD }), 'newPassword'), 'samePassword');
    assert.equal(fieldCode(await api('hp', 'PATCH', '/user/password', { currentPassword: PASSWORD, newPassword: 'lemah1' }), 'newPassword'), 'passwordMin');
  });

  test('berhasil: perangkat ini tetap masuk, perangkat lain dikeluarkan, password baru bisa dipakai', async () => {
    await register('hp');
    await api('laptop', 'POST', '/auth/login', { email: 'budi@contoh.id', password: PASSWORD });
    assert.equal((await api('laptop', 'GET', '/auth/me')).status, 200);

    const res = await api('hp', 'PATCH', '/user/password', { currentPassword: PASSWORD, newPassword: 'Baru12345' });
    assert.equal(res.status, 200);

    assert.equal((await api('hp', 'GET', '/auth/me')).status, 200, 'perangkat yang mengganti password tetap masuk');
    assert.equal((await api('laptop', 'GET', '/auth/me')).status, 401, 'perangkat lain harus keluar');
    assert.equal((await api('tablet', 'POST', '/auth/login', { email: 'budi@contoh.id', password: PASSWORD })).status, 401);
    assert.equal((await api('tablet', 'POST', '/auth/login', { email: 'budi@contoh.id', password: 'Baru12345' })).status, 200);
  });

  test('akun Google tanpa password bisa membuat password tanpa password lama', async () => {
    const g = db.createUser({ name: 'Gita', email: 'gita@contoh.id', googleId: 'google-123' });
    loginAsGoogleUser('hp', g);
    const res = await api('hp', 'PATCH', '/user/password', { newPassword: 'Google123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.hasPassword, true);
    assert.equal((await api('laptop', 'POST', '/auth/login', { email: 'gita@contoh.id', password: 'Google123' })).status, 200);
  });
});

describe('hapus akun', () => {
  test('wajib konfirmasi password yang benar', async () => {
    await register();
    assert.equal(fieldCode(await api('hp', 'DELETE', '/user', {}), 'password'), 'required');
    assert.equal(fieldCode(await api('hp', 'DELETE', '/user', { password: 'Salah123' }), 'password'), 'wrongPassword');
    assert.equal(db._users.size, 1, 'akun belum boleh terhapus');
  });

  test('berhasil: data terhapus, sesi berakhir, tidak bisa masuk lagi', async () => {
    await register();
    const res = await api('hp', 'DELETE', '/user', { password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(db._users.size, 0);
    assert.equal((await api('hp', 'GET', '/auth/me')).status, 401);
    assert.equal((await api('laptop', 'POST', '/auth/login', { email: 'budi@contoh.id', password: PASSWORD })).status, 401);
  });

  test('akun Google tanpa password konfirmasi dengan email', async () => {
    const g = db.createUser({ name: 'Gita', email: 'gita@contoh.id', googleId: 'google-123' });
    loginAsGoogleUser('hp', g);
    assert.equal(fieldCode(await api('hp', 'DELETE', '/user', { confirmEmail: 'lain@contoh.id' }), 'confirmEmail'), 'emailMismatch');
    assert.equal((await api('hp', 'DELETE', '/user', { confirmEmail: 'GITA@contoh.id' })).status, 200);
    assert.equal(db._users.size, 0);
  });
});
