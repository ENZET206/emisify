const TOPICS = [
  {
    keys: ['transport', 'motor', 'mobil', 'bus', 'kereta', 'krl', 'car', 'train', 'jalan', 'sepeda', 'bike', 'ojek', 'pesawat', 'flight'],
    id: 'Untuk transportasi, emisi dihitung dari jarak × faktor emisi kendaraan. Di Emisify, motor bensin diasumsikan ±0,058 kg CO2e/km, mobil bensin ±0,19 kg CO2e/km, bus ±0,1 dan KRL ±0,035 kg CO2e per penumpang-km (nilai DEMO).\n\nIde praktis:\n• Gabungkan beberapa keperluan dalam satu perjalanan.\n• Untuk jarak < 3 km, coba jalan kaki atau bersepeda.\n• Pakai KRL/bus untuk rute rutin bila tersedia.',
    en: 'For transport, emissions are distance × the vehicle emission factor. Emisify assumes ~0.058 kg CO2e/km for a gasoline motorbike, ~0.19 for a gasoline car, ~0.1 for buses and ~0.035 kg CO2e per passenger-km for trains (DEMO values).\n\nPractical ideas:\n• Combine errands into one trip.\n• Walk or cycle for trips under 3 km.\n• Use trains/buses for routine routes when available.',
  },
  {
    keys: ['ac', 'pendingin', 'air con', 'aircon', 'suhu', 'temperature'],
    id: 'AC sering menjadi pemakai listrik terbesar di rumah. Emisify mengasumsikan 1 PK ≈ 800 W dan AC inverter ±30% lebih hemat.\n\nCoba:\n• Atur suhu 24–26°C, bukan 16–18°C.\n• Tutup pintu/jendela dan pakai tirai saat siang.\n• Bersihkan filter rutin agar kerja kompresor lebih ringan.',
    en: 'AC is often the largest electricity user at home. Emisify assumes 1 HP ≈ 800 W and inverter units ~30% more efficient.\n\nTry:\n• Set 24–26°C instead of 16–18°C.\n• Close doors/windows and use curtains during the day.\n• Clean filters regularly so the compressor works less.',
  },
  {
    keys: ['listrik', 'kwh', 'lampu', 'led', 'electric', 'tagihan', 'bill', 'token', 'standby'],
    id: 'Emisi listrik = kWh × faktor grid. Emisify memakai perkiraan ±0,87 kg CO2e/kWh untuk jaringan Jawa-Madura-Bali (ESTIMASI, perlu diverifikasi).\n\nLangkah mudah:\n• Ganti lampu ke LED.\n• Cabut charger dan matikan stopkontak perangkat standby.\n• Pakai peralatan berat (setrika, mesin cuci) sekaligus, bukan berulang.',
    en: 'Electricity emissions = kWh × grid factor. Emisify uses an estimated ~0.87 kg CO2e/kWh for the Java-Madura-Bali grid (ESTIMATE, to be verified).\n\nEasy steps:\n• Switch to LED bulbs.\n• Unplug chargers and switch off standby devices.\n• Batch heavy appliance use (iron, washing machine).',
  },
  {
    keys: ['elektronik', 'laptop', 'hp', 'smartphone', 'tv', 'gadget', 'device', 'perangkat', 'produksi', 'manufactur'],
    id: 'Untuk perangkat elektronik, Emisify menghitung dua bagian: emisi pemakaian listrik dan porsi jejak produksi yang dibagi rata selama masa pakai.\n\nArtinya, memakai perangkat lebih lama (merawat baterai, memperbaiki daripada membeli baru) ikut menurunkan porsi emisi per bulan. Mode hemat daya dan mematikan layar saat tidak dipakai juga membantu.',
    en: 'For electronics, Emisify counts two parts: electricity use and a share of the manufacturing footprint spread across the lifespan.\n\nSo keeping a device longer (caring for the battery, repairing instead of replacing) lowers its monthly share. Power-saving mode and turning screens off also help.',
  },
  {
    keys: ['pohon', 'tree', 'setara', 'equivalent'],
    id: 'Kesetaraan pohon di Emisify memakai asumsi kasar: satu pohon menyerap ±21 kg CO2 per tahun (±1,75 kg per bulan). Angka ini hanya ilustrasi agar hasil lebih mudah dibayangkan, bukan perhitungan penyerapan yang presisi.',
    en: 'Emisify\'s tree equivalence uses a rough assumption: one tree absorbs ~21 kg CO2 per year (~1.75 kg per month). It is only an illustration to make results relatable, not a precise sequestration figure.',
  },
  {
    keys: ['faktor', 'factor', 'sumber', 'source', 'akurat', 'accurate', 'asumsi', 'assumption', 'hitung', 'calculate', 'rumus', 'formula'],
    id: 'Rumus umum Emisify: emisi (kg CO2e) = data aktivitas × faktor emisi. Faktor yang dipakai berstatus DEMO/ESTIMASI dan dicatat bersama sumbernya di setiap hasil, sehingga perhitungan bisa diaudit. Hasilnya cocok untuk edukasi dan membandingkan kebiasaan, bukan untuk pelaporan resmi.',
    en: 'Emisify\'s general formula: emissions (kg CO2e) = activity data × emission factor. Factors are DEMO/ESTIMATE and stored with their source on every result so calculations can be audited. Results are for learning and comparing habits, not official reporting.',
  },
];

const FALLBACK = {
  id: 'Aku bisa membantu menjelaskan hasil emisimu, faktor emisi, dan ide kebiasaan rendah karbon untuk transportasi, listrik, AC, dan elektronik. Coba tanyakan misalnya: "Kenapa transportasi menyumbang emisi terbesar?" atau "Bagaimana cara menghemat AC?"',
  en: 'I can help explain your emission results, emission factors, and low-carbon habit ideas for transport, electricity, AC and electronics. Try asking: "Why is transport my biggest source?" or "How can I use my AC more efficiently?"',
};

function demoAnswer({ message, lang, contextSummary, recommendation }) {
  const text = message.toLowerCase();
  const l = lang === 'en' ? 'en' : 'id';
  const topic = TOPICS.find((tp) => tp.keys.some((k) => text.includes(k)));
  const parts = [];
  if (topic) parts.push(topic[l]);
  else if (recommendation) {
    parts.push(l === 'en'
      ? `About "${recommendation.title}": ${recommendation.description}\n\nEstimated reduction is around ${recommendation.reductionKgPerMonth} kg CO2e/month, assuming ${recommendation.assumption} Treat it as an estimate.`
      : `Tentang "${recommendation.title}": ${recommendation.description}\n\nEstimasi pengurangannya sekitar ${recommendation.reductionKgPerMonth} kg CO2e/bulan, dengan asumsi ${recommendation.assumption} Anggap ini perkiraan, bukan kepastian.`);
  } else parts.push(FALLBACK[l]);
  if (contextSummary) parts.push(contextSummary[l]);
  return parts.join('\n\n');
}

async function* streamDemo(args) {
  const answer = demoAnswer(args);
  const tokens = answer.split(/(\s+)/);
  for (let i = 0; i < tokens.length; i += 6) {
    yield tokens.slice(i, i + 6).join('');
    await new Promise((r) => setTimeout(r, 25));
  }
}

module.exports = { name: 'demo', isConfigured: () => true, stream: streamDemo };
