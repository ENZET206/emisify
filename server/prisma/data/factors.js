// All factors are DEMO/ESTIMATE values for education. Verify before any official use.
const GRID = 0.87;
const GASOLINE_KG_PER_L = 2.31;
const DIESEL_KG_PER_L = 2.68;

const r4 = (n) => Math.round(n * 10000) / 10000;

const factors = [
  {
    key: 'electricity.grid', activityType: 'ELECTRICITY', value: GRID, inputUnit: 'kWh', year: 2019, status: 'ESTIMATE',
    name: { id: 'Listrik jaringan PLN (Jawa-Madura-Bali)', en: 'PLN grid electricity (Java-Madura-Bali)' },
    source: 'Perkiraan faktor emisi grid JAMALI ~0,87 kg CO2e/kWh (Kementerian ESDM, 2019), dibulatkan',
    notes: 'Nilai grid berbeda per wilayah dan per tahun. Perlu diverifikasi dengan publikasi ESDM terbaru.',
  },
  {
    key: 'ac.grid', activityType: 'AC', value: GRID, inputUnit: 'kWh', year: 2019, status: 'ESTIMATE',
    name: { id: 'Listrik untuk AC', en: 'Electricity for air conditioning' },
    source: 'Sama dengan faktor grid JAMALI ~0,87 kg CO2e/kWh (Kementerian ESDM, 2019)',
    notes: 'Daya AC diasumsikan dari PK (1 PK ≈ 800 W rata-rata). AC inverter diasumsikan 30% lebih hemat.',
  },
  {
    key: 'electronics.grid', activityType: 'ELECTRONICS', value: GRID, inputUnit: 'kWh', year: 2019, status: 'ESTIMATE',
    name: { id: 'Listrik untuk perangkat elektronik', en: 'Electricity for electronic devices' },
    source: 'Sama dengan faktor grid JAMALI ~0,87 kg CO2e/kWh (Kementerian ESDM, 2019)',
    notes: 'Konsumsi daya per perangkat adalah asumsi rata-rata dan dapat diubah pengguna.',
  },
  {
    key: 'transport.motor.gasoline', activityType: 'TRANSPORT', value: r4(GASOLINE_KG_PER_L / 40), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Motor bensin', en: 'Gasoline motorcycle' },
    source: 'Turunan: 2,31 kg CO2/L bensin (nilai umum IPCC 2006) ÷ asumsi 40 km/L',
    notes: 'Pertalite dan Pertamax memakai faktor bensin yang sama pada versi ini.',
  },
  {
    key: 'transport.motor.electric', activityType: 'TRANSPORT', value: r4(0.03 * GRID), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Motor listrik', en: 'Electric motorcycle' },
    source: 'Turunan: asumsi 0,03 kWh/km × 0,87 kg CO2e/kWh', notes: 'Belum termasuk emisi produksi baterai.',
  },
  {
    key: 'transport.car.gasoline', activityType: 'TRANSPORT', value: r4(GASOLINE_KG_PER_L / 12), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Mobil bensin', en: 'Gasoline car' },
    source: 'Turunan: 2,31 kg CO2/L bensin ÷ asumsi 12 km/L', notes: 'Dihitung per kendaraan, bukan per penumpang.',
  },
  {
    key: 'transport.car.diesel', activityType: 'TRANSPORT', value: r4(DIESEL_KG_PER_L / 14), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Mobil diesel (Solar/Dexlite)', en: 'Diesel car' },
    source: 'Turunan: 2,68 kg CO2/L solar (nilai umum IPCC 2006) ÷ asumsi 14 km/L', notes: 'Dihitung per kendaraan.',
  },
  {
    key: 'transport.car.electric', activityType: 'TRANSPORT', value: r4(0.15 * GRID), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Mobil listrik', en: 'Electric car' },
    source: 'Turunan: asumsi 0,15 kWh/km × 0,87 kg CO2e/kWh', notes: 'Belum termasuk emisi produksi baterai.',
  },
  {
    key: 'transport.bus', activityType: 'TRANSPORT', value: 0.1, inputUnit: 'km', year: 2023, status: 'DEMO',
    name: { id: 'Bus (per penumpang)', en: 'Bus (per passenger)' },
    source: 'Pendekatan nilai rata-rata bus lokal UK DESNZ 2023 (~0,1 kg CO2e/penumpang-km)', notes: 'Belum disesuaikan dengan okupansi bus di Indonesia.',
  },
  {
    key: 'transport.train', activityType: 'TRANSPORT', value: 0.035, inputUnit: 'km', year: 2023, status: 'DEMO',
    name: { id: 'Kereta / KRL (per penumpang)', en: 'Train / commuter rail (per passenger)' },
    source: 'Pendekatan nilai kereta nasional UK DESNZ 2023 (~0,035 kg CO2e/penumpang-km)', notes: 'Belum disesuaikan dengan bauran listrik KRL.',
  },
  {
    key: 'transport.ojek', activityType: 'TRANSPORT', value: r4(GASOLINE_KG_PER_L / 40), inputUnit: 'km', status: 'DEMO',
    name: { id: 'Ojek online (motor bensin)', en: 'Ride-hailing motorcycle' },
    source: 'Sama dengan motor bensin: 2,31 kg CO2/L ÷ 40 km/L', notes: 'Tidak menghitung perjalanan kosong pengemudi.',
  },
  {
    key: 'transport.plane', activityType: 'TRANSPORT', value: 0.255, inputUnit: 'km', year: 2023, status: 'DEMO',
    name: { id: 'Pesawat domestik (per penumpang)', en: 'Domestic flight (per passenger)' },
    source: 'Pendekatan penerbangan domestik UK DESNZ 2023 termasuk efek radiatif (~0,25 kg CO2e/penumpang-km)', notes: 'Nilai bervariasi menurut pesawat dan rute.',
  },
  {
    key: 'transport.active', activityType: 'TRANSPORT', value: 0, inputUnit: 'km', status: 'ESTIMATE',
    name: { id: 'Sepeda / jalan kaki', en: 'Cycling / walking' },
    source: 'Tidak ada emisi langsung dari bahan bakar', notes: 'Emisi tidak langsung (makanan, produksi sepeda) tidak dihitung.',
  },
];

const EMBODIED = { laptop: 300, smartphone: 60, tablet: 100, tv: 400, desktop: 500, headphone: 10, smartwatch: 15, refrigerator: 350 };
const DEVICE_NAMES = {
  laptop: ['Laptop', 'Laptop'], smartphone: ['Smartphone', 'Smartphone'], tablet: ['Tablet', 'Tablet'], tv: ['Televisi', 'Television'],
  desktop: ['PC Desktop', 'Desktop PC'], headphone: ['Headphone', 'Headphones'], smartwatch: ['Smartwatch', 'Smartwatch'], refrigerator: ['Kulkas', 'Refrigerator'],
};
for (const [device, kg] of Object.entries(EMBODIED)) {
  factors.push({
    key: `electronics.embodied.${device}`, activityType: 'ELECTRONICS', value: kg, inputUnit: 'unit', status: 'DEMO',
    name: { id: `Jejak produksi ${DEVICE_NAMES[device][0]}`, en: `Manufacturing footprint of ${DEVICE_NAMES[device][1]}` },
    source: 'Perkiraan kasar dari rentang laporan jejak produk produsen (product environmental reports)',
    notes: 'Dibagi rata selama masa penggunaan untuk mendapat porsi per periode.',
  });
}

module.exports = { factors, GRID };
