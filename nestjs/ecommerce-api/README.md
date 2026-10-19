# NestJS · E-commerce API

> **Week 1** (19 to 25 Oct) · NestJS 12 (ESM), TypeORM, Standard Schema (Zod), Observe, Vitest, oxlint · port `3101` · database `nest_ecommerce`

## Run it

```bash
docker compose up -d            # from the repo root: starts Postgres
cp .env.example .env
npm install
npm run start:dev               # http://localhost:3101/health
```

## Scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | Start with reload |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (boots the app, supertest) |
| `npm run lint` | oxlint (type-aware) |
| `npm run build` | Compile to `dist/` with the Nest CLI |
| `npm run start:prod` | Run the compiled app |

## Structure

```text
src/
├── main.ts              bootstrap: loads .env, Observe instrument, global validation pipe
├── env.ts               loads .env before any module reads process.env
├── observe.ts           createObserveModule()
├── app.module.ts        root module (TypeORM + feature modules go here)
├── app.controller.ts    GET /health
└── app.service.ts
test/app.e2e-spec.ts
```

## Core features

- [ ] Product catalog with categories
- [ ] User registration / login (basic, full auth in week 2)
- [ ] Orders: create, list, get, cancel (no overselling: conditional stock update in a transaction)
- [ ] Shopping cart
- [ ] Product search / filter (name, category, price)
- [ ] Validation (Standard Schema with Zod) + error handling
- [ ] Observe keys set (optional, free tier)

**If time:** full-text search.

## Notes

- **Validation:** pass a Zod schema to the decorator, e.g. `@Body({ schema: createProductSchema })`. The global `StandardSchemaValidationPipe` in `main.ts` does the checking.
- **TypeORM:** installed, not wired yet. Add `TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, autoLoadEntities: true })` to `app.module.ts` when you start the models.
- **Observe:** reads `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` from `.env`. Left empty, it sends nothing and logs one warning at startup.
- `nest new` pins TypeScript 6 here (the Nest CLI uses the compiler API). The Express projects use TypeScript 7.
