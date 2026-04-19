#!/usr/bin/env bash
# Spin up a local kind cluster, install the nginx ingress controller, load
# the locally-built flashlearn-app image, and apply the dev overlay.
#
# Requirements: docker, kind, kubectl, kustomize (or `kubectl apply -k`).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLUSTER=flashlearn
IMAGE="flashlearn-app:local"

cd "$REPO_ROOT"

if ! command -v kind >/dev/null; then
  echo "kind not installed. Install with: brew install kind" >&2
  exit 1
fi

if ! kind get clusters | grep -q "^${CLUSTER}$"; then
  echo "==> creating kind cluster '$CLUSTER'"
  kind create cluster --name "$CLUSTER" --config k8s/kind-config.yaml
else
  echo "==> reusing existing kind cluster '$CLUSTER'"
fi

echo "==> installing nginx ingress"
kubectl --context "kind-$CLUSTER" apply -f \
  https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/kind/deploy.yaml

echo "==> waiting for ingress controller to become ready"
kubectl --context "kind-$CLUSTER" wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s

echo "==> installing metrics-server (needed for HPA)"
kubectl --context "kind-$CLUSTER" apply -f \
  https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# metrics-server needs --kubelet-insecure-tls in kind (self-signed kubelet cert)
kubectl --context "kind-$CLUSTER" -n kube-system patch deployment metrics-server --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

echo "==> building app image (if missing)"
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker build -f docker/Dockerfile -t "$IMAGE" .
fi

echo "==> loading $IMAGE into kind"
kind load docker-image "$IMAGE" --name "$CLUSTER"

echo "==> applying dev overlay"
kubectl --context "kind-$CLUSTER" apply -k k8s/overlays/dev

echo "==> waiting for app rollout"
kubectl --context "kind-$CLUSTER" -n flashlearn rollout status deploy/app --timeout=180s

echo
echo "Cluster ready. App: http://localhost/"
echo "  kubectl --context kind-$CLUSTER -n flashlearn get pods"
echo "  kubectl --context kind-$CLUSTER -n flashlearn logs -l app=flashlearn -f"
