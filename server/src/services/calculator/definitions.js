const t = (id, en) => ({ id, en });

const frequencyFields = [
  {
    name: 'frequency', kind: 'select', label: t('Frekuensi', 'Frequency'), required: true, default: 'daily',
    options: [
      { value: 'once', label: t('Sekali jalan', 'One trip') },
      { value: 'daily', label: t('Per hari', 'Per day') },
      { value: 'weekly', label: t('Per minggu', 'Per week') },
    ],
  },
  {
    name: 'count', kind: 'number', label: t('Jumlah periode', 'Number of periods'), required: true, default: 5, min: 1, max: 366, step: 1, integer: true,
    unitByField: { field: 'frequency', map: { daily: t('hari', 'days'), weekly: t('minggu', 'weeks') } },
    maxByField: { field: 'frequency', map: { daily: 366, weekly: 52 } },
    showIf: { field: 'frequency', in: ['daily', 'weekly'] },
    helper: t('Berapa hari/minggu kebiasaan ini dilakukan.', 'How many days/weeks you did this.'),
  },
];

const distanceField = (max = 5000) => ({
  name: 'distanceKm', kind: 'number', label: t('Jarak tempuh', 'Distance'), unit: t('km', 'km'),
  required: true, min: 0.1, max, step: 0.1, placeholder: '12',
  helper: t('Isi jarak untuk satu perjalanan, satu hari, atau satu minggu sesuai frekuensi.', 'Distance for one trip, one day, or one week depending on frequency.'),
});

const dateField = { name: 'activityDate', kind: 'date', label: t('Tanggal aktivitas', 'Activity date'), required: true };

const DEVICES = {
  laptop: { label: t('Laptop', 'Laptop'), icon: 'laptop', watt: 50, desc: t('Kerja & kuliah', 'Work & study') },
  smartphone: { label: t('Smartphone', 'Smartphone'), icon: 'smartphone', watt: 8, desc: t('Pengisian daya harian', 'Daily charging') },
  tablet: { label: t('Tablet', 'Tablet'), icon: 'tablet', watt: 10, desc: t('Hiburan & belajar', 'Entertainment & study') },
  tv: { label: t('Televisi', 'Television'), icon: 'tv', watt: 100, desc: t('TV LED rumah', 'Home LED TV') },
  desktop: { label: t('PC Desktop', 'Desktop PC'), icon: 'monitor', watt: 200, desc: t('PC & monitor', 'PC & monitor') },
  headphone: { label: t('Headphone', 'Headphones'), icon: 'headphones', watt: 3, desc: t('Audio nirkabel', 'Wireless audio') },
  smartwatch: { label: t('Smartwatch', 'Smartwatch'), icon: 'watch', watt: 2, desc: t('Perangkat wearable', 'Wearable') },
  refrigerator: { label: t('Kulkas', 'Refrigerator'), icon: 'refrigerator', watt: 120, desc: t('Rata-rata siklus kompresor', 'Average compressor cycle') },
  other: { label: t('Perangkat lain', 'Other device'), icon: 'plug', watt: 20, desc: t('Isi daya sendiri', 'Enter your own wattage') },
};

const AC_PK_WATT = { '0.5': 400, '0.75': 600, '1': 800, '1.5': 1200, '2': 1600 };
const TARIFFS = { r1_900: 1352, r1_1300: 1444.7, r1_3500: 1699.53 };

const ACTIVITY_TYPES = [
  {
    type: 'TRANSPORT', slug: 'transport', icon: 'car', impactCategory: 'VEHICLE',
    label: t('Transportasi', 'Transportation'), desc: t('Mobil, motor, bus, kereta, pesawat', 'Car, motorbike, bus, train, plane'),
    subTypes: {
      private: {
        label: t('Kendaraan Pribadi', 'Private Vehicle'), icon: 'car', desc: t('Motor atau mobil milik sendiri', 'Your own motorbike or car'),
        fields: [
          {
            name: 'vehicle', kind: 'select', label: t('Jenis kendaraan', 'Vehicle type'), required: true, default: 'motor',
            options: [{ value: 'motor', label: t('Motor', 'Motorbike') }, { value: 'car', label: t('Mobil', 'Car') }],
          },
          {
            name: 'fuel', kind: 'select', label: t('Jenis bahan bakar', 'Fuel type'), required: true, default: 'pertalite',
            options: [
              { value: 'pertalite', label: t('Pertalite', 'Pertalite (gasoline)') },
              { value: 'pertamax', label: t('Pertamax', 'Pertamax (gasoline)') },
              { value: 'diesel', label: t('Solar / Dexlite', 'Diesel'), onlyIf: { field: 'vehicle', in: ['car'] } },
              { value: 'electric', label: t('Listrik', 'Electric') },
            ],
          },
          distanceField(), ...frequencyFields, dateField,
        ],
      },
      public: {
        label: t('Transportasi Umum', 'Public Transport'), icon: 'bus', desc: t('Bus, KRL/kereta, ojek online', 'Bus, train, ride-hailing'),
        fields: [
          {
            name: 'mode', kind: 'select', label: t('Moda transportasi', 'Transport mode'), required: true, default: 'bus',
            options: [
              { value: 'bus', label: t('Bus / TransJakarta', 'Bus') },
              { value: 'train', label: t('KRL / Kereta / MRT', 'Train / commuter rail') },
              { value: 'ojek', label: t('Ojek online (motor)', 'Ride-hailing motorbike') },
            ],
          },
          distanceField(), ...frequencyFields, dateField,
        ],
      },
      air: {
        label: t('Perjalanan Udara', 'Air Travel'), icon: 'plane', desc: t('Penerbangan domestik', 'Domestic flights'),
        fields: [
          { ...distanceField(20000), label: t('Jarak penerbangan (sekali jalan)', 'Flight distance (one way)'), placeholder: '900' },
          {
            name: 'roundTrip', kind: 'select', label: t('Jenis perjalanan', 'Trip type'), required: true, default: 'yes',
            options: [{ value: 'yes', label: t('Pulang-pergi', 'Round trip') }, { value: 'no', label: t('Sekali jalan', 'One way') }],
          },
          dateField,
        ],
      },
      active: {
        label: t('Sepeda / Jalan Kaki', 'Cycling / Walking'), icon: 'bike', desc: t('Mobilitas tanpa emisi langsung', 'Zero direct emission'),
        fields: [
          {
            name: 'mode', kind: 'select', label: t('Aktivitas', 'Activity'), required: true, default: 'bicycle',
            options: [{ value: 'bicycle', label: t('Bersepeda', 'Cycling') }, { value: 'walk', label: t('Jalan kaki', 'Walking') }],
          },
          distanceField(500), ...frequencyFields, dateField,
        ],
      },
    },
  },
  {
    type: 'ELECTRICITY', slug: 'electricity', icon: 'zap', impactCategory: 'ENERGY',
    label: t('Listrik', 'Electricity'), desc: t('Penggunaan listrik rumah', 'Household electricity use'),
    subTypes: {
      kwh: {
        label: t('Berdasarkan kWh', 'By kWh'), icon: 'gauge', desc: t('Angka dari meteran / token', 'From your meter or token'),
        fields: [
          { name: 'kwh', kind: 'number', label: t('Pemakaian listrik', 'Electricity used'), unit: t('kWh', 'kWh'), required: true, min: 0.1, max: 100000, step: 0.1, placeholder: '120' },
          {
            name: 'period', kind: 'select', label: t('Periode', 'Period'), required: true, default: 'month',
            options: [{ value: 'day', label: t('Per hari', 'Per day') }, { value: 'week', label: t('Per minggu', 'Per week') }, { value: 'month', label: t('Per bulan', 'Per month') }],
          },
          dateField,
        ],
      },
      bill: {
        label: t('Berdasarkan Tagihan', 'By Bill Amount'), icon: 'receipt', desc: t('Dari nominal tagihan (Rp)', 'From your bill (IDR)'),
        fields: [
          { name: 'amount', kind: 'number', label: t('Nominal tagihan / token', 'Bill / token amount'), unit: t('Rp', 'IDR'), required: true, min: 1000, max: 100000000, step: 1000, placeholder: '250000' },
          {
            name: 'tariff', kind: 'select', label: t('Golongan tarif', 'Tariff group'), required: true, default: 'r1_1300',
            options: [
              { value: 'r1_900', label: t('R-1 900 VA (Rp1.352/kWh)', 'R-1 900 VA (IDR 1,352/kWh)') },
              { value: 'r1_1300', label: t('R-1 1.300–2.200 VA (Rp1.444,70/kWh)', 'R-1 1,300–2,200 VA (IDR 1,444.70/kWh)') },
              { value: 'r1_3500', label: t('R-2/R-3 ≥3.500 VA (Rp1.699,53/kWh)', 'R-2/R-3 ≥3,500 VA (IDR 1,699.53/kWh)') },
            ],
            helper: t('Tarif asumsi, belum termasuk pajak/biaya admin.', 'Assumed tariff, excluding tax/admin fees.'),
          },
          {
            name: 'period', kind: 'select', label: t('Periode tagihan', 'Bill period'), required: true, default: 'month',
            options: [{ value: 'week', label: t('Per minggu', 'Per week') }, { value: 'month', label: t('Per bulan', 'Per month') }],
          },
          dateField,
        ],
      },
    },
  },
  {
    type: 'AC', slug: 'ac', icon: 'air-vent', impactCategory: 'ENERGY',
    label: t('AC', 'Air Conditioner'), desc: t('Pendingin ruangan', 'Room air conditioning'),
    subTypes: Object.fromEntries(['non_inverter', 'inverter'].map((k) => [k, {
      label: k === 'inverter' ? t('AC Inverter', 'Inverter AC') : t('AC Standar', 'Standard AC'),
      icon: 'air-vent',
      desc: k === 'inverter' ? t('Asumsi ±30% lebih hemat', 'Assumed ~30% more efficient') : t('Non-inverter', 'Non-inverter'),
      fields: [
        {
          name: 'pk', kind: 'select', label: t('Kapasitas AC', 'AC capacity'), required: true, default: '1',
          options: Object.keys(AC_PK_WATT).map((pk) => ({ value: pk, label: t(`${pk.replace('.', ',')} PK (±${AC_PK_WATT[pk]} W)`, `${pk} HP (~${AC_PK_WATT[pk]} W)`) })),
        },
        { name: 'units', kind: 'number', label: t('Jumlah unit', 'Number of units'), unit: t('unit', 'units'), required: true, default: 1, min: 1, max: 20, step: 1, integer: true },
        { name: 'hoursPerDay', kind: 'number', label: t('Lama pemakaian per hari', 'Usage per day'), unit: t('jam', 'hours'), required: true, min: 0.5, max: 24, step: 0.5, placeholder: '8' },
        { name: 'days', kind: 'number', label: t('Jumlah hari', 'Number of days'), unit: t('hari', 'days'), required: true, default: 30, min: 1, max: 366, step: 1, integer: true },
        dateField,
      ],
    }])),
  },
  {
    type: 'ELECTRONICS', slug: 'electronics', icon: 'monitor', impactCategory: 'ELECTRONICS',
    label: t('Perangkat Elektronik', 'Electronic Devices'), desc: t('Laptop, smartphone, TV, dll', 'Laptop, phone, TV, etc.'),
    subTypes: Object.fromEntries(Object.entries(DEVICES).map(([k, d]) => [k, {
      label: d.label, icon: d.icon, desc: d.desc,
      fields: [
        { name: 'itemName', kind: 'text', label: t('Nama barang', 'Item name'), required: k === 'other', maxLength: 60, placeholder: d.label.id, helper: t('Opsional, contoh: Laptop kuliah', 'Optional, e.g. Study laptop') },
        { name: 'watt', kind: 'number', label: t('Daya rata-rata', 'Average power'), unit: t('watt', 'watts'), required: true, default: d.watt, min: 0.5, max: 5000, step: 0.5 },
        { name: 'hoursPerDay', kind: 'number', label: t('Lama pemakaian per hari', 'Usage per day'), unit: t('jam', 'hours'), required: true, min: 0, max: 24, step: 0.5, placeholder: '6' },
        { name: 'days', kind: 'number', label: t('Jumlah hari', 'Number of days'), unit: t('hari', 'days'), required: true, default: 30, min: 1, max: 366, step: 1, integer: true },
        ...(k === 'other' ? [] : [{
          name: 'lifespanYears', kind: 'select', label: t('Masa penggunaan', 'Usage lifespan'), required: true, default: '3',
          options: ['1', '2', '3', '4', '5', '7', '10'].map((y) => ({ value: y, label: t(`${y} Tahun`, `${y} ${y === '1' ? 'Year' : 'Years'}`) })),
          helper: t('Jejak produksi dibagi rata selama masa pakai.', 'Manufacturing footprint is spread across the lifespan.'),
        }]),
        {
          name: 'condition', kind: 'select', label: t('Kondisi', 'Condition'), required: true, default: 'in_use',
          options: [
            { value: 'in_use', label: t('Masih digunakan', 'In use') },
            { value: 'rarely', label: t('Jarang digunakan', 'Rarely used') },
            { value: 'unused', label: t('Sudah tidak digunakan', 'No longer used') },
          ],
          helper: t('Barang tidak terpakai tidak memakai listrik, tapi jejak produksinya tetap dihitung.', 'Unused items draw no power, but their manufacturing footprint still counts.'),
        },
        dateField,
      ],
    }])),
  },
];

const bySlug = Object.fromEntries(ACTIVITY_TYPES.map((a) => [a.slug, a]));
const byType = Object.fromEntries(ACTIVITY_TYPES.map((a) => [a.type, a]));

module.exports = { ACTIVITY_TYPES, bySlug, byType, DEVICES, AC_PK_WATT, TARIFFS };
