# Eardle — Music Ear Training

Interactive exercises to sharpen your musical hearing: notes, intervals, chords, progressions, and scales.

Live at **[eardle.com](https://eardle.com)**

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Drizzle ORM** + **PostgreSQL**
- **Tone.js** — Salamander piano samples for audio playback
- **NextAuth v5** — JWT sessions, Credentials + Google OAuth
- **Tailwind CSS v4**
- **Docker + Caddy** — containerized deployment with automatic SSL

## Exercise categories

| Category | Description |
|----------|-------------|
| Note ID | Identify individual pitches by ear |
| Intervals | Recognize the distance between two notes |
| Chords | Identify chord qualities, inversions |
| Progressions | Hear and name common chord progressions |
| Scales | Distinguish major, minor, modes, and more |

## Production deployment

### Prerequisites

- Linux server with Docker installed (`curl -fsSL https://get.docker.com | sh`)
- DNS A record: `eardle.com` → server IP
- Ports 80 and 443 open in firewall

### First-time setup

```bash
git clone https://github.com/drorbo/eardle.git
cd eardle

cp .env.example .env
nano .env   # fill in all values (see below)

docker compose -f docker-compose.yml up -d --build

# Seed the database (once)
docker compose exec app npx tsx lib/db/seed.ts
docker compose exec app npx tsx scripts/seed-intervals.ts
docker compose exec app npx tsx scripts/seed-inversions.ts
docker compose exec app npx tsx scripts/seed-progressions.ts
docker compose exec app npx tsx scripts/seed-scales.ts
```

Caddy automatically obtains and renews the SSL certificate from Let's Encrypt.

### `.env` values

```env
POSTGRES_PASSWORD=        # strong random password
NEXTAUTH_SECRET=          # openssl rand -base64 32
GOOGLE_CLIENT_ID=         # optional — leave blank to disable Google sign-in
GOOGLE_CLIENT_SECRET=
ADMIN_EMAIL=              # login email for the admin panel
ADMIN_PASSWORD=           # admin panel password
```

### Updates

```bash
git pull && docker compose -f docker-compose.yml up -d --build
```

> Always pin `-f docker-compose.yml` for production commands. `docker-compose.override.yml` is committed for local development only (see below) — Compose auto-loads it for any bare `docker compose` invocation, which would publish Postgres's port on the host if it ever ran unpinned here.

Data is stored in the `postgres_data` Docker volume and survives updates.

## Local development

```bash
# Start PostgreSQL in Docker, run Next.js natively (faster hot reload)
docker compose up db -d
npm install
npm run dev
```

The dev server reads `.env.local`. Create it from `.env.example` and set:

```env
DATABASE_URL=postgres://eardle:<password>@localhost:5433/eardle
NEXTAUTH_SECRET=any-local-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

> Port 5433 on the host maps to 5432 inside the container (5432 is taken by Docker Desktop on Windows).

On first run, push the schema and seed:

```bash
npx drizzle-kit push
npx tsx lib/db/seed.ts
```

## Admin panel

`/admin/login` — manage exercises, view counts, add/edit/delete.

Credentials are seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the env file.
