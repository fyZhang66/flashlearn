# CI/CD

Two GitHub Actions workflows live under `.github/workflows/`:

| File      | Runs on                       | Purpose                                     |
| --------- | ----------------------------- | ------------------------------------------- |
| `ci.yml`  | GitHub-hosted (`ubuntu-latest`)| lint, test (against a Postgres service container), build frontend, build + push Docker image to GHCR |
| `cd.yml`  | **Self-hosted** (your laptop) | pulls the freshly-built image, loads it into the kind cluster, rolls out the new deployment, waits for the rollout to finish |

The split matters: CI runs anywhere (tests don't need a cluster), CD has
to run somewhere that can actually reach the cluster. For a local kind
setup, that "somewhere" is your laptop.

## Pipeline shape

```
git push main
  ↓
CI: lint → test → build → docker push to ghcr.io/<you>/flashlearn:<sha>
  ↓  (workflow_run trigger)
CD (self-hosted on laptop):
  docker pull ghcr.io/<you>/flashlearn:<sha>
  kind load docker-image
  kubectl set image deployment/app app=ghcr.io/<you>/flashlearn:<sha>
  kubectl rollout status
```

## First-time setup

### 1. Prerequisites on the laptop

```bash
brew install kind kubectl  # if not already installed
./scripts/kind-up.sh       # brings up the cluster once
```

### 2. Register the self-hosted runner

In your GitHub repo:

1. **Settings → Actions → Runners → New self-hosted runner**
2. Pick **macOS**, **ARM64** (or x64, depending on your Mac).
3. GitHub shows you a download + configure + run command block. Run them in
   a dedicated terminal — the `config.sh` step asks for a runner name
   (default is fine) and a work folder (default `_work` is fine).
4. Start the runner:

   ```bash
   cd actions-runner
   ./run.sh
   ```

   Leave this terminal open while you want CD to work. For a more
   permanent install:

   ```bash
   ./svc.sh install
   ./svc.sh start
   ```

5. In the repo's Actions → Runners page you should see the runner with
   status **Idle**.

The `actions-runner/` directory is `.gitignore`'d — don't commit it. The
runner's token is short-lived, so only re-register from GitHub's UI.

### 3. Verify permissions

- The runner has full shell access to the machine it's installed on. Only
  install it for repos you trust.
- `GITHUB_TOKEN` in the CD workflow has `packages: read`, which is enough
  to pull from GHCR. The first image push from CI also implicitly makes
  the package visible to the repo. If you want it public (so the cluster
  can pull without auth), flip it in GitHub → your profile → Packages →
  `flashlearn` → Package settings → Change visibility.

### 4. Trigger the pipeline

```bash
git commit --allow-empty -m "kick the pipeline"
git push
```

Watch:

- CI: <https://github.com/fyZhang66/flashlearn/actions/workflows/ci.yml>
- CD: <https://github.com/fyZhang66/flashlearn/actions/workflows/cd.yml>
- Local cluster: `kubectl --context kind-flashlearn -n flashlearn get pods -w`

## Debugging

**CI fails in `test` step**: the Postgres service container probably
didn't come up in time. Check the "Initialize containers" step in the
job log for health-check output. Bumping `--health-retries` is the usual
fix.

**CD fails at `kind load docker-image`**: the self-hosted runner isn't
using the same Docker context the kind cluster was created from, or kind
binary isn't on the runner's PATH. Easiest fix: install kind via `brew`
and confirm `kind get clusters` shows `flashlearn` from the runner's
shell.

**CD fails at `kubectl set image`**: the kind cluster's kubeconfig isn't
on the runner's default path. Either copy it (`cp ~/.kube/config
~/actions-runner/.kube/config`) or set `KUBECONFIG` in the runner's
environment.

**Rollout hangs**: `kubectl -n flashlearn describe deploy/app` usually
shows the real cause — image pull error, readiness probe failing, etc.
