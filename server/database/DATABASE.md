# Database Emisify — file siap impor PostgreSQL

Isi folder:

| File | Isi | Dipakai untuk |
|---|---|---|
| `emisify_full.sql` | Struktur lengkap 11 tabel + relasi + index + data referensi (21 faktor emisi, 8 rekomendasi, 6 tantangan hijau, 5 reward) + 1 akun demo + riwayat migration Prisma | **Paling disarankan** — impor lewat `psql` atau Query Tool pgAdmin |
| `emisify.backup` | Isi sama, format custom `pg_dump -Fc` | Menu **Restore** di pgAdmin |
| `emisify_schema_only.sql` | Struktur tabel saja (tanpa data) | Jika ingin database kosong (lalu jalankan `node prisma/seed.js`) |

Kompatibel PostgreSQL 13 ke atas (dibuat dengan PostgreSQL 15). Akun demo: `demo@emisify.id` / `Emisify123` (tanpa riwayat aktivitas — silakan isi lewat kalkulator, atau jalankan seed di database kosong untuk contoh data bertanggal hari ini).

## Cara impor

### A. Terminal (psql)
```bash
psql -U postgres -c "CREATE ROLE emisify LOGIN PASSWORD 'emisify_dev' CREATEDB;"   # lewati jika sudah ada
psql -U postgres -c "CREATE DATABASE emisify OWNER emisify;"
psql -U emisify -d emisify -h localhost -f emisify_full.sql
```

### B. pgAdmin
1. Klik kanan **Databases → Create → Database…**, nama: `emisify`, owner: user kamu.
2. Klik kanan database `emisify` → **Query Tool** → ikon folder (Open File) → pilih `emisify_full.sql` → **Execute (F5)**.
   *Atau:* klik kanan `emisify` → **Restore…** → pilih `emisify.backup` → centang *Do not save: Owner* → Restore.

### Setelah impor
Isi `server/.env`:
```
DATABASE_URL=postgresql://emisify:emisify_dev@localhost:5432/emisify?schema=public
```
Lalu `cd server && npx prisma generate && yarn dev`. **Tidak perlu** `prisma migrate deploy` lagi — tabel `_prisma_migrations` sudah ikut, sehingga `npx prisma migrate status` akan menampilkan *Database schema is up to date!*.

## Relasi (ON DELETE)

```
User ─┬─< Calculation >── EmissionFactor        (hapus faktor → factorId jadi NULL)
      ├─< UserRecommendation >── Recommendation
      ├─< UserChallenge >── GreenChallenge
      ├─< UserAchievement >── Achievement
      ├─< AiMessage >── Recommendation (opsional)
      └─< PasswordResetToken
```
Semua tabel milik user memakai `ON DELETE CASCADE`: menghapus satu baris `User` otomatis menghapus seluruh datanya. Unik: `User.email`, `User.googleId`, `PasswordResetToken.tokenHash`, `(userId, recommendationId)`, `(userId, challengeId)`, `(userId, achievementId)`, serta `slug`/`key` pada tabel referensi. Penjelasan setiap kolom ada di `README.md` bagian 6b.

## Catatan keamanan data
- Kolom `passwordHash` berisi hash bcrypt (cost 12), bukan password asli.
- `PasswordResetToken.tokenHash` berisi SHA-256 dari token; token asli hanya ada di email.
- File ini tidak berisi secret aplikasi (`AUTH_SECRET`, kredensial Google/SMTP). Itu tetap di `server/.env` yang tidak di-upload ke GitHub.
- Ganti password user database (`emisify_dev`) untuk lingkungan produksi.
