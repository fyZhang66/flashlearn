# FlashLearn — DevOps Capstone

A spaced-repetition flashcard app used as the vehicle for demonstrating
the CI/CD, containers, observability, and Kubernetes topics from
CSYE 7220.

The application itself (a React + Express flashcard system backed by
Postgres) is secondary — the point of this repo is the DevOps plumbing
around a real, stateful web app.

## DevOps topics covered

| Topic         | Where it lives                                 |
| ------------- | ---------------------------------------------- |
| CI            | `.github/workflows/ci.yml`                     |
| CD            | `.github/workflows/cd.yml` (self-hosted)       |
| Docker        | `docker/Dockerfile`, `compose.yaml`            |
| Observability | `observability/` + app-level instrumentation   |
| Kubernetes    | `k8s/` (kustomize for a local kind cluster)    |

Deep-dive docs live under [`docs/`](docs/). The course report is
[`REPORT.md`](REPORT.md).

## Quick start — Docker Compose (recommended)

```bash
npm install
npm run build
docker compose up --build -d
```

| Service     | URL                                                 |
| ----------- | --------------------------------------------------- |
| App         | <http://localhost:3000>                             |
| Grafana     | <http://localhost:3001> (admin / admin)             |
| Prometheus  | <http://localhost:9090>                             |
| Kibana      | <http://localhost:5601>                             |
| Jaeger      | <http://localhost:16686>                            |
| Postgres    | `postgres://flashlearn:flashlearn@localhost:5432/flashlearn` |

Then pump traffic so the dashboards fill:

```bash
DURATION=120 CONCURRENCY=4 ./scripts/load.sh
```

## Quick start — Kubernetes (kind)

```bash
brew install kind              # one-time
./scripts/kind-up.sh           # creates cluster, loads image, deploys
```

App is reachable at <http://localhost/> via the kind-hosted nginx
ingress.

Tear down: `./scripts/kind-down.sh`.

## Development

```bash
# 1. Bring up Postgres (one-shot)
docker run --rm -d --name pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=flashlearn_test \
  -p 5432:5432 postgres:16-alpine

# 2. Run tests
DATABASE_URL=postgres://postgres:postgres@localhost:5432/flashlearn_test \
  npm test

# 3. Run the full Vite dev server + Express
npm run dev    # frontend on :5173 (proxies /api to :3000)
npm start      # backend on :3000 (requires DATABASE_URL)
```

## Layout

```
final-devops/
├── server.js              Express entrypoint (probes, metrics, routes)
├── routes/                /api handlers
├── cards-manager.js       Postgres-backed card repo
├── user-management.js     users + bcrypt auth
├── sessions.js            Postgres-backed session store
├── middleware.js          requireAuth middleware
├── telemetry.js           OTel NodeSDK bootstrap
├── metrics.js             prom-client registry + custom counters
├── logger.js              pino JSON logger
├── db.js                  pg Pool
├── migrations/            idempotent SQL, applied by scripts/migrate.js
├── src/                   React frontend (Vite)
├── docker/Dockerfile      multi-stage node:20-alpine image
├── compose.yaml           full local stack (app + pg + full obs)
├── observability/         prometheus, grafana, fluent-bit, otel configs
├── k8s/                   kustomize base + dev/prod overlays
├── .github/workflows/     CI (GitHub-hosted) + CD (self-hosted)
├── scripts/               load.sh, kind-up.sh, migrate.js
├── tests/                 vitest + supertest integration suite
└── docs/                  ARCHITECTURE.md, DEMO.md, CICD.md, legacy/
```
