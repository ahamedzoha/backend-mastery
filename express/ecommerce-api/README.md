# Express · E-commerce API

> **Week 1** (19 to 25 Oct) · Express 5, Prisma 7, Zod, Vitest, oxlint · port `3001` · database `express_ecommerce`

## Run it

```bash
docker compose up -d            # from the repo root: starts Postgres
cp .env.example .env
npm install
npm run db:migrate -- --name init   # once you have models in prisma/schema.prisma
npm run dev                     # http://localhost:3001/health
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with reload (`tsx watch`), loads `.env` |
| `npm test` | Vitest (supertest against the app, no server needed) |
| `npm run lint` | oxlint |
| `npm run typecheck` | Generate the Prisma client, then `tsc --noEmit` |
| `npm run build` | Generate the Prisma client, compile to `dist/` |
| `npm start` | Run the compiled app |
| `npm run db:migrate` | Create and apply a migration (`prisma migrate dev`) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Structure

```text
src/
├── server.ts            starts the HTTP server
├── app.ts               builds the Express app (used by tests too)
├── routes/health.ts     GET /health
├── middleware/errors.ts 404 + the one error handler (Zod → 400, AppError → its status)
├── lib/errors.ts        AppError
├── lib/db.ts            Prisma client with the pg driver adapter
└── generated/prisma/    generated client (gitignored)
prisma/schema.prisma     models go here
prisma.config.ts         Prisma 7 config (schema path, migrations, DATABASE_URL)
test/app.test.ts
```

## Core features

- [ ] Product catalog with categories
- [ ] User registration / login (basic, full auth in week 2)
- [ ] Orders: create, list, get, cancel (no overselling: conditional stock update in a transaction)
- [ ] Shopping cart
- [ ] Product search / filter (name, category, price)
- [ ] Validation (Zod) + error handling

**If time:** full-text search.

## Notes

- **Express 5:** async handlers need no `asyncHandler` wrapper. Thrown errors reach `middleware/errors.ts`.
- **Prisma 7:** keep `prisma` and `@prisma/client` on the same major. `npm i prisma` with no version currently installs an 8.0 release candidate.
- Throw `new AppError(409, 'OUT_OF_STOCK')` (or any status and code) from a handler to send that error.
