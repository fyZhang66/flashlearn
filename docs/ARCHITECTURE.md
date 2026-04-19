# Architecture

Two runtime modes ship side-by-side:

- **Docker Compose** — a single user network on your laptop, everything
  in containers, host ports bound for each UI. This is the mode designed
  for the live demo.
- **Kubernetes (kind)** — the same app image deployed the way it'd be in
  prod, behind an Ingress, with probes + an HPA. The observability stack
  is *not* deployed into kind (scope); the kind demo focuses on the
  platform story.

## Compose mode (used for the live demo)

```
                              Browser
                                │
                    ┌───────────┴───────────┐
                    │                       │
              http://localhost:3000   http://localhost:3001 (Grafana)
                    │                       │
                    ▼                       │
         ┌──────────────────┐               │
         │   app (Node 20)  │────metrics────┤
         │  /api/*  /dist/  │               │
         │  /healthz /readyz│               │
         │  /metrics        │               │
         └─────┬──────┬─────┘               │
               │      │                     │
               │      │ OTLP/4318           │
               │      ▼                     │
               │  ┌─────────────────┐       │
               │  │ otel-collector  │       │
               │  └────────┬────────┘       │
               │           │                │
               │           ▼                │
               │       ┌──────────┐         │
               │       │  jaeger  │◄── :16686
               │       └──────────┘         │
               │                            │
       stdout (JSON)                        │
               │                            │
               ▼                            │
        ┌───────────────┐                   │
        │  fluent-bit   │──► elasticsearch ─┴► kibana :5601
        │  (fluentd     │
        │   driver)     │
        └───────────────┘
                                            ┌─► prometheus :9090 ─► grafana :3001
                                            │
                                            │
         ┌───────────────┐                   │
         │   postgres    │◄── pg pool        │
         │  (volume:     │                   │
         │   postgres-   │                   │
         │   data)       │                   │
         └───────────────┘                   │
                                             │
         ┌───────────────┐                   │
         │    migrate    │── exits 0 after ──┘
         │ (init one-shot│    schema is applied
         │  container)   │
         └───────────────┘
```

Key points:

- **Migrate as an init service.** `migrate` runs the same image as the
  app with a different command (`node scripts/migrate.js`) and blocks
  the app's `depends_on` with `service_completed_successfully`. That
  makes the schema deterministic across fresh boots and keeps the app
  container image migration-ignorant.
- **Sessions in Postgres.** Session tokens aren't in memory — they're a
  row in `sessions`. Lets the app run with any number of replicas
  without sticky sessions.
- **Docker's `fluentd` log driver.** App stdout JSON lands in fluent-bit
  as-is, no agent in the app image. `fluentd-async: true` keeps the app
  from blocking if fluent-bit is down.
- **OTel is best-effort.** If `otel-collector` is unreachable the
  exporter just drops spans; it can't take the app down.

## Kubernetes mode

```
Host (macOS)                kind cluster (in Docker)
───────────────             ─────────────────────────────────────────
                           ┌──────────────────────────────────────┐
                           │  namespace: flashlearn               │
  :80  ─► ingress-nginx ──►│  ┌──────────────────────────────┐    │
                           │  │  Ingress (nginx)             │    │
                           │  └──────────────┬───────────────┘    │
                           │                 │                    │
                           │  ┌──────────────▼───────────────┐    │
                           │  │  Service: app (ClusterIP)    │    │
                           │  └──────────────┬───────────────┘    │
                           │                 │                    │
                           │  ┌──────────────▼───────────────┐    │
                           │  │  Deployment: app (2 replicas)│    │
                           │  │  startup / readyz / healthz  │    │
                           │  │  HPA 2→6 on CPU              │    │
                           │  └──────────────┬───────────────┘    │
                           │                 │                    │
                           │  ┌──────────────▼───────────────┐    │
                           │  │  Service: postgres (headless)│    │
                           │  └──────────────┬───────────────┘    │
                           │                 │                    │
                           │  ┌──────────────▼───────────────┐    │
                           │  │  StatefulSet: postgres + PVC │    │
                           │  └──────────────────────────────┘    │
                           │                                      │
                           │  (migrations run as an initContainer │
                           │   inside each app pod; advisory lock │
                           │   in scripts/migrate.js serializes)  │
                           │                                      │
                           │  Secret: postgres-credentials        │
                           │  ConfigMap: app-config               │
                           └──────────────────────────────────────┘
                                                   ▲
                                                   │
                                    kubectl set image (from CD)
                                                   │
                          GitHub self-hosted runner on laptop
```

The self-hosted runner checks out the repo at the built SHA, pins the
prod overlay's image tag to that SHA via an ephemeral `sed` on
`kustomization.yaml`, then does `kubectl apply -k k8s/overlays/prod` so
ConfigMap / Secret / HPA / Ingress drift stays impossible; the final
`rollout status` blocks until the Deployment (including its migrate
initContainer) is healthy.

Key points:

- **StatefulSet + PVC** for Postgres so data survives pod recycling.
- **Migrations as an initContainer**, not a Job. A Job + Deployment are
  independent in k8s, so a fresh cluster can roll out the app before
  the schema exists. Putting the migration in an initContainer gates pod
  Ready-ness on migration success. `scripts/migrate.js` takes a
  `pg_advisory_lock` so concurrent pods serialize safely — only one
  actually applies, the others no-op and exit 0.
- **Probes** match the reality of the app: `startupProbe` to absorb slow
  cold starts, `readinessProbe` that actually pings the DB (`/readyz`),
  `livenessProbe` that's cheap (`/healthz`).
- **`preStop` sleep** so a pod being removed from the Service finishes
  in-flight requests instead of dropping them.
- **HPA on CPU** (2→6 replicas at 60% target). Requires metrics-server
  — `kind-up.sh` installs it and patches `--kubelet-insecure-tls`.
- **Rolling updates** with `maxUnavailable: 0` keeps the app always
  available during deploys.

## Pipeline

```
developer push main
      │
      ▼
┌────────────────────────────────────────────┐
│  GitHub-hosted runner (ubuntu-latest)      │
│  ci.yml → verify → lint + test + build     │
│       │                                    │
│       ▼                                    │
│  image job: docker build → push to GHCR    │
│  ghcr.io/fyzhang66/flashlearn:<sha>        │
│  ghcr.io/fyzhang66/flashlearn:latest       │
└─────────────────────┬──────────────────────┘
                      │ workflow_run
                      ▼
┌────────────────────────────────────────────┐
│  Self-hosted runner (your laptop)          │
│  cd.yml →                                  │
│     docker pull <sha>                      │
│     kind load docker-image <sha>           │
│     kubectl set image deploy/app ...       │
│     rollout status                         │
└────────────────────────────────────────────┘
```

The CI/CD split is the key design decision: **the cluster lives on the
laptop, so the deploy has to come from the laptop.** A self-hosted
runner is the minimal piece that makes that possible without punching
inbound holes in the firewall or tunneling the kubeconfig off-box.
