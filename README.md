# Emisify — Edukasi & Pelacak Estimasi Emisi Karbon

Emisify membantu pengguna mencatat aktivitas harian (transportasi, listrik, AC, perangkat elektronik), menghitung **estimasi** emisi dalam kg CO₂e, memahami dampaknya, mendapat rekomendasi, bertanya ke **Tanya AI**, mengikuti **Tantangan Hijau**, dan memantau **Progress & Reward**. Antarmuka dua bahasa (Indonesia default / English).

> Faktor emisi di aplikasi ini berstatus **DEMO / ESTIMASI** untuk edukasi — bukan data resmi.

---

## 1. Stack & versi

| Bagian | Teknologi |
|---|---|
| Frontend (`client/`) | React 18 (.jsx), Vite 5, Tailwind CSS 3.4, React Router 6, Recharts 2, Lucide React |
| Backend (`server/`) | Node.js ≥ 20, Express 4 (.js), Zod (validasi), bcryptjs, jsonwebtoken, helmet, cors, cookie-parser, express-rate-limit |
| Database | PostgreSQL ≥ 13 + Prisma ORM 5.22 |
| AI | Service terpisah `server/src/services/ai/` dengan provider `demo` / `openai` / `emergent` |

## 2. Struktur folder

```
emisify/
├── client/                 # React + Vite
│   ├── public/assets/      # aset dari Emisify.zip yang layak dipakai (dipotong dari desain)
│   └── src/
│       ├── components/{common,layout,dashboard,activities,emissions,recommendations,ai}
│       ├── pages/{public,auth,dashboard,activities,emissions,recommendations,challenges,progress}
│       ├── context/        # Auth, Lang (i18n), Toast, Calculator draft
│       ├── hooks/ services/ utils/ i18n/ routes/
│       ├── App.jsx  main.jsx  index.css
├── server/
│   ├── prisma/             # schema.prisma, migrations/, seed.js, data/ (faktor, rekomendasi, tantangan, reward)
│   └── src/
│       ├── config/ controllers/ middleware/ routes/ validators/ utils/
│       ├── services/       # calculator/, ai/, auth, calculation, dashboard, recommendation, challenge, progress
│       ├── app.js  server.js
├── design-reference/       # isi asli Emisify.zip (referensi, tidak dipakai langsung)
└── package.json            # script gabungan (concurrently)
```

## 3. Menjalankan secara lokal

Prasyarat: Node.js 20+, Yarn (atau npm), PostgreSQL berjalan lokal.

```bash
# 1. Buat database
psql -U postgres -c "CREATE ROLE emisify LOGIN PASSWORD 'emisify_dev' CREATEDB;"
psql -U postgres -c "CREATE DATABASE emisify OWNER emisify;"

# 2. Environment
cp server/.env.example server/.env      # isi DATABASE_URL & AUTH_SECRET (openssl rand -hex 32)
cp client/.env.example client/.env      # VITE_PROXY_TARGET=http://localhost:4000

# 3. Install, migrasi, seed
yarn install && yarn install:all
cd server && npx prisma migrate deploy && node prisma/seed.js && cd ..
#   (saat mengembangkan schema: npx prisma migrate dev --name <nama>)

# 4. Jalankan client (5173) + server (4000)
yarn dev
```

Buka http://localhost:5173. Untuk lokal **http** set `COOKIE_SECURE=false` dan `CLIENT_URL=http://localhost:5173`.

### Akun demo (hanya development)
`demo@emisify.id` / `Emisify123` — dibuat oleh `seed.js` beserta contoh riwayat, aksi, dan satu tantangan aktif. Ubah lewat `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD`.

## 4. Environment variable (server)

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL (wajib) |
| `PORT` | Port Express (default 4000) |
| `CLIENT_URL` | Origin frontend yang diizinkan (koma), dipakai CORS + cek Origin (wajib) |
| `AUTH_SECRET` | Secret penandatangan JWT (wajib) |
| `AUTH_TOKEN_TTL_DAYS` | Masa berlaku sesi (default 7) |
| `COOKIE_SECURE` | `true` di HTTPS/produksi |
| `APP_TIMEZONE` | Zona waktu penentuan "hari ini"/bulan (default `Asia/Jakarta`) |
| `CHALLENGE_CHECKIN_COOLDOWN_HOURS` | Jeda minimum antar check-in tantangan (default 20) |
| `AI_PROVIDER` | `demo` (default), `openai`, atau `emergent` |
| `AI_MODEL`, `AI_API_KEY`, `AI_BASE_URL` | Untuk `openai` (API apa pun yang kompatibel OpenAI Chat Completions) |
| `AI_BRIDGE_URL`, `AI_BRIDGE_TOKEN` | Untuk `emergent` (bridge Python di platform Emergent) |
| `APP_URL` | URL frontend untuk tautan di email reset |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth Google (Web application). Redirect URI: `<origin frontend>/auth/google` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Pengiriman email reset (mis. Gmail `smtp.gmail.com`, 465, `true`, App Password) |
| `RESET_TOKEN_MINUTES` | Masa berlaku tautan reset (default 60) |

Client: `VITE_API_URL` (kosong = same-origin `/api`), `VITE_PROXY_TARGET` (proxy dev), `VITE_HMR_CLIENT_PORT` (hanya di balik reverse proxy HTTPS).

## 5. Route frontend (final)

| Route | Halaman (referensi ZIP) | Akses |
|---|---|---|
| `/` | Landing Page | publik |
| `/login`, `/register` | Login, Daftar Akun | tamu |
| `/dashboard` | Beranda/Dashboard | login |
| `/calculator` | Pilih Jenis Aktivitas (langkah 1) | login |
| `/calculator/:activity` | Pilih Kategori (langkah 2) | login |
| `/calculator/:activity/:subType` | Input Data Aktivitas (langkah 3) | login |
| `/calculator/result` | Hasil Perhitungan (langkah 4) | login |
| `/history` | Riwayat Perhitungan | login |
| `/impact` | Kategori Dampak | login |
| `/impact/:slug` | Detail Dampak Per-Barang (`vehicle`, `energy`, `electronics`) | login |
| `/items/:id` | Detail/Edit Barang | login |
| `/recommendations` | Rekomendasi Tindakan | login |
| `/recommendations/:id` | Detail Rekomendasi + Tanya AI | login |
| `/ask-ai` | Tanya AI (umum) | login |
| `/challenges` | Tantangan Hijau | login |
| `/progress` | Progress & Reward (tab Progress Aksi / Reward Saya) | login |
| `/forgot-password` | Lupa Password (kirim tautan ke email terdaftar) | tamu |
| `/reset-password?token=` | Atur Password Baru | publik (token) |
| `/auth/google` | Callback Login Google | publik |
| `*` | 404 | publik |

**Modal / overlay / state yang diimplementasikan:** dialog konfirmasi hapus (riwayat & barang), modal Edit Barang (hitung ulang), dialog konfirmasi keluar, dialog konfirmasi check-in tantangan, modal detail faktor emisi & asumsi, modal "Reward baru terbuka", dropdown menu akun, drawer navigasi mobile, toast (sukses/error/info), skeleton loading, empty state, error state + coba lagi, indikator mengetik AI, label Mode Demo.

## 6. Endpoint API (`/api`, JSON `{ success, data | error }`)

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | Rate limited; set/clear cookie httpOnly |
| GET | `/auth/me` · `/auth/session` | Profil sesi (me = 401 bila belum login; session = `{user:null}`) |
| GET | `/auth/providers` | `{google, email}` — apakah Google OAuth & SMTP sudah dikonfigurasi |
| POST | `/auth/google/url` · `/auth/google/callback` | OAuth Google (authorization code + `state` cookie) |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Kirim tautan reset (respons selalu generik) · set password baru |
| GET | `/auth/reset-password/check?token=` | Validasi token reset |
| PATCH | `/user/target` | `{monthlyTargetKg: number 1–100000 | null}` |
| GET | `/calculations/export?format=csv|pdf&lang=&category=&range=&sort=` | Unduh riwayat (CSV UTF-8 / PDF A4) |
| GET | `/activities/categories` | Definisi aktivitas, kategori & field form dinamis |
| GET | `/dashboard/summary` | Total bulan ini vs lalu, per aktivitas, tren 6 bulan & 14 hari |
| GET | `/impact?range=` · `/impact/:slug?range=` | Agregasi kategori dampak & rincian per barang |
| POST | `/calculations/preview` | Hitung tanpa menyimpan |
| POST/GET | `/calculations` | Simpan / daftar (filter `category`, `range`, `sort`) |
| GET/PATCH/DELETE | `/calculations/:id` (alias `/items/:id`) | Detail, edit + hitung ulang, hapus |
| GET | `/recommendations?category=` · `/recommendations/:id` | Daftar (relevan ditandai) & detail |
| PATCH | `/user/recommendations/:id` | `{status: SAVED|IN_PROGRESS|DONE|NONE}` |
| GET | `/challenges` | Daftar + status pengguna |
| POST | `/challenges/:id/join` | Ikut / ikut ulang bila kedaluwarsa |
| PATCH | `/challenges/:id/progress` | Check-in (+1), selesai otomatis saat target tercapai |
| GET | `/progress` | Statistik aksi, pengurangan, reward |
| GET | `/ai/status` · `/ai/history` · DELETE `/ai/history` | Mode AI & riwayat chat |
| POST | `/ai/chat` | `{message ≤500, recommendationId?, lang}` → stream SSE (`meta`/`delta`/`done`/`error`), rate limit 12/menit |

## 6b. Struktur database `emisify` (PostgreSQL, Prisma)

```
User 1─* Calculation *─0..1 EmissionFactor
User 1─* UserRecommendation *─1 Recommendation
User 1─* UserChallenge *─1 GreenChallenge
User 1─* UserAchievement *─1 Achievement
User 1─* AiMessage *─0..1 Recommendation
User 1─* PasswordResetToken
```

| Tabel | Kolom penting | Relasi / constraint |
|---|---|---|
| `User` | id, name, email (unik), age?, passwordHash? (bcrypt; null bila hanya Google), googleId? (unik), monthlyTargetKg?, tokenVersion, createdAt, updatedAt | induk semua data pribadi (ON DELETE CASCADE) |
| `PasswordResetToken` | userId, tokenHash (SHA-256, unik), expiresAt, usedAt? | token mentah hanya ada di email, sekali pakai, 60 menit |
| `EmissionFactor` | key (unik), activityType, name (JSON id/en), inputUnit, outputUnit, value, source, year?, status DEMO/ESTIMATE/VALIDATED, notes | dipakai `Calculation.factorId` (ON DELETE SET NULL) |
| `Calculation` | userId, activityType, impactCategory, subType, itemName (JSON), inputs (JSON), quantity, unit, factorKey/Value/Unit/Status (snapshot), breakdown (JSON), periodDays, resultKg, activityDate | index (userId, activityDate), (userId, activityType) |
| `Recommendation` | slug (unik), activityType, content (JSON id/en), reductionKgPerMonth, image?, icon | — |
| `UserRecommendation` | userId, recommendationId, status SAVED/IN_PROGRESS/DONE, startedAt, completedAt | unik (userId, recommendationId) |
| `GreenChallenge` | slug (unik), activityType, content, target, periodDays, rewardPoints, reductionKgPerCheckin, active | — |
| `UserChallenge` | userId, challengeId, progress, status JOINED/COMPLETED, joinedAt, lastCheckinAt, completedAt | unik (userId, challengeId) |
| `Achievement` | slug (unik), content, rule (CALCULATIONS_COUNT/ACTIONS_COMPLETED/REDUCTION_KG/CHALLENGES_COMPLETED), threshold | — |
| `UserAchievement` | userId, achievementId, earnedAt | unik (userId, achievementId) |
| `AiMessage` | userId, recommendationId?, role, content, mode, createdAt | index (userId, recommendationId, createdAt) |

File siap impor PostgreSQL (struktur + data referensi + akun demo): `server/database/` — lihat `server/database/DATABASE.md`.

Migrasi: `server/prisma/migrations/` (init → auth_google_reset_target → session_token_version).

## 7. Kalkulator emisi

Rumus umum: **emisi (kg CO₂e) = data aktivitas × faktor emisi**. Logika ada di `server/src/services/calculator/` (terpisah dari React), deterministik, dan memvalidasi input kosong, non-angka, negatif, di luar batas, opsi tidak cocok, tanggal masa depan/terlalu lama. Setiap catatan menyimpan input ternormalisasi, unit, kunci & nilai faktor, status faktor, rincian, periode, hasil, dan timestamp → dapat diaudit.

| Aktivitas | Rumus |
|---|---|
| Transportasi | jarak × pengali frekuensi (sekali / per hari × hari / per minggu × minggu; pesawat PP × 2) × faktor km |
| Listrik | kWh (atau Rp ÷ tarif/kWh) × 0,87 |
| AC | watt(PK) × efisiensi (inverter 0,7) × unit × jam × hari ÷ 1000 × 0,87 |
| Elektronik | watt × jam × hari ÷ 1000 × 0,87 **+** jejak produksi ÷ (masa pakai × 365) × hari; kondisi "tidak digunakan" = 0 jam |

Faktor (semua `DEMO`/`ESTIMASI`, perlu diverifikasi): grid JAMALI ±0,87 kg/kWh (ESDM 2019, dibulatkan); bensin 2,31 kg/L ÷ 40 km/L (motor) / 12 km/L (mobil); solar 2,68 kg/L ÷ 14 km/L; bus 0,1 & kereta 0,035 kg/penumpang-km (pendekatan UK DESNZ 2023); pesawat domestik 0,255; mobil/motor listrik 0,15/0,03 kWh/km × grid; jejak produksi perangkat (laptop 300, smartphone 60, TV 400 kg, dst.) dari rentang laporan produsen. Kesetaraan pohon: ±21 kg CO₂/pohon/tahun. Tarif PLN pada mode tagihan adalah asumsi tanpa pajak. Tanggal aktivitas disimpan sebagai hari kalender (12:00 UTC) sehingga agregasi harian/bulanan konsisten; "hari ini" mengikuti `APP_TIMEZONE`.

## 8. Rekomendasi, tantangan & reward

- Rekomendasi diurutkan menurut kategori emisi terbesar pengguna 30 hari terakhir. Estimasi pengurangan selalu disertai asumsi dan disclaimer.
- Aksi rekomendasi harus **dimulai** (IN_PROGRESS) sebelum bisa **selesai**.
- Tantangan: check-in maksimal satu kali per jeda (`CHALLENGE_CHECKIN_COOLDOWN_HOURS`), harus dalam periode; selesai otomatis saat progres = target; bisa diikuti ulang bila kedaluwarsa.
- Reward dievaluasi **di server** dari data tersimpan: Langkah Pertama (≥1 perhitungan), Eco Starter (≥5 aksi selesai), Eco Habit (≥10), Green Hero (estimasi pengurangan ≥12,8 kg), Juara Tantangan (≥3 tantangan selesai). Tidak ada tombol "klaim".

## 9. Tanya AI

- `AI_PROVIDER=demo` (default, tanpa key): jawaban berbasis aturan kata kunci + data pengguna, **berlabel "Mode Demo"** di UI.
- `AI_PROVIDER=openai`: isi `AI_API_KEY`, `AI_MODEL` (mis. `gpt-4o-mini`), opsional `AI_BASE_URL`.
- `AI_PROVIDER=emergent`: hanya di platform Emergent — Express memanggil bridge Python (`/app/backend/server.py`) yang memakai Emergent Universal Key (model `claude-sonnet-5-5`).
- Jika provider live gagal sebelum ada teks, otomatis jatuh ke Mode Demo dan UI menampilkan catatan. Prompt sistem membatasi topik pada emisi & kebiasaan ramah lingkungan dan melarang klaim angka pasti. Yang dikirim ke provider hanya pertanyaan, ringkasan emisi anonim, dan konten rekomendasi — tanpa nama, email, password, atau token.

## 10. Keamanan

**Tambahan:** sesi dicabut otomatis setelah reset password (`tokenVersion` di JWT), JWT dikunci ke HS256, login untuk email tak terdaftar tetap menjalankan bcrypt (anti enumerasi lewat timing), endpoint lupa password selalu menjawab generik, token reset disimpan sebagai hash SHA-256 & sekali pakai, OAuth Google memakai `state` acak di cookie httpOnly + verifikasi `aud`, `iss`, dan `email_verified`, redirect URI hanya diterima bila origin-nya ada di `CLIENT_URL`, rate limit juga untuk lupa/reset password.

Password di-hash bcrypt (cost 12) dan tidak pernah dikirim ke frontend. Sesi = JWT di **cookie httpOnly** `SameSite=Lax` (`Secure` di produksi). Mitigasi CSRF: SameSite + mutasi wajib `application/json` + allow-list `Origin`. Semua query data privat difilter `userId` dari sesi (bukan dari client), sehingga data pengguna lain mengembalikan 404. Helmet, CORS dari env, payload ≤20 KB, rate limit (login 10/15 mnt per IP+email, register, AI, global), error handler terpusat tanpa stack trace.

## 11. Audit ZIP & perubahan desain

Audit: 17 halaman/varian + 4 style/komponen + 8 aset kecil.
- **Variasi (digabung jadi state, bukan halaman ganda):** `Rekomendasi Tindakan` vs `-1` (versi kotak & versi kartu lembut → dipakai gaya kartu lembut), `Detail/Edit Barang` vs `2` (2 = layout Detail Dampak → dipakai untuk `/impact/:slug`, edit dijadikan modal), `Tantangan Hijau` vs `Tantangasn Hijau` (yang kedua berisi elemen bertumpuk/rusak → tidak ditiru).
- **Aset tidak dipakai:** `Rectangle 253.png`, `Text.png`, `laptop 1.png`, `plastik 1.png` (1×1 px kosong), `Component-1/2.png` (ikon hitam 24 px transparan → diganti Lucide), `EMISIFY__1_-removebg-preview 1.png` (logo 87×37 px buram → logo daun dibuat ulang sebagai SVG sesuai wordmark di semua mockup). Foto landing, ilustrasi bus, foto laptop, pohon, dan medali diambil dari ZIP.
- **Perbaikan:** teks hero tidak lagi ditumpuk di atas foto (split layout + kartu statistik), heading & body memakai Plus Jakarta Sans dengan line-height lega, tab/kartu dibuat konsisten (pill + radius organik bervariasi), tabel rincian menjadi daftar label-nilai yang rapi, kolom "Jumlah Hari" yang patah baris diperbaiki, chat AI dijadikan panel terpadu dengan status mode, Progress dibuat dua tab sesuai tombol di desain, sidebar desktop → drawer + navigasi bawah di ponsel, warna mengikuti design system (cream, terracotta, sage/forest).
- **Masuk dengan Google:** diimplementasikan (OAuth milik sendiri); tombol hanya tampil jika kredensial sudah diisi agar tidak ada tombol mati.

## 12. Status & keterbatasan

- Belum ada test otomatis (unit/e2e) di repo; pengujian dilakukan manual/agen pengujian.
- Faktor emisi belum tervalidasi resmi; ganti nilai di `server/prisma/data/factors.js` lalu jalankan seed.
- Login Google & email reset aktif setelah `GOOGLE_CLIENT_ID/SECRET` dan `SMTP_*` diisi (lihat `server/.env.example`). Tanpa SMTP, tautan reset hanya dicetak di log server (mode development) dan tombol Google disembunyikan otomatis.
- Deployment: build `client` (`yarn build`, sajikan `dist/` statis dengan fallback ke `index.html`), jalankan `server` dengan Node + PostgreSQL terkelola, set semua env di atas (`COOKIE_SECURE=true`, `CLIENT_URL` = domain frontend). Belum di-deploy.
- Preview Emergent: `/app/backend/server.py` menjalankan `/app/scripts/emisify_preview.sh` (PostgreSQL → migrate → seed → Express :4000) dan mem-proxy `/api` dari port 8001.
