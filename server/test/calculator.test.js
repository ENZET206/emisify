// Unit tests for the emission calculator (pure logic, no database).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../src/services/calculator/calculator.service');
const { factors: factorList } = require('../prisma/data/factors');
const { todayKey, addDaysKey } = require('../src/utils/time');

const FACTORS = Object.fromEntries(factorList.map((f) => [f.key, f]));
const today = todayKey();
const calc = (slug, sub, inputs, factors = FACTORS) => calculate(slug, sub, { activityDate: today, ...inputs }, factors);

// Asserts that calculate() rejects with a 422 field error of the given code.
function assertFieldError(fn, field, code) {
  assert.throws(fn, (err) => {
    assert.equal(err.status, 422);
    assert.equal(err.details.fields[field]?.code, code, `expected ${field}=${code}, got ${JSON.stringify(err.details.fields)}`);
    return true;
  });
}

describe('listrik', () => {
  test('100 kWh per bulan = 87 kg CO₂e (100 × 0,87)', () => {
    const r = calc('electricity', 'kwh', { kwh: 100, period: 'month' });
    assert.equal(r.resultKg, 87);
    assert.equal(r.periodDays, 30);
    assert.equal(r.activityType, 'ELECTRICITY');
    assert.equal(r.impactCategory, 'ENERGY');
  });

  test('tagihan Rp144.470 pada tarif 1.444,70/kWh = 100 kWh = 87 kg', () => {
    const r = calc('electricity', 'bill', { amount: 144470, tariff: 'r1_1300', period: 'month' });
    assert.equal(r.quantity, 100);
    assert.equal(r.resultKg, 87);
  });

  test('angka dengan koma desimal diterima ("12,5")', () => {
    const r = calc('electricity', 'kwh', { kwh: '12,5', period: 'day' });
    assert.equal(r.resultKg, 10.875);
    assert.equal(r.periodDays, 1);
  });

  test('kesetaraan pohon: 87 kg ÷ (21/12) ≈ 49,7 pohon', () => {
    assert.equal(calc('electricity', 'kwh', { kwh: 100, period: 'month' }).equivalentTreesMonth, 49.7);
  });
});

describe('transportasi', () => {
  test('motor bensin 10 km/hari selama 5 hari = 50 km × 0,0578', () => {
    const r = calc('transport', 'private', { vehicle: 'motor', fuel: 'pertalite', distanceKm: 10, frequency: 'daily', count: 5 });
    assert.equal(r.quantity, 50);
    assert.equal(r.resultKg, 2.89);
    assert.equal(r.periodDays, 5);
  });

  test('mobil bensin 100 km/minggu selama 2 minggu = 200 km × 0,1925, periode 14 hari', () => {
    const r = calc('transport', 'private', { vehicle: 'car', fuel: 'pertamax', distanceKm: 100, frequency: 'weekly', count: 2 });
    assert.equal(r.resultKg, 38.5);
    assert.equal(r.periodDays, 14);
  });

  test('sekali jalan tidak memakai jumlah periode', () => {
    const r = calc('transport', 'public', { mode: 'bus', distanceKm: 20, frequency: 'once', count: 99 });
    assert.equal(r.resultKg, 2); // 20 × 0,1
    assert.equal(r.inputs.count, undefined);
  });

  test('pesawat pulang-pergi dihitung 2× jarak', () => {
    const pp = calc('transport', 'air', { distanceKm: 900, roundTrip: 'yes' });
    const oneWay = calc('transport', 'air', { distanceKm: 900, roundTrip: 'no' });
    assert.equal(pp.resultKg, 459); // 1800 × 0,255
    assert.equal(oneWay.resultKg, 229.5);
  });

  test('sepeda / jalan kaki = 0 emisi', () => {
    assert.equal(calc('transport', 'active', { mode: 'bicycle', distanceKm: 15, frequency: 'daily', count: 20 }).resultKg, 0);
  });

  test('solar hanya boleh untuk mobil, bukan motor', () => {
    assertFieldError(() => calc('transport', 'private', { vehicle: 'motor', fuel: 'diesel', distanceKm: 10, frequency: 'once' }), 'fuel', 'option');
    assert.ok(calc('transport', 'private', { vehicle: 'car', fuel: 'diesel', distanceKm: 10, frequency: 'once' }).resultKg > 0);
  });

  test('per minggu maksimal 52 minggu', () => {
    assertFieldError(() => calc('transport', 'public', { mode: 'train', distanceKm: 10, frequency: 'weekly', count: 53 }), 'count', 'max');
  });
});

describe('AC', () => {
  test('AC standar 1 PK, 8 jam × 30 hari = 192 kWh = 167,04 kg', () => {
    const r = calc('ac', 'non_inverter', { pk: '1', units: 1, hoursPerDay: 8, days: 30 });
    assert.equal(r.quantity, 192);
    assert.equal(r.resultKg, 167.04);
  });

  test('AC inverter 30% lebih hemat dari AC standar', () => {
    const inv = calc('ac', 'inverter', { pk: '1', units: 1, hoursPerDay: 8, days: 30 });
    assert.equal(inv.resultKg, 116.928); // 192 × 0,7 × 0,87
  });

  test('jumlah unit mengalikan hasil', () => {
    const one = calc('ac', 'non_inverter', { pk: '1.5', units: 1, hoursPerDay: 4, days: 10 });
    const three = calc('ac', 'non_inverter', { pk: '1.5', units: 3, hoursPerDay: 4, days: 10 });
    assert.equal(three.resultKg, Math.round(one.resultKg * 3 * 1000) / 1000);
  });
});

describe('perangkat elektronik', () => {
  test('laptop 50 W, 6 jam × 30 hari, masa pakai 3 tahun = pemakaian + porsi jejak produksi', () => {
    const r = calc('electronics', 'laptop', { watt: 50, hoursPerDay: 6, days: 30, lifespanYears: '3', condition: 'in_use' });
    const usage = (50 * 6 * 30 / 1000) * 0.87; // 7,83
    const embodied = (300 / (3 * 365)) * 30; // ≈ 8,219
    assert.equal(r.resultKg, Math.round((usage + embodied) * 1000) / 1000);
    assert.equal(r.breakdown.factors.length, 2);
  });

  test('barang "sudah tidak digunakan" = 0 jam pemakaian, tapi jejak produksi tetap dihitung', () => {
    const r = calc('electronics', 'laptop', { watt: 50, hoursPerDay: 6, days: 30, lifespanYears: '3', condition: 'unused' });
    assert.equal(r.quantity, 0);
    assert.equal(r.resultKg, 8.219);
  });

  test('"perangkat lain" wajib diberi nama dan tidak punya jejak produksi', () => {
    assertFieldError(() => calc('electronics', 'other', { watt: 20, hoursPerDay: 5, days: 10, condition: 'in_use' }), 'itemName', 'required');
    const r = calc('electronics', 'other', { itemName: 'Kipas angin', watt: 20, hoursPerDay: 5, days: 10, condition: 'in_use' });
    assert.equal(r.resultKg, 0.87); // 1 kWh × 0,87
    assert.deepEqual(r.itemName, { id: 'Kipas angin', en: 'Kipas angin' });
  });
});

describe('validasi input', () => {
  test('field wajib kosong', () => {
    assertFieldError(() => calc('electricity', 'kwh', { period: 'month' }), 'kwh', 'required');
  });

  test('angka negatif ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: -5, period: 'month' }), 'kwh', 'negative');
  });

  test('bukan angka ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: 'seratus', period: 'month' }), 'kwh', 'number');
  });

  test('di bawah batas minimum ditolak', () => {
    assertFieldError(() => calc('electricity', 'bill', { amount: 500, tariff: 'r1_900', period: 'month' }), 'amount', 'min');
  });

  test('bilangan bulat wajib untuk jumlah hari', () => {
    assertFieldError(() => calc('ac', 'non_inverter', { pk: '1', units: 1, hoursPerDay: 8, days: 2.5 }), 'days', 'integer');
  });

  test('pilihan yang tidak ada ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: 10, period: 'year' }), 'period', 'option');
  });

  test('tanggal masa depan ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: 10, period: 'day', activityDate: addDaysKey(today, 1) }), 'activityDate', 'future');
  });

  test('tanggal lebih dari 2 tahun lalu ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: 10, period: 'day', activityDate: addDaysKey(today, -731) }), 'activityDate', 'tooOld');
  });

  test('format tanggal salah ditolak', () => {
    assertFieldError(() => calc('electricity', 'kwh', { kwh: 10, period: 'day', activityDate: '17/11/2026' }), 'activityDate', 'date');
  });

  test('jenis aktivitas tidak dikenal → 400', () => {
    assert.throws(() => calc('kapal', 'laut', {}), (err) => err.status === 400 && err.code === 'INVALID_ACTIVITY');
    assert.throws(() => calc('electricity', 'solar', {}), (err) => err.status === 400);
  });

  test('faktor emisi belum di-seed → error jelas, bukan hasil 0', () => {
    assert.throws(() => calc('electricity', 'kwh', { kwh: 10, period: 'day' }, {}), (err) => err.status === 500 && err.code === 'FACTOR_MISSING');
  });
});

test('hasil menyimpan snapshot faktor untuk audit', () => {
  const r = calc('electricity', 'kwh', { kwh: 100, period: 'month' });
  const [f] = r.breakdown.factors;
  assert.equal(f.key, 'electricity.grid');
  assert.equal(f.value, 0.87);
  assert.equal(f.status, 'ESTIMATE');
  assert.ok(f.source);
});
