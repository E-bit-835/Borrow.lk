# BorrowLK

Peer-to-peer rental marketplace for Sri Lanka (React + Express + Neon Postgres).

## Quick start

```bash
npm install
cp .env.example .env   # then set DATABASE_URL, JWT_SECRET, SMTP_*, etc.
npm run db:migrate
npm run db:seed        # optional — seed password: password123
npm run dev            # API :5000 + Vite :5173
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + frontend together |
| `npm run build` | Typecheck + production frontend build |
| `npm run lint` | Oxlint |
| `npm run db:migrate` | Apply `server/db/schema.sql` |
| `npm run db:seed` | Seed demo users/products |

### Seed accounts

- Admin: `admin@borrow.lk` / `password123`
- Customer: `customer@borrow.lk` / `password123`
- Provider: check `server/db/seed.ts`

## Stack

- Frontend: React 19, Vite, Tailwind, React Router
- Backend: Express, Zod, JWT, Multer
- Database: Neon PostgreSQL
