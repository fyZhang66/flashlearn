# Demo script

A ~10-minute walkthrough covering all four pillars. Assumes Docker
Desktop running and no containers named `flashlearn-*` already up.

## Pre-flight (one terminal, one minute)

```bash
cd final-devops
npm install
npm run build
```

## 1 — Docker + local observability stack (4 min)

```bash
docker compose up --build -d
```

First time: image builds (~1 min) + ES cold-starts (~60s). Subsequent
times: ~30s.

Verify everything is live:

```bash
docker compose ps         # all Up / (healthy)
curl http://localhost:3000/livez          # liveness
curl http://localhost:3000/readyz         # readiness
curl http://localhost:3000/metrics | head # prom metrics
```

Register + log in in a browser at <http://localhost:3000>, add a few
cards, review them. Watch:

- `docker logs -f flashlearn-app` — live JSON logs
- <http://localhost:5601> → Kibana → index pattern `fluentbit-*` — the
  same logs, parsed and searchable
- <http://localhost:16686> → Jaeger → Service = `flashlearn` — a trace
  per request, showing the Express middleware, `pg` query, and
  `bcrypt.compare` spans

## 2 — Generate traffic + show Grafana (2 min)

```bash
DURATION=60 CONCURRENCY=5 ./scripts/load.sh
```

Then open Grafana at <http://localhost:3001> (admin / admin) → *FlashLearn
— Golden Signals + Business*:

- **Throughput** climbs by route
- **Latency p50/p95/p99** stays tight until…
- …**Error ratio** stays at 0 unless you deliberately break something
- **Cards reviewed by rating** stacks hard/good/easy
- **Login attempts by outcome** shows success vs bad-password ratio

## 3 — Kubernetes (kind) rollout (3 min)

Teardown compose, bring up kind:

```bash
docker compose down
./scripts/kind-up.sh
```

The script builds (if needed), loads the image into kind, installs
nginx-ingress + metrics-server, and applies the dev overlay. The app is
at <http://localhost/>.

Walk through:

```bash
kubectl --context kind-flashlearn -n flashlearn get all
kubectl --context kind-flashlearn -n flashlearn describe hpa app
kubectl --context kind-flashlearn -n flashlearn describe deploy app | less
```

Point out:

- Probes (startup / readiness hits /readyz and fails if the DB is down /
  liveness on /livez)
- Resource requests + limits
- HPA min/max + metrics target
- `kubernetes.io/change-cause` annotation on the deployment — set by
  the CD job for auditability

Drive load against the cluster (port 80 is mapped to the laptop by
kind's `extraPortMappings`):

```bash
BASE=http://localhost DURATION=120 CONCURRENCY=10 ./scripts/load.sh &
watch -n 2 'kubectl --context kind-flashlearn -n flashlearn top pods; echo; kubectl --context kind-flashlearn -n flashlearn get hpa app'
```

Under sustained load the HPA scales replicas from 1 → up to 6.

## 4 — CI/CD (2 min)

```bash
echo "// demo $(date +%s)" >> src/App.jsx
git commit -am "demo: kick the pipeline"
git push
```

In another tab, open the Actions tab on GitHub:

- `CI` starts on `ubuntu-latest` — lint, test, build, push image to GHCR
- `CD` fires on the self-hosted runner, pulls the image, `kind load`s
  it, `kubectl set image`es the deployment
- `kubectl rollout status` blocks until pods are healthy

Confirm the new image landed:

```bash
kubectl --context kind-flashlearn -n flashlearn get deploy app \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

The tag is the commit SHA.

## Tear-down

```bash
./scripts/kind-down.sh
docker compose down -v    # -v also wipes the postgres volume
```
