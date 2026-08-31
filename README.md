# OmniMedia — Universal Media Downloader & Analyzer

A production-ready, high-performance media retrieval web application built with **React 19 + Vite + Tailwind CSS v4** on the frontend and **Fastify + TypeScript + SQLite + SSE** on the backend.

Designed around an extensible **Provider/Adaptor Architecture** with strict legal compliance, SSRF defense, zero-retention privacy, and real-time streaming progress.

---

## 🌟 Key Features

- **⚡ Fast & Polished UX:** Glassmorphism design, ambient glow accents, micro-animations, and responsive mobile-first controls.
- **🔍 Instant URL Detection:** Automatically detects supported video platforms (YouTube, Vimeo, TikTok, Instagram, Facebook, X) as the user types or pastes.
- **🎯 Multi-Quality Video:** Supports 4K Ultra HD (2160p), 2K (1440p), 1080p, 720p, 480p, and 360p where permitted by the media source.
- **🎵 Audio Extraction:** Pure audio format extraction with MP3 (up to 320 kbps) and M4A/AAC bitrate indicators.
- **📡 Real-Time SSE Progress:** Live Server-Sent Events stream for downloading percentage, transfer speed, and ETA without aggressive polling.
- **🛡️ Enterprise Security:** Active SSRF protection against internal IP ranges, metadata endpoints, non-standard ports, and protocol tampering.
- **🔒 Zero-Retention Privacy:** Automatic 30-minute TTL cleanup daemon wipes temporary files and caches periodically.
- **📊 Admin Control Center:** Protected dashboard with real-time KPI metrics, active queue length, system memory analytics, job search/filter, and audit event logs.

---

## 🏗️ Architecture

```
OmniMedia/
├── frontend/                   # React 19 + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/         # UI Primitives, Hero, UrlInput, ResultCard, ProgressModal
│   │   ├── hooks/              # useUrlDetection, useMediaAnalysis, useJobProgress
│   │   ├── pages/              # HomePage, AdminLoginPage, AdminDashboardPage
│   │   ├── services/           # Typed API client + EventSource SSE listener
│   │   └── types/              # TypeScript interfaces
│
├── backend/                    # Node.js + Fastify + TypeScript
│   ├── src/
│   │   ├── providers/          # MediaProvider interface & platform adaptors
│   │   │   ├── base.ts         # Abstract MediaProvider
│   │   │   ├── youtube.ts      # YouTube oEmbed provider
│   │   │   ├── vimeo.ts        # Vimeo player config + download provider
│   │   │   ├── instagram.ts    # Instagram oEmbed provider
│   │   │   ├── tiktok.ts       # TikTok oEmbed provider
│   │   │   ├── facebook.ts     # Facebook provider
│   │   │   ├── x.ts            # X/Twitter provider
│   │   │   └── demo.ts         # 4K Creative Commons Demo provider
│   │   ├── routes/             # /api/media, /api/downloads, /api/admin, /api/platforms
│   │   ├── services/           # Media analysis, job queue, and cleanup services
│   │   ├── middleware/         # Security headers, rate limiting, and JWT auth
│   │   ├── db/                 # SQLite with WAL mode & automated migrations
│   │   └── utils/              # SSRF defense, logger, config
│   └── tests/                  # Vitest unit test suite
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js 20+** installed
- **npm** package manager

### 2. Setup & Installation
```bash
# Clone or navigate to the repository
cd media-downloader

# Setup environment variables
cp .env.example .env

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Run Development Servers
In two separate terminals:

```bash
# Terminal 1: Backend API (Port 3001)
cd backend
npm run dev

# Terminal 2: Frontend (Port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Quality Assurance

Run the automated test suite and type checking:

```bash
# Run backend Vitest unit tests (SSRF, Providers, Normalization)
cd backend && npm test

# Typecheck backend
cd backend && npm run typecheck

# Build and typecheck frontend
cd frontend && npm run build
```

---

## 🔐 Admin Portal

OmniMedia includes a secured administration dashboard:
- **URL:** `http://localhost:5173/admin`
- **Default Username:** `admin`
- **Default Password:** `changeme-in-production` (Configured via `ADMIN_PASSWORD` in `.env`)

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/media/analyze` | Analyzes a URL, validates security, and returns formats & metadata |
| `POST` | `/api/downloads` | Queues a media stream download job |
| `GET` | `/api/downloads/:jobId` | Retrieves job status and progress details |
| `GET` | `/api/downloads/:jobId/stream` | Server-Sent Events (SSE) live progress stream |
| `GET` | `/api/downloads/:jobId/file` | Streams the packaged file to the user's browser |
| `POST` | `/api/downloads/:jobId/cancel` | Aborts an active download job |
| `GET` | `/api/platforms` | Lists all supported platforms and capabilities |
| `POST` | `/api/admin/login` | Authenticates administrator and returns JWT |
| `GET` | `/api/admin/stats` | Returns real-time KPI metrics (Auth required) |
| `GET` | `/api/admin/jobs` | Paginated and filtered job list (Auth required) |
| `GET` | `/api/admin/system` | Server heap, uptime, and storage metrics (Auth required) |
| `GET` | `/api/health` | Service health check |

---

## ⚖️ Legal & Platform Compliance

OmniMedia is designed with strict adherence to platform Terms of Service and applicable copyright laws:
- **No DRM Circumvention:** We do not crack Widevine, FairPlay, or encrypted streams.
- **No Paywall or Auth Bypassing:** We do not bypass login restrictions or subscriber-only walls.
- **Graceful Informational Mode:** Platforms that restrict third-party downloads (e.g., YouTube, Instagram) gracefully display metadata and author attribution without attempting unauthorized bypasses.
- **Permitted Sources:** Direct downloads are only enabled for platforms that permit it (e.g. Vimeo public downloadable videos, Creative Commons showcases, permitted direct streams).

---

## 🚢 Production Deployment

### Docker Deployment
```bash
docker-compose up -d --build
```

### Cloud Providers
- **Frontend:** Deploy to **Vercel** / **Cloudflare Pages** pointing to `frontend/dist`.
- **Backend:** Deploy to **Render** / **Railway** / **Google Cloud Run** with Node 22 runtime.
- **Database:** SQLite file mounted to persistent volume, or swappable to PostgreSQL.
- **Queue/Cache:** Redis instance connected via `REDIS_URL`.
