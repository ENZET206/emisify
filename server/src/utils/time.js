const TZ = process.env.APP_TIMEZONE || 'Asia/Jakarta';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

// Activity dates are stored as the calendar day at 12:00 UTC so aggregation is timezone-independent.
const todayKey = () => fmt.format(new Date());
const dayKeyToDate = (key) => new Date(`${key}T12:00:00.000Z`);
const dateToDayKey = (d) => new Date(d).toISOString().slice(0, 10);
const addDaysKey = (key, n) => dateToDayKey(new Date(dayKeyToDate(key).getTime() + n * 86400000));
const localDayKey = (d) => fmt.format(new Date(d));

function monthStartKey(key, offset = 0) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1, 12));
  return dateToDayKey(d);
}

module.exports = { TZ, todayKey, dayKeyToDate, dateToDayKey, addDaysKey, localDayKey, monthStartKey };
