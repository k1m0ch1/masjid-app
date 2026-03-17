<p align="center">
  <img src="frontend/public/pwa-192x192.png" alt="MasjidApp Logo" width="96" />
</p>

<h1 align="center">MasjidApp</h1>

<p align="center">
  Sistem administrasi masjid berbasis web — manajemen jamaah, keuangan, kegiatan, dan ZISWAF dalam satu platform.
</p>

<p align="center">
  <a href="https://masjid.daaralihsan.com"><img src="https://img.shields.io/badge/Live-masjid.daaralihsan.com-22c55e?style=flat-square&logo=cloudflare" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Python-3.12+-3b82f6?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PWA-ready-7c3aed?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square" alt="License" />
</p>

---

## Fitur

| Modul | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan keuangan, jamaah aktif, dan kegiatan terkini |
| **Jamaah** | Database anggota dan keluarga, pencarian, filter, profil lengkap |
| **Keuangan** | Pemasukan & pengeluaran, persetujuan transaksi, budgeting, ekspor laporan |
| **ZISWAF** | Pencatatan zakat fitrah, infaq, sedekah, dan wakaf |
| **Kegiatan** | Jadwal pengajian, kajian, acara hari raya, absensi peserta |
| **Pesan Kirim** | Broadcast WhatsApp ke anggota (queue-based) |
| **Pengaturan** | Profil masjid, manajemen user & hak akses per modul |

### Hak Akses

Akses dikontrol per-modul dengan allowlist ketat. Role tersedia: **Admin**, **Pengurus**, **Bendahara**, **Imam**, **Muadzin**, **Member**.

### PWA

Bisa di-install langsung dari browser — Android, iOS, dan Desktop — tanpa app store.

---

## Tech Stack

```
backend/                          frontend/
─────────────────────────         ─────────────────────────
FastAPI          (API)            React 19        (UI)
SQLAlchemy       (ORM)            Vite 8          (build)
Alembic          (migrations)     Tailwind CSS 4  (styling)
PostgreSQL       (database)       Zustand         (state)
Supabase         (auth + DB)      React Query     (server state)
uv               (packages)       Vite PWA        (offline)
Docker           (container)      Cloudflare Pages(hosting)
```

---

## Struktur Proyek

```
masjid-app/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Endpoints: auth, jamaah, finance, events, ziswaf, whatsapp, setting
│   │   ├── core/           # Config (pydantic-settings)
│   │   ├── db/             # Session & base model
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py
│   ├── alembic/            # Migrasi database
│   ├── Makefile            # Build & run commands
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
│
└── frontend/
    ├── src/
    │   ├── pages/          # Dashboard, Jamaah, Finance, Events, Ziswaf, PesanKirim, Setting
    │   ├── components/     # UI components
    │   ├── services/       # Supabase client, Axios API
    │   └── stores/         # Zustand stores
    ├── public/             # Icons, PWA assets
    ├── wrangler.toml       # Cloudflare Pages config
    └── vite.config.js
```

---

## Memulai

### Prasyarat

- Python 3.12+
- Node.js 20+
- [`uv`](https://docs.astral.sh/uv/) — package manager Python
- Docker (untuk deployment)
- Akun [Supabase](https://supabase.com)

### Supabase Setup

1. Buat project baru di Supabase
2. Aktifkan **Google OAuth**: Authentication → Providers → Google
3. Tambahkan redirect URL:
   - `http://localhost:5173` (development)
   - `https://masjid.yggdrasil.id` (production)
4. Catat: **Project URL**, **anon key**, **service_role key**, **JWT Secret**, dan **Database connection string**

---

### Backend

```bash
cd backend

# 1. Copy environment
cp .env.example .env
# Edit .env — isi DATABASE_URL, SUPABASE_*, SECRET_KEY, ALLOWED_ORIGINS

# 2. Install dependencies
make install

# 3. Jalankan migrasi
make migrate

# 4. Jalankan server (port 8001, hot-reload)
make dev
```

API tersedia di `http://localhost:8001`
Docs: `http://localhost:8001/api/v1/docs`

#### Semua command Makefile

```
make install    → uv sync (install dependencies)
make dev        → uvicorn local, port 8001, hot-reload
make migrate    → alembic upgrade head
make build      → docker build -t dai-app-backend:latest .
make run        → docker compose up -d  (image harus sudah di-build)
make stop       → docker compose down
make logs       → docker compose logs -f
make clean      → hapus Docker image
```

> **Catatan:** `make build` dan `make run` adalah dua langkah terpisah. Docker Compose tidak melakukan build — image harus sudah ada sebelum `make run`.

---

### Frontend

```bash
cd frontend

# 1. Copy environment
cp .env.example .env
# Edit .env — isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL

# 2. Install dependencies
npm install

# 3. Jalankan dev server
npm run dev
```

Frontend tersedia di `http://localhost:5173`

---

## Environment Variables

### Backend — `backend/.env`

```env
# Database
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>
SUPABASE_INVITE_REDIRECT_URL=https://masjid.yggdrasil.id/auth/callback

# API
ALLOWED_ORIGINS=https://masjid.yggdrasil.id
DEBUG=false

# Security — generate: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=<random-32-char-string>
```

### Frontend — `frontend/.env`

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=https://<backend-domain>/api/v1
```

---

## Deployment

### Backend — Docker

```bash
cd backend

# Build image
make build

# Jalankan (pastikan .env sudah diisi production values)
make run

# Lihat log
make logs
```

### Frontend — Cloudflare Pages

**Via GitHub (direkomendasikan):**

1. Push repo ke GitHub
2. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create project
3. Connect repository ini
4. Konfigurasi build:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output:** `dist`
5. Tambahkan environment variables di Cloudflare dashboard
6. Set custom domain: `masjid.yggdrasil.id`

**Via CLI (manual deploy):**

```bash
cd frontend
npm run build
npm run deploy
```

---

## Pengembangan

### Backend

```bash
# Format
uv run black app/

# Lint
uv run ruff check app/

# Test
uv run pytest

# Buat migrasi baru
uv run alembic revision --autogenerate -m "deskripsi perubahan"
```

### Frontend

```bash
npm run lint      # ESLint
npm run build     # Production build
npm run preview   # Preview hasil build
```

---

## Lisensi

MIT — bebas digunakan dan dimodifikasi.
