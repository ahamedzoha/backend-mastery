# Performance benchmarks

Same endpoint, same machine, same data, warm-up first. Compare the two frameworks against each other. Small gaps on a laptop are noise.

**Tool:** k6 or autocannon · **Machine:** _fill in_ · **Node:** 24

| Project | Endpoint | Framework | Requests/sec | p95 latency | Image size |
|---|---|---|---|---|---|
| E-commerce | `GET /products` | Express | | | |
| E-commerce | `GET /products` | NestJS | | | |
| Auth | `POST /auth/login` | Express | | | |
| Auth | `POST /auth/login` | NestJS | | | |

## How each run was done

<!-- command, duration, virtual users, data size -->
