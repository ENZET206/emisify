const c = (id, en) => ({ id, en });

const recommendations = [
  {
    slug: 'gunakan-transportasi-umum', activityType: 'TRANSPORT', reductionKgPerMonth: 7.5, image: '/assets/rec-bus.jpg', icon: 'bus', sortOrder: 1,
    content: c(
      { title: 'Gunakan Transportasi Umum', summary: 'Ganti sebagian perjalanan motor/mobil dengan bus atau KRL.', reason: 'Menggunakan transportasi umum mengurangi jumlah kendaraan pribadi di jalan, sehingga membantu menurunkan emisi karbon dan polusi udara. Satu bus atau kereta mengangkut banyak penumpang sekaligus.', steps: ['Pilih bus atau KRL untuk perjalanan rutin seperti ke kampus/kantor.', 'Rencanakan rute dan waktu keberangkatan lewat aplikasi transportasi.', 'Gunakan transportasi umum secara rutin bila memungkinkan, minimal 2x seminggu.'], assumption: 'mengganti 10 km/hari motor bensin (0,058 kg/km) dengan KRL (0,035 kg/km) selama 20 hari kerja, plus sebagian perjalanan mobil.' },
      { title: 'Use Public Transport', summary: 'Swap some motorbike/car trips for buses or trains.', reason: 'Public transport reduces the number of private vehicles on the road, lowering carbon emissions and air pollution. One bus or train carries many passengers at once.', steps: ['Choose buses or trains for routine trips to campus/work.', 'Plan routes and departure times with a transit app.', 'Use public transport regularly when possible, at least twice a week.'], assumption: 'replacing 10 km/day of gasoline motorbike (0.058 kg/km) with train (0.035 kg/km) over 20 workdays, plus some car trips.' },
    ),
  },
  {
    slug: 'jalan-kaki-bersepeda', activityType: 'TRANSPORT', reductionKgPerMonth: 3.5, icon: 'bike', sortOrder: 2,
    content: c(
      { title: 'Jalan Kaki atau Bersepeda untuk Jarak Dekat', summary: 'Perjalanan di bawah 3 km bisa bebas emisi langsung.', reason: 'Banyak perjalanan harian sebenarnya pendek. Untuk jarak dekat, berjalan atau bersepeda tidak menghasilkan emisi bahan bakar sekaligus menyehatkan.', steps: ['Catat perjalanan harian yang jaraknya di bawah 3 km.', 'Mulai dari satu rute, misalnya ke warung atau masjid terdekat.', 'Siapkan sepeda dan perlengkapan sederhana agar mudah dipakai.'], assumption: 'mengganti 3 km/hari perjalanan motor bensin selama 20 hari.' },
      { title: 'Walk or Cycle Short Trips', summary: 'Trips under 3 km can have zero direct emissions.', reason: 'Many daily trips are short. Walking or cycling short distances produces no fuel emissions and keeps you healthy.', steps: ['List daily trips shorter than 3 km.', 'Start with one route, such as to a nearby shop.', 'Keep a bike and simple gear ready to use.'], assumption: 'replacing 3 km/day of gasoline motorbike trips for 20 days.' },
    ),
  },
  {
    slug: 'kurangi-penggunaan-listrik', activityType: 'ELECTRICITY', reductionKgPerMonth: 8.7, icon: 'zap', sortOrder: 3,
    content: c(
      { title: 'Kurangi Penggunaan Listrik', summary: 'Matikan perangkat standby dan cabut charger yang tidak dipakai.', reason: 'Perangkat dalam mode standby tetap menarik daya. Kebiasaan kecil mematikan stopkontak bisa menurunkan pemakaian listrik bulanan.', steps: ['Gunakan stopkontak dengan saklar untuk TV, dispenser, dan set-top box.', 'Cabut charger setelah baterai penuh.', 'Manfaatkan cahaya alami pada siang hari.'], assumption: 'penghematan ±10 kWh/bulan × 0,87 kg CO2e/kWh.' },
      { title: 'Reduce Electricity Use', summary: 'Switch off standby devices and unplug idle chargers.', reason: 'Devices on standby still draw power. Switching off sockets can lower your monthly electricity use.', steps: ['Use switched power strips for TV, dispenser and set-top box.', 'Unplug chargers once batteries are full.', 'Use natural daylight during the day.'], assumption: 'saving ~10 kWh/month × 0.87 kg CO2e/kWh.' },
    ),
  },
  {
    slug: 'ganti-lampu-led', activityType: 'ELECTRICITY', reductionKgPerMonth: 5.2, icon: 'lightbulb', sortOrder: 4,
    content: c(
      { title: 'Ganti ke Lampu LED Hemat Energi', summary: 'LED memakai daya jauh lebih kecil untuk terang yang sama.', reason: 'Lampu LED membutuhkan sekitar sepertiga daya lampu neon/pijar dengan terang setara dan lebih awet.', steps: ['Mulai dari lampu yang paling lama menyala, misalnya ruang keluarga.', 'Pilih LED dengan watt sesuai kebutuhan ruangan.', 'Matikan lampu saat ruangan tidak digunakan.'], assumption: 'mengganti 4 lampu 18 W menjadi 8 W yang menyala 5 jam/hari (±6 kWh/bulan).' },
      { title: 'Switch to LED Bulbs', summary: 'LEDs use much less power for the same brightness.', reason: 'LED bulbs need roughly a third of the power of fluorescent/incandescent bulbs for equal brightness and last longer.', steps: ['Start with the bulbs that are on the longest.', 'Choose LED wattage that fits the room.', 'Switch lights off in empty rooms.'], assumption: 'replacing four 18 W bulbs with 8 W bulbs used 5 h/day (~6 kWh/month).' },
    ),
  },
  {
    slug: 'atur-suhu-ac', activityType: 'AC', reductionKgPerMonth: 12, icon: 'thermometer', sortOrder: 5,
    content: c(
      { title: 'Atur Suhu AC di 24–26°C', summary: 'Setiap kenaikan 1°C dapat menghemat energi AC.', reason: 'AC bekerja lebih keras untuk suhu yang sangat dingin. Suhu 24–26°C tetap nyaman dan mengurangi kerja kompresor.', steps: ['Atur suhu AC di 24–26°C dan gunakan mode sleep di malam hari.', 'Tutup pintu dan jendela saat AC menyala.', 'Gunakan timer agar AC mati otomatis.'], assumption: 'penghematan ±10% dari AC 1 PK, 8 jam/hari, 30 hari (±19 kWh).' },
      { title: 'Set AC to 24–26°C', summary: 'Each 1°C higher can save AC energy.', reason: 'An AC works harder for very cold settings. 24–26°C stays comfortable while easing the compressor.', steps: ['Set 24–26°C and use sleep mode at night.', 'Close doors and windows while the AC runs.', 'Use a timer so the AC turns off automatically.'], assumption: '~10% saving on a 1 HP AC, 8 h/day, 30 days (~19 kWh).' },
    ),
  },
  {
    slug: 'rawat-filter-ac', activityType: 'AC', reductionKgPerMonth: 4.2, icon: 'wind', sortOrder: 6,
    content: c(
      { title: 'Bersihkan Filter AC Secara Rutin', summary: 'Filter bersih membuat AC lebih efisien.', reason: 'Debu pada filter menghambat aliran udara sehingga AC butuh energi lebih untuk mendinginkan ruangan.', steps: ['Bersihkan filter setiap 2–4 minggu.', 'Jadwalkan servis AC tiap 3–6 bulan.', 'Pastikan unit outdoor tidak tertutup barang.'], assumption: 'peningkatan efisiensi ±5% pada AC 1 PK, 8 jam/hari.' },
      { title: 'Clean AC Filters Regularly', summary: 'Clean filters keep the AC efficient.', reason: 'Dusty filters block airflow so the AC needs more energy to cool the room.', steps: ['Clean filters every 2–4 weeks.', 'Service the AC every 3–6 months.', 'Keep the outdoor unit unobstructed.'], assumption: '~5% efficiency gain on a 1 HP AC, 8 h/day.' },
    ),
  },
  {
    slug: 'perpanjang-umur-perangkat', activityType: 'ELECTRONICS', reductionKgPerMonth: 3, icon: 'smartphone', sortOrder: 7,
    content: c(
      { title: 'Perpanjang Umur Perangkat Elektronik', summary: 'Jejak produksi terbesar ada saat perangkat dibuat.', reason: 'Sebagian besar emisi laptop dan smartphone terjadi saat produksi. Memakai perangkat lebih lama membuat jejak itu terbagi ke lebih banyak bulan.', steps: ['Gunakan pelindung dan rawat baterai (hindari 0% dan panas berlebih).', 'Perbaiki atau upgrade komponen sebelum membeli baru.', 'Jual atau donasikan perangkat yang masih layak.'], assumption: 'memperpanjang masa pakai laptop dari 3 ke 4 tahun (jejak produksi 300 kg CO2e).' },
      { title: 'Extend Your Devices\' Lifespan', summary: 'Most of the footprint happens when a device is made.', reason: 'Most laptop and smartphone emissions happen during manufacturing. Using devices longer spreads that footprint over more months.', steps: ['Use protection and care for the battery (avoid 0% and heat).', 'Repair or upgrade parts before buying new.', 'Sell or donate devices that still work.'], assumption: 'extending a laptop\'s life from 3 to 4 years (300 kg CO2e manufacturing footprint).' },
    ),
  },
  {
    slug: 'mode-hemat-daya', activityType: 'ELECTRONICS', reductionKgPerMonth: 1.3, icon: 'battery-charging', sortOrder: 8,
    content: c(
      { title: 'Aktifkan Mode Hemat Daya', summary: 'Kurangi konsumsi listrik laptop dan PC.', reason: 'Mode hemat daya, kecerahan layar lebih rendah, dan sleep otomatis menurunkan watt rata-rata perangkat.', steps: ['Aktifkan sleep otomatis setelah 10 menit tidak digunakan.', 'Turunkan kecerahan layar sesuai kebutuhan.', 'Matikan PC dan monitor di akhir hari.'], assumption: 'penurunan ±30 W selama 2 jam/hari pada PC desktop.' },
      { title: 'Turn On Power-Saving Mode', summary: 'Reduce laptop and PC electricity use.', reason: 'Power-saving mode, lower brightness and auto-sleep reduce the average wattage of your devices.', steps: ['Enable auto-sleep after 10 idle minutes.', 'Lower screen brightness as needed.', 'Shut down PC and monitor at the end of the day.'], assumption: '~30 W reduction for 2 h/day on a desktop PC.' },
    ),
  },
];

const challenges = [
  { slug: 'transportasi-umum-2x', activityType: 'TRANSPORT', target: 2, periodDays: 7, rewardPoints: 20, reductionKgPerCheckin: 0.5, icon: 'bus', sortOrder: 1,
    content: c({ title: 'Gunakan transportasi umum 2x dalam seminggu', description: 'Naik bus, KRL, atau MRT untuk dua perjalanan dalam 7 hari.', rule: 'Catat 1 progres per hari setelah memakai transportasi umum. Selesai setelah 2 kali dalam 7 hari.' },
      { title: 'Use public transport twice a week', description: 'Ride a bus, train or MRT for two trips within 7 days.', rule: 'Log 1 check-in per day after using public transport. Completed after 2 check-ins within 7 days.' }) },
  { slug: 'matikan-perangkat', activityType: 'ELECTRICITY', target: 5, periodDays: 7, rewardPoints: 25, reductionKgPerCheckin: 0.2, icon: 'zap', sortOrder: 2,
    content: c({ title: 'Matikan perangkat yang tidak digunakan', description: 'Cabut charger dan matikan stopkontak standby sebelum tidur.', rule: 'Catat 1 progres per hari. Selesai setelah 5 hari dalam 7 hari.' },
      { title: 'Switch off unused devices', description: 'Unplug chargers and switch off standby sockets before bed.', rule: 'Log 1 check-in per day. Completed after 5 days within 7 days.' }) },
  { slug: 'bersepeda-ke-kampus', activityType: 'TRANSPORT', target: 3, periodDays: 14, rewardPoints: 30, reductionKgPerCheckin: 0.4, icon: 'bike', sortOrder: 3,
    content: c({ title: 'Bersepeda atau jalan kaki 3x dalam dua minggu', description: 'Ganti perjalanan dekat dengan bersepeda atau berjalan kaki.', rule: 'Catat 1 progres per hari. Selesai setelah 3 kali dalam 14 hari.' },
      { title: 'Cycle or walk 3 times in two weeks', description: 'Replace short trips with cycling or walking.', rule: 'Log 1 check-in per day. Completed after 3 check-ins within 14 days.' }) },
  { slug: 'lampu-led', activityType: 'ELECTRICITY', target: 1, periodDays: 30, rewardPoints: 15, reductionKgPerCheckin: 2.6, icon: 'lightbulb', sortOrder: 4,
    content: c({ title: 'Gunakan Lampu LED Hemat Energi', description: 'Ganti minimal satu lampu yang sering menyala dengan LED.', rule: 'Catat progres setelah lampu diganti. Selesai setelah 1 kali dalam 30 hari.' },
      { title: 'Use energy-saving LED bulbs', description: 'Replace at least one frequently used bulb with an LED.', rule: 'Log a check-in after replacing the bulb. Completed after 1 check-in within 30 days.' }) },
  { slug: 'ac-26-derajat', activityType: 'AC', target: 5, periodDays: 7, rewardPoints: 25, reductionKgPerCheckin: 0.6, icon: 'thermometer', sortOrder: 5,
    content: c({ title: 'Atur AC di 26°C selama 5 hari', description: 'Gunakan suhu 26°C dan timer saat AC menyala.', rule: 'Catat 1 progres per hari. Selesai setelah 5 hari dalam 7 hari.' },
      { title: 'Keep the AC at 26°C for 5 days', description: 'Use 26°C and a timer whenever the AC is on.', rule: 'Log 1 check-in per day. Completed after 5 days within 7 days.' }) },
  { slug: 'sleep-otomatis', activityType: 'ELECTRONICS', target: 3, periodDays: 7, rewardPoints: 15, reductionKgPerCheckin: 0.1, icon: 'laptop', sortOrder: 6,
    content: c({ title: 'Aktifkan sleep otomatis perangkat 3 hari', description: 'Pastikan laptop/PC masuk mode sleep saat ditinggal.', rule: 'Catat 1 progres per hari. Selesai setelah 3 hari dalam 7 hari.' },
      { title: 'Use auto-sleep on devices for 3 days', description: 'Make sure your laptop/PC sleeps when idle.', rule: 'Log 1 check-in per day. Completed after 3 days within 7 days.' }) },
];

const achievements = [
  { slug: 'langkah-pertama', rule: 'CALCULATIONS_COUNT', threshold: 1, image: '/assets/tree.png', icon: 'sprout', sortOrder: 1,
    content: c({ title: 'Langkah Pertama', requirement: 'Simpan 1 perhitungan emisi' }, { title: 'First Step', requirement: 'Save 1 emission calculation' }) },
  { slug: 'eco-starter', rule: 'ACTIONS_COMPLETED', threshold: 5, image: '/assets/medal-military.png', icon: 'medal', sortOrder: 2,
    content: c({ title: 'Eco Starter', requirement: '5 aksi selesai' }, { title: 'Eco Starter', requirement: '5 actions completed' }) },
  { slug: 'eco-habit', rule: 'ACTIONS_COMPLETED', threshold: 10, icon: 'repeat', sortOrder: 3,
    content: c({ title: 'Eco Habit', requirement: '10 aksi selesai' }, { title: 'Eco Habit', requirement: '10 actions completed' }) },
  { slug: 'green-hero', rule: 'REDUCTION_KG', threshold: 12.8, image: '/assets/medal-first.png', icon: 'award', sortOrder: 4,
    content: c({ title: 'Green Hero', requirement: 'Kurangi estimasi 12,8 kg CO2e' }, { title: 'Green Hero', requirement: 'Reduce an estimated 12.8 kg CO2e' }) },
  { slug: 'challenge-champion', rule: 'CHALLENGES_COMPLETED', threshold: 3, icon: 'trophy', sortOrder: 5,
    content: c({ title: 'Juara Tantangan', requirement: 'Selesaikan 3 tantangan hijau' }, { title: 'Challenge Champion', requirement: 'Complete 3 green challenges' }) },
];

module.exports = { recommendations, challenges, achievements };
