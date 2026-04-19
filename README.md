# FlashLearn — DevOps Capstone

A spaced-repetition flashcard app used as the vehicle for demonstrating the
CI/CD, containers, observability, and Kubernetes topics from CSYE 7220.

The application itself (a React + Express flashcard system with spaced
repetition) is secondary — the goal of this repo is to show the DevOps
plumbing around a real, stateful web app.

## DevOps topics covered

| Topic         | Where it lives                          |
| ------------- | --------------------------------------- |
| CI            | `.github/workflows/ci.yml`              |
| CD            | `.github/workflows/cd.yml` (self-hosted)|
| Docker        | `docker/Dockerfile`, `compose.yaml`     |
| Observability | `observability/` + app instrumentation  |
| Kubernetes    | `k8s/` (kind cluster)                   |

See `docs/` for topic-by-topic write-ups and `REPORT.md` for the final report.

## Quick start (local, Docker Compose)

```bash
npm install
npm run build
docker compose up --build
```

Then open:

- App: <http://localhost:8080>
- Grafana: <http://localhost:3001> (admin / admin)
- Prometheus: <http://localhost:9090>
- Kibana: <http://localhost:5601>
- Jaeger: <http://localhost:16686>

## Quick start (Kubernetes, kind)

```bash
./scripts/kind-up.sh
kubectl apply -k k8s/overlays/dev
```

## Layout

```
final-devops/
├── src/                 React frontend (Vite)
├── routes/              Express route handlers
├── server.js            Express entrypoint
├── migrations/          SQL migrations for Postgres
├── docker/              Dockerfile(s)
├── compose.yaml         Full local stack (app + db + observability)
├── observability/       Prometheus, Grafana, EFK, OTel, Jaeger configs
├── k8s/                 kustomize base + dev/prod overlays
├── .github/workflows/   CI (GitHub-hosted) + CD (self-hosted)
├── scripts/             dev helpers (kind-up, seed, etc.)
├── tests/               integration + unit tests
└── docs/                per-topic write-ups; legacy/ holds pre-refactor docs
```

## Status

In progress. Current phase: scaffold (Phase 0). See commit history for
progress against the plan.
