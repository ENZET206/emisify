const { bySlug, DEVICES, AC_PK_WATT, TARIFFS } = require('./definitions');
const { todayKey, dayKeyToDate, addDaysKey } = require('../../utils/time');
const { AppError } = require('../../utils/http');

const TREE_KG_PER_YEAR = 21;
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const t = (id, en) => ({ id, en });

const isVisible = (field, values) => !field.showIf || field.showIf.in.includes(values[field.showIf.field]);
const optionAllowed = (opt, values) => !opt.onlyIf || opt.onlyIf.in.includes(values[opt.onlyIf.field]);

function getDefinition(slug, subKey) {
  const activity = bySlug[slug];
  const sub = activity && activity.subTypes[subKey];
  if (!sub) throw new AppError(400, 'INVALID_ACTIVITY', 'Jenis aktivitas atau kategori tidak dikenal');
  return { activity, sub };
}

function validateInputs(fields, raw) {
  const values = {};
  const errors = {};
  const src = raw && typeof raw === 'object' ? raw : {};
  for (const f of fields.filter((x) => x.kind === 'select')) {
    const v = src[f.name] == null ? '' : String(src[f.name]);
    values[f.name] = v;
  }
  for (const f of fields) {
    if (!isVisible(f, values)) { delete values[f.name]; continue; }
    const rawVal = src[f.name];
    const empty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
    if (empty) {
      if (f.required) errors[f.name] = { code: 'required' };
      else delete values[f.name];
      continue;
    }
    if (f.kind === 'select') {
      const opt = f.options.find((o) => o.value === values[f.name]);
      if (!opt || !optionAllowed(opt, values)) errors[f.name] = { code: 'option' };
    } else if (f.kind === 'number') {
      const str = String(rawVal).trim().replace(',', '.');
      if (!/^-?\d+(\.\d+)?$/.test(str)) { errors[f.name] = { code: 'number' }; continue; }
      const n = Number(str);
      const max = f.maxByField ? f.maxByField.map[values[f.maxByField.field]] ?? f.max : f.max;
      if (!Number.isFinite(n)) errors[f.name] = { code: 'number' };
      else if (n < 0) errors[f.name] = { code: 'negative' };
      else if (n < f.min) errors[f.name] = { code: 'min', params: { min: f.min } };
      else if (n > max) errors[f.name] = { code: 'max', params: { max } };
      else if (f.integer && !Number.isInteger(n)) errors[f.name] = { code: 'integer' };
      else values[f.name] = n;
    } else if (f.kind === 'text') {
      const s = String(rawVal).trim();
      if (s.length > (f.maxLength || 100)) errors[f.name] = { code: 'maxLength', params: { max: f.maxLength } };
      else values[f.name] = s;
    } else if (f.kind === 'date') {
      const s = String(rawVal);
      const today = todayKey();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(dayKeyToDate(s).getTime())) errors[f.name] = { code: 'date' };
      else if (s > today) errors[f.name] = { code: 'future' };
      else if (s < addDaysKey(today, -730)) errors[f.name] = { code: 'tooOld' };
      else values[f.name] = s;
    }
  }
  if (Object.keys(errors).length) throw new AppError(422, 'VALIDATION_ERROR', 'Input tidak valid', { fields: errors });
  return values;
}

const optLabel = (fields, name, value) => fields.find((f) => f.name === name)?.options.find((o) => o.value === value)?.label;

function factorOrFail(factors, key) {
  const f = factors[key];
  if (!f) throw new AppError(500, 'FACTOR_MISSING', `Faktor emisi ${key} belum tersedia. Jalankan seed database.`);
  return f;
}

function frequencyInfo(v) {
  if (v.frequency === 'once') return { multiplier: 1, periodDays: 1 };
  if (v.frequency === 'weekly') return { multiplier: v.count, periodDays: v.count * 7 };
  return { multiplier: v.count, periodDays: v.count };
}

function computeTransport(subKey, v, fields, factors) {
  let key;
  let itemName;
  let multiplier = 1;
  let periodDays = 1;
  const lines = [];
  if (subKey === 'private') {
    if (v.vehicle === 'motor') key = v.fuel === 'electric' ? 'transport.motor.electric' : 'transport.motor.gasoline';
    else key = { diesel: 'transport.car.diesel', electric: 'transport.car.electric' }[v.fuel] || 'transport.car.gasoline';
    const vl = optLabel(fields, 'vehicle', v.vehicle);
    const fl = optLabel(fields, 'fuel', v.fuel);
    itemName = t(`${vl.id} · ${fl.id}`, `${vl.en} · ${fl.en}`);
    lines.push({ key: 'vehicle', label: t('Jenis kendaraan', 'Vehicle type'), value: vl }, { key: 'fuel', label: t('Bahan bakar', 'Fuel'), value: fl });
  } else if (subKey === 'air') {
    key = 'transport.plane';
    multiplier = v.roundTrip === 'yes' ? 2 : 1;
    itemName = t('Penerbangan domestik', 'Domestic flight');
    lines.push({ key: 'roundTrip', label: t('Jenis perjalanan', 'Trip type'), value: optLabel(fields, 'roundTrip', v.roundTrip) });
  } else {
    key = subKey === 'active' ? 'transport.active' : `transport.${v.mode}`;
    const ml = optLabel(fields, 'mode', v.mode);
    itemName = ml;
    lines.push({ key: 'mode', label: t('Moda', 'Mode'), value: ml });
  }
  lines.push({ key: 'distanceKm', label: t('Jarak tempuh', 'Distance'), value: v.distanceKm, unit: t('km', 'km') });
  if (subKey !== 'air') {
    ({ multiplier, periodDays } = frequencyInfo(v));
    lines.push({ key: 'frequency', label: t('Frekuensi', 'Frequency'), value: optLabel(fields, 'frequency', v.frequency) });
    if (v.frequency !== 'once') {
      lines.push({ key: 'count', label: t('Jumlah periode', 'Periods'), value: v.count, unit: v.frequency === 'weekly' ? t('minggu', 'weeks') : t('hari', 'days') });
    }
  }
  const factor = factorOrFail(factors, key);
  const km = v.distanceKm * multiplier;
  lines.push({ key: 'totalKm', label: t('Total jarak', 'Total distance'), value: round(km, 2), unit: t('km', 'km') });
  return { factor, quantity: km, unit: 'km', resultKg: km * factor.value, periodDays, itemName, lines, extraFactors: [] };
}

function computeElectricity(subKey, v, fields, factors) {
  const factor = factorOrFail(factors, 'electricity.grid');
  const periodDays = { day: 1, week: 7, month: 30 }[v.period];
  const lines = [];
  let kwh = v.kwh;
  if (subKey === 'bill') {
    const tariff = TARIFFS[v.tariff];
    kwh = v.amount / tariff;
    lines.push(
      { key: 'amount', label: t('Nominal tagihan', 'Bill amount'), value: v.amount, unit: t('Rp', 'IDR') },
      { key: 'tariff', label: t('Tarif', 'Tariff'), value: tariff, unit: t('Rp/kWh', 'IDR/kWh') },
    );
  }
  lines.push(
    { key: 'period', label: t('Periode', 'Period'), value: optLabel(fields, 'period', v.period) },
    { key: 'kwh', label: t('Energi listrik', 'Electricity'), value: round(kwh, 2), unit: t('kWh', 'kWh') },
  );
  return { factor, quantity: kwh, unit: 'kWh', resultKg: kwh * factor.value, periodDays, itemName: t('Listrik rumah', 'Home electricity'), lines, extraFactors: [] };
}

function computeAc(subKey, v, fields, factors) {
  const factor = factorOrFail(factors, 'ac.grid');
  const efficiency = subKey === 'inverter' ? 0.7 : 1;
  const watt = AC_PK_WATT[v.pk] * efficiency;
  const kwh = (watt * v.units * v.hoursPerDay * v.days) / 1000;
  const pkLabel = optLabel(fields, 'pk', v.pk);
  const lines = [
    { key: 'pk', label: t('Kapasitas', 'Capacity'), value: pkLabel },
    { key: 'units', label: t('Jumlah unit', 'Units'), value: v.units, unit: t('unit', 'units') },
    { key: 'hoursPerDay', label: t('Pemakaian per hari', 'Usage per day'), value: v.hoursPerDay, unit: t('jam', 'hours') },
    { key: 'days', label: t('Jumlah hari', 'Days'), value: v.days, unit: t('hari', 'days') },
    { key: 'watt', label: t('Daya efektif', 'Effective power'), value: round(watt, 1), unit: t('watt', 'watts') },
    { key: 'kwh', label: t('Energi listrik', 'Electricity'), value: round(kwh, 2), unit: t('kWh', 'kWh') },
  ];
  const name = subKey === 'inverter' ? t(`AC Inverter ${v.pk.replace('.', ',')} PK`, `Inverter AC ${v.pk} HP`) : t(`AC ${v.pk.replace('.', ',')} PK`, `AC ${v.pk} HP`);
  return { factor, quantity: kwh, unit: 'kWh', resultKg: kwh * factor.value, periodDays: v.days, itemName: name, lines, extraFactors: [] };
}

function computeElectronics(subKey, v, fields, factors) {
  const factor = factorOrFail(factors, 'electronics.grid');
  const device = DEVICES[subKey];
  const hours = v.condition === 'unused' ? 0 : v.hoursPerDay;
  const kwh = (v.watt * hours * v.days) / 1000;
  const usageKg = kwh * factor.value;
  const lines = [
    { key: 'watt', label: t('Daya rata-rata', 'Average power'), value: v.watt, unit: t('watt', 'watts') },
    { key: 'hoursPerDay', label: t('Pemakaian per hari', 'Usage per day'), value: hours, unit: t('jam', 'hours') },
    { key: 'days', label: t('Jumlah hari', 'Days'), value: v.days, unit: t('hari', 'days') },
    { key: 'condition', label: t('Kondisi', 'Condition'), value: optLabel(fields, 'condition', v.condition) },
    { key: 'kwh', label: t('Energi listrik', 'Electricity'), value: round(kwh, 2), unit: t('kWh', 'kWh') },
    { key: 'usageKg', label: t('Emisi pemakaian', 'Usage emission'), value: round(usageKg), unit: t('kg CO2e', 'kg CO2e') },
  ];
  const extraFactors = [];
  let embodiedKg = 0;
  if (subKey !== 'other') {
    const emb = factorOrFail(factors, `electronics.embodied.${subKey}`);
    const years = Number(v.lifespanYears);
    embodiedKg = (emb.value / (years * 365)) * v.days;
    extraFactors.push(emb);
    lines.splice(3, 0, { key: 'lifespanYears', label: t('Masa penggunaan', 'Lifespan'), value: years, unit: t('tahun', 'years') });
    lines.push({ key: 'embodiedKg', label: t('Porsi jejak produksi', 'Manufacturing share'), value: round(embodiedKg), unit: t('kg CO2e', 'kg CO2e') });
  }
  const itemName = v.itemName ? t(v.itemName, v.itemName) : device.label;
  return { factor, quantity: kwh, unit: 'kWh', resultKg: usageKg + embodiedKg, periodDays: v.days, itemName, lines, extraFactors };
}

const COMPUTERS = { TRANSPORT: computeTransport, ELECTRICITY: computeElectricity, AC: computeAc, ELECTRONICS: computeElectronics };

const factorSnapshot = (f) => ({ key: f.key, value: f.value, inputUnit: f.inputUnit, outputUnit: f.outputUnit, status: f.status, source: f.source, year: f.year, name: f.name, notes: f.notes });

function calculate(slug, subKey, rawInputs, factors) {
  const { activity, sub } = getDefinition(slug, subKey);
  const values = validateInputs(sub.fields, rawInputs);
  const r = COMPUTERS[activity.type](subKey, values, sub.fields, factors);
  const resultKg = round(r.resultKg);
  return {
    activityType: activity.type,
    activitySlug: slug,
    impactCategory: activity.impactCategory,
    subType: subKey,
    itemName: r.itemName,
    inputs: values,
    quantity: round(r.quantity, 4),
    unit: r.unit,
    factor: r.factor,
    breakdown: { lines: r.lines, factors: [r.factor, ...r.extraFactors].map(factorSnapshot) },
    periodDays: r.periodDays,
    resultKg,
    activityDate: values.activityDate,
    equivalentTreesMonth: round(resultKg / (TREE_KG_PER_YEAR / 12), 1),
  };
}

module.exports = { calculate, getDefinition, TREE_KG_PER_YEAR, round };
