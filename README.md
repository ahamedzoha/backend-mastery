# Backend Mastery

**Express.js + NestJS dual track.** Four projects, each built twice (once per framework), one project per week, from 19 October to the demo on **Monday 16 November 2026**.

| | |
|---|---|
| Frameworks | Express 5 · NestJS 12 |
| Language / runtime | TypeScript · Node.js 24 LTS |
| Data | PostgreSQL 17 · Prisma 7 (Express) · TypeORM (NestJS) |
| Validation | Zod (Express) · Standard Schema with Zod (NestJS) |
| Tooling | Vitest · oxlint · Docker · GitHub Actions |

---

## Contents

- [Schedule and status](#schedule-and-status)
- [Scorecard](#scorecard)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Ports and databases](#ports-and-databases)
- [Scripts](#scripts)
- [Testing and CI](#testing-and-ci)
- [Deployment](#deployment)
- [Progress tracking](#progress-tracking)
- [Conventions](#conventions)
- [Setup notes and gotchas](#setup-notes-and-gotchas)

---

## Schedule and status

| Week | Dates | Project | Express | NestJS | Status |
|---|---|---|---|---|---|
| 1 | 19 to 25 Oct | E-commerce API | [`express/ecommerce-api`](express/ecommerce-api) | [`nestjs/ecommerce-api`](nestjs/ecommerce-api) | 🟡 Scaffolded |
| 2 | 26 Oct to 1 Nov | Authentication system | [`express/auth-system`](express/auth-system) | [`nestjs/auth-system`](nestjs/auth-system) | ⚪ Not started |
| 3 | 2 to 8 Nov | Real-time chat | [`express/realtime-chat`](express/realtime-chat) | [`nestjs/realtime-chat`](nestjs/realtime-chat) | ⚪ Not started |
| 4 | 9 to 15 Nov | SaaS platform + microservices | [`express/saas-platform`](express/saas-platform) | [`nestjs/saas-platform`](nestjs/saas-platform) | ⚪ Not started |
| | **16 Nov** | **Demo** | | | |

Status key: ⚪ not started · 🟡 scaffolded · 🔵 in progress · 🟢 built, tested and deployed

Each project folder has a README with its feature checklist (core features first, extras marked *if time*).

---

## Scorecard

A project counts as done in a framework when it is **built** (every core feature works), **tested** (suite passes in CI) and **deployed** (live URL below).

| Project | Express | NestJS |
|---|---|---|
| E-commerce API | ☐ built · ☐ tested · ☐ deployed | ☐ built · ☐ tested · ☐ deployed |
| Auth system | ☐ built · ☐ tested · ☐ deployed | ☐ built · ☐ tested · ☐ deployed |
| Real-time chat | ☐ built · ☐ tested · ☐ deployed | ☐ built · ☐ tested · ☐ deployed |
| SaaS + microservices | ☐ built · ☐ tested · ☐ deployed | ☐ built · ☐ tested · ☐ deployed |

Plus: ☐ 4 weekly reports · ☐ 3 comparison reports · ☐ demo

### Live demos

| Project | Express | NestJS |
|---|---|---|
| E-commerce API | _not deployed yet_ | _not deployed yet_ |
| Auth system | _not deployed yet_ | _not deployed yet_ |
| Real-time chat | _not deployed yet_ | _not deployed yet_ |
| SaaS + microservices | _not deployed yet_ | _not deployed yet_ |

---

## Repository layout

```text
backend-mastery/
├── express/
│   ├── ecommerce-api/        week 1 · scaffolded
│   ├── auth-system/          week 2
│   ├── realtime-chat/        week 3
│   └── saas-platform/        week 4
├── nestjs/
│   ├── ecommerce-api/        week 1 · scaffolded
│   ├── auth-system/          week 2
│   ├── realtime-chat/        week 3
│   └── saas-platform/        week 4
├── comparison-reports/
│   ├── architecture-comparison.md
│   ├── performance-benchmarks.md
│   └── learning-journey.md   weekly reports
├── docker/postgres-init.sql  creates one database per project
├── postman/                  API collections (one per project) + environments
├── docker-compose.yml        local Postgres
└── .github/workflows/ci.yml  lint, test, build for every project
```

Every project is a standalone app with its own `package.json`, tests, `Dockerfile` and `.env.example`, so each one can be deployed on its own.

---

## Getting started

### Prerequisites

- **Node.js 24** (`nvm use` reads `.nvmrc`) and npm 11
- **Docker** for the local database

### 1. Start Postgres

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432` (user `postgres`, password `postgres`) and creates the eight project databases on first run.

### 2. Run a project

```bash
# Express
cd express/ecommerce-api
cp .env.example .env
npm install
npm run dev          # http://localhost:3001/health

# NestJS
cd nestjs/ecommerce-api
cp .env.example .env
npm install
npm run start:dev    # http://localhost:3101/health
```

### 3. Start a new project (weeks 2 to 4)

- **Express:** copy the setup from `express/ecommerce-api` (`package.json` scripts, `tsconfig.json`, `prisma.config.ts`, `src/app.ts`, error middleware, `Dockerfile`), then build the features.
- **NestJS:** `npx @nestjs/cli@latest new <name> -p npm -g` inside `nestjs/` (it scaffolds ESM, Vitest and oxlint by default), then copy `src/env.ts`, the Observe setup and the global validation pipe from `nestjs/ecommerce-api`.
- Add the project to the matrix in `.github/workflows/ci.yml`.

---

## Ports and databases

| Project | Express port | Express database | NestJS port | NestJS database |
|---|---|---|---|---|
| E-commerce API | 3001 | `express_ecommerce` | 3101 | `nest_ecommerce` |
| Auth system | 3002 | `express_auth` | 3102 | `nest_auth` |
| Real-time chat | 3003 | `express_chat` | 3103 | `nest_chat` |
| SaaS platform | 3004 | `express_saas` | 3104 | `nest_saas` |

---

## Scripts

| Task | Express | NestJS |
|---|---|---|
| Develop with reload | `npm run dev` | `npm run start:dev` |
| Unit tests | `npm test` | `npm test` |
| End-to-end tests | (included in `npm test`) | `npm run test:e2e` |
| Lint | `npm run lint` | `npm run lint` |
| Build | `npm run build` | `npm run build` |
| Run the build | `npm start` | `npm run start:prod` |
| Database migration | `npm run db:migrate` | TypeORM migrations (week 2) |

---

## Testing and CI

- **Vitest** everywhere. Express tests call the app through supertest without starting a server. NestJS has unit tests (`*.spec.ts`) and end-to-end tests (`test/*.e2e-spec.ts`).
- **CI** (`.github/workflows/ci.yml`) runs `lint`, `test`, `test:e2e` (where present) and `build` for every project in the matrix, on each push to `main` and each pull request.
- **Postman** ([`postman/`](postman)): one collection per project with tests, token handling and an environment per framework. See [`postman/README.md`](postman/README.md).

---

## Deployment

Each project has a two-stage `Dockerfile`: the build stage installs everything and compiles, and the runtime stage ships production dependencies and `dist/` only, on Node 24, as a non-root user.

| Platform | Notes |
|---|---|
| Coolify (own server) | Free, runs all 8, supports WebSockets |
| Railway | Paid after trial |
| Render (`onrender.com`) | Free tier sleeps when idle |
| Fly.io | Containers, supports WebSockets |
| DigitalOcean App Platform | Paid |

Not used: Heroku (no free tier), Cyclic (shut down), Vercel for the chat apps (functions can't hold WebSocket connections).

---

## Progress tracking

**Daily, on build days**
- [ ] Express feature implemented and tested
- [ ] NestJS feature implemented and tested
- [ ] Both deployed to staging
- [ ] Code comparison notes written
- [ ] Learning insights recorded

**Weekly, every Sunday:** add the week's report to [`comparison-reports/learning-journey.md`](comparison-reports/learning-journey.md) (Express strengths, challenges and learnings, the same for NestJS, the framework comparison, next week's focus).

**End of week 4:** fill in [`architecture-comparison.md`](comparison-reports/architecture-comparison.md) and [`performance-benchmarks.md`](comparison-reports/performance-benchmarks.md).

---

## Conventions

- **Commits:** small and meaningful, as the work happens, spread across real days. One feature or fix per commit.
- **Branches:** one branch per feature, merged through a pull request.
- **Same features in both frameworks:** a feature isn't done until it works in Express and in NestJS.
- **Secrets:** never committed. Each project has a `.env.example`. Copy it to `.env` locally.
- **Errors:** one JSON shape in both frameworks, `{ "error": { "code", "message" } }`.

---

## Setup notes and gotchas

Found while scaffolding on 2026-10-19, plus the fixes to the original plan.

| Topic | Note |
|---|---|
| Node | Node 24 LTS. Node 18 (in the original plan) is end-of-life, and NestJS 12 needs 20.19+ |
| Prisma version | `npm i prisma` with no version installs **8.0.0-rc** (the `latest` tag), while `@prisma/client` latest is 7.10.1. Always pin both: `prisma@7 @prisma/client@7` |
| Prisma init | `prisma init` (7.10) also writes AI-agent skill folders (`.agents`, `.claude`, `.windsurf`). The Express project writes `prisma.config.ts` and the schema by hand instead |
| Express setup | No `express-generator` (old JavaScript template). No `asyncHandler`, since Express 5 forwards async errors itself |
| NestJS scaffold | `nest new` run non-interactively gives an ESM project with Vitest and oxlint |
| NestJS Observe | `nest new --observe` hardcodes placeholder keys in `app.module.ts`. Here the keys come from `.env` instead |
| npm audit | `@nestjs/mau` (dev tool behind `nest deploy`) pulled in a vulnerable `undici`. Removed, now 0 vulnerabilities |
| TypeScript | Express projects use TypeScript 7. NestJS projects keep TypeScript 6, which the Nest CLI pins |
| Socket.IO | `socket.io` ships its own types. Don't install `@types/socket.io` |
| Dockerfile | The original copied production deps only and never built `dist/`, so it couldn't start. Fixed with a build stage |
| CI | `actions/checkout@v5` and `actions/setup-node@v5` on Node 24 (the original used `@v3` and Node 18) |
