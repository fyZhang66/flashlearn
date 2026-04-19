# FlashLearn DevOps Capstone — Final Report

**Course:** CSYE 7220 — DevOps
**Author:** Fangyuan Zhang
**Repo:** <https://github.com/fyZhang66/flashlearn>

## 1. What I built

I took FlashLearn — a React + Express spaced-repetition flashcard app I
had from a prior course — and rebuilt it from a stateless in-memory toy
into a production-shaped system so I could exercise every DevOps topic
we covered: **CI/CD, Docker, observability, and Kubernetes**. The app
itself is the same feature-wise; everything around it is new.

The end result is a repo where a single `git push` to `main` runs tests
against a real Postgres, builds a Docker image, publishes it to GHCR,
and rolls it out to a local Kubernetes cluster — all without me leaving
my editor.

## 2. Application changes that made the DevOps work meaningful

Before I could honestly demonstrate most of these topics, the app had
to grow up:

| Change                                        | Why it matters                      |
| --------------------------------------------- | ----------------------------------- |
| In-memory stores → **Postgres** (users, sessions, cards) | So data survives a container restart, rolling update, or HPA scale event. Without this, every DevOps demo is hollow. |
| Password-less sessions → **bcrypt-hashed passwords** | Real auth gives me real test cases (`bad-password` vs `no-such-user`) and a real login-attempt metric. |
| `/livez`, `/readyz`, `/metrics`               | Kubernetes probes and Prometheus scrape need them to do anything useful. (`/livez` not `/healthz` because ingress-nginx reserves `/healthz`.) |
| `console.log` → **pino JSON logs**            | Fluent Bit picks structured logs up for free; Kibana's filters work because fields are typed. |
| No tracing → **OpenTelemetry auto-instrumentation** | One `--import ./telemetry.js` flag and every Express route + `pg` query is a span in Jaeger. |
| No tests → **17 vitest + supertest tests** against a real DB | CI has something to run; the tests gave me confidence to rewrite the repos. |
| Sessions in memory → **Postgres `sessions` table** | Required to run >1 replica without sticky cookies. Unblocks the HPA. |

## 3. The four DevOps pillars

### 3.1 Docker — `docker/Dockerfile`, `compose.yaml`

The Dockerfile is two-stage: a builder stage installs all deps (inc.
dev) and runs the Vite build, then a thin `node:20-alpine` runtime stage
copies only the pieces it needs. bcrypt's native binding is built in
both stages and the dev build deps are deleted from the final image.
Final size is ~585 MB — dominated by the Node base + native compilers I
couldn't fully purge. `HEALTHCHECK` hits `/livez`; `tini` is PID 1 so
signals get forwarded cleanly; `USER node` means the process doesn't
run as root.

`compose.yaml` brings up **ten services** on a single user network:

- **App** + one-shot **migrate** init container, both running the same image
- **postgres** (healthcheck = `pg_isready`)
- **prometheus**, **grafana** (port 3001 because the app owns 3000)
- **elasticsearch**, **kibana**, **fluent-bit** (EFK log pipeline fed
  via Docker's `fluentd` log driver with `fluentd-async` so the app
  doesn't block if the shipper's down)
- **otel-collector**, **jaeger** (traces)

Biggest design decisions:

- **Migrate as an init container** (`service_completed_successfully`
  dependency) — the app image stays schema-ignorant; running `compose
  up` against a fresh volume Just Works.
- **Fluent log driver on the app** — no sidecar or agent baked into the
  image; the Docker daemon handles shipping.

### 3.2 Observability — `observability/`

Mirrors the stack from the observability lab exactly: Prometheus +
Grafana for metrics, Elasticsearch + Kibana + Fluent Bit for logs,
OpenTelemetry Collector + Jaeger for traces. Alertmanager was dropped
since alerts weren't in scope for the final project.

App-level instrumentation:

- **`prom-client`**: default Node metrics + six custom counters/gauges —
  `http_requests_total`, `http_request_duration_seconds`,
  `inprogress_requests`, `cards_created_total`,
  `cards_reviewed_total{rating}`, `login_attempts_total{outcome}`.
- **OpenTelemetry auto-instrumentation** for Express + `pg`. Set
  `OTEL_EXPORTER_OTLP_ENDPOINT` and every request becomes a trace in
  Jaeger, showing the DB query timings nested inside the HTTP span.
- **pino** + `pino-http` for structured JSON logs. Health/metrics routes
  are excluded from the access log to keep the stream clean.

I ported the lab's 4-panel golden-signals dashboard and added a second
row of panels specific to FlashLearn (cards reviewed by rating, login
outcomes, cards/user totals, process RSS). `scripts/load.sh` spawns
parallel curl workers to make those panels do something interesting
during the demo.

What the three signals actually showed me in practice:

- **Metrics** surface "is it fast? is it breaking?" — golden-signals
  work because they're computed over rates, not raw counts.
- **Logs** are for "what exactly happened on that one request?" —
  Kibana filters by `level:error` got me to failures fast.
- **Traces** matter most when a span *inside* a request is slow — e.g.
  bcrypt compare on login was consistently 60-80ms, visible in Jaeger
  the instant I looked.

### 3.3 Kubernetes — `k8s/`, `scripts/kind-up.sh`

Local cluster is **kind** with a one-node config that maps host ports
80/443 into the cluster. `scripts/kind-up.sh` also installs
`nginx-ingress` and `metrics-server` (patched with
`--kubelet-insecure-tls` for kind's self-signed kubelet cert), then
applies the dev overlay.

Manifests use **kustomize** with a shared `base/` and two overlays:

- `overlays/dev/` — uses the locally-built `flashlearn-app:local` image
  (loaded into kind via `kind load docker-image`), 1 replica for sanity.
- `overlays/prod/` — points at `ghcr.io/fyzhang66/flashlearn:latest`; CD
  pins the tag to the build SHA in the runner's workspace before
  `kubectl apply -k`.

Resource shape:

- **Postgres** as a StatefulSet with a 1 Gi PVC, so the pod can be
  recycled without losing data.
- **Migrations as an initContainer** on the app Deployment, not as a
  separate Job. A Job + Deployment are independent in k8s — the app can
  roll out before the schema exists. An initContainer ties pod Ready-ness
  to migration success. `scripts/migrate.js` uses a `pg_advisory_lock` so
  concurrent pods don't race.
- **App** as a Deployment with 2 replicas by default,
  `startupProbe`/`readinessProbe`/`livenessProbe` hitting the actual
  probe endpoints (readiness also pings the DB so a k8s Service drops a
  pod whose DB is unavailable), and a `preStop` sleep so traffic drains
  before SIGTERM takes the process down. `RollingUpdate` with
  `maxUnavailable: 0` means the app never has <2 pods serving during a
  deploy.
- **HPA** scales the app 2→6 on 60% CPU utilization. Under
  `scripts/load.sh` against the kind cluster it kicks in within ~30s.

The single most useful thing I learned: **`readinessProbe` and
`livenessProbe` should not be the same endpoint.** Readiness = "should
a Service route traffic here?" — check the DB. Liveness = "is the
process alive?" — check something cheap that's only false if the pod is
genuinely wedged. Conflating them caused a 15-minute outage during a
DB outage in my first draft, because every pod's livenessProbe failed,
kubelet killed them all, they came back up, and the cycle continued
until Postgres was healthy again.

### 3.4 CI/CD — `.github/workflows/`

Two workflows, split deliberately:

**`ci.yml` on GitHub-hosted `ubuntu-latest`.** Lint → tests (against a
`postgres:16-alpine` service container — the same real DB the tests
expect locally) → frontend build. On `main` only, a second job builds
the Docker image with GHA layer cache and pushes two tags to GHCR:
`:<sha>` and `:latest`. Auth uses the built-in `GITHUB_TOKEN` with
`packages: write`.

**`cd.yml` on a self-hosted runner on my laptop.** Triggered by
`workflow_run` when CI succeeds on `main`. Checks out the repo at the
built SHA, pulls the new image and `kind load`s it, pins the prod
overlay's image tag to that SHA via an ephemeral `sed` on
`kustomization.yaml`, then runs `kubectl apply -k k8s/overlays/prod` so
every manifest (ConfigMap, Secret, HPA, Ingress — not just the image)
is reconciled on each deploy. `rollout status` blocks until the
Deployment's migrate initContainer and app container are both healthy.
A `concurrency: cd` group serializes deploys so an older push can't
land on top of a newer one.

The self-hosted runner is the load-bearing piece: the cluster lives on
my laptop, so the deploy has to come from my laptop. This is cheaper
and simpler than punching an inbound tunnel to a managed runner, and it
matches how real orgs operate runners next to their prod infra.

## 4. What surprised me

- **How much the "app refactor" dwarfed the "DevOps work."** 80% of the
  first commit-set was Postgres, auth, probes, metrics, tracing — i.e.
  making the *app* ready to be observed, deployed, and scaled.
  Containerizing an in-memory toy is cheap; containerizing a realistic
  service means restructuring the service.
- **Docker's `fluentd` log driver removes the sidecar.** I didn't need
  to bake an agent into my image; a single `logging:` block per service
  in compose did it. This wasn't obvious from the lab and cut a lot of
  noise.
- **OTel auto-instrumentation is genuinely zero-code.** Installing two
  npm packages and setting one env var filled Jaeger with meaningful
  spans, including DB query nesting inside HTTP spans. The only gotcha
  was package-version skew: `resourceFromAttributes` I tried to use is
  only in `@opentelemetry/resources@2.x`, and the auto-instrumentations
  meta-package pulled in 1.30.x, so I had to switch to the older
  `new Resource({...})` API.
- **`kubectl kustomize` catches a lot before the cluster ever sees your
  YAML.** Rendering the dev overlay locally caught the deprecated
  `commonLabels` warning and a few selector-mismatch bugs without ever
  spinning up kind.

## 5. Knowable gaps / things I'd do with more time

- **Observability stack in Kubernetes too.** Right now it only lives in
  compose; the kind demo doesn't have Grafana. Helm-installing
  `kube-prometheus-stack` would close that, but it's a non-trivial
  chunk of YAML and wasn't in scope for the final.
- **Real GitOps (Argo CD / Flux).** The current CD pushes state into
  the cluster from a runner. A pull-based controller sitting inside the
  cluster watching the repo would be closer to how real orgs do this.
- **Postgres backup/restore.** A StatefulSet + PVC isn't a backup
  strategy.
- **Secrets management.** The Postgres password is in a plain `Secret`
  in git. Sealed Secrets or external-secrets-operator is the real
  answer.

## 6. How to verify

The demo script is [`docs/DEMO.md`](docs/DEMO.md) — ten minutes,
covers all four pillars end-to-end. A reviewer can also run:

```bash
# lint + tests
docker run --rm -d --name pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flashlearn_test -p 5432:5432 postgres:16-alpine
npm ci
npm run lint
DATABASE_URL=postgres://postgres:postgres@localhost:5432/flashlearn_test \
  npm test                                           # 17 tests pass

# full compose stack
docker compose up -d
DURATION=60 ./scripts/load.sh                        # populates dashboards
# Grafana at :3001, Jaeger at :16686, Kibana at :5601
docker compose down

# kubernetes
./scripts/kind-up.sh
kubectl --context kind-flashlearn -n flashlearn get all
```

## 7. Links

- [Architecture](docs/ARCHITECTURE.md)
- [Demo script](docs/DEMO.md)
- [CI/CD setup](docs/CICD.md)
- [Commits / progress](https://github.com/fyZhang66/flashlearn/commits/main)
