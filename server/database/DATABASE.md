# Database Emisify (PostgreSQL, raw query)

Backend Express terhubung langsung ke PostgreSQL dengan driver `pg` dan **raw query** (SQL biasa, tanpa ORM).
Semua query memakai parameter `$1, $2, …` sehingga input pengguna tidak bisa mengubah perintah SQL (aman dari SQL injection).

Isi folder:

| File | Isi |
|---|---|
| `schema.sql` | Struktur 11 tabel + tipe ENUM + relasi + index (`CREATE TABLE IF NOT EXISTS`, aman dijalankan ulang) |
| `init.js` | Menjalankan `schema.sql` ke database di `DATABASE_URL` |
| `seed.js` | Mengisi data referensi (21 faktor emisi, 8 rekomendasi, 6 tantangan hijau, 5 reward) + 1 akun demo |
| `data/` | Isi data referensi untuk seed |
| `emisify_schema_only.sql` | Dump struktur lama (pg_dump). Tidak dipakai aplikasi; acuan struktur sekarang adalah `schema.sql` |

Kompatibel PostgreSQL 13 ke atas. Akun demo: `demo@emisify.id` / `Emisify123`.

Koneksi ke database ada di `server/src/config/db.js` (`query`, `one`, `transaction`).

## Cara membuat database

1. Buat database kosong bernama `emisify`, lewat pgAdmin (klik kanan **Databases → Create → Database…**) atau:
   ```bash
   psql -U postgres -c "CREATE DATABASE emisify;"
   ```
2. Isi `server/.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/emisify?schema=public
   ```
3. Buat tabel dan isi data awal:
   ```bash
   cd server
   yarn db:init    # menjalankan schema.sql
   yarn seed       # data referensi + akun demo
   yarn dev
   ```

Database lama yang dulu dibuat dengan Prisma tetap bisa dipakai apa adanya; strukturnya sama. Tabel `_prisma_migrations` di dalamnya hanya sisa lama dan tidak dipakai lagi.

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
