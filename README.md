# ReleaseForge — Progressive Delivery Platform

A production-style Progressive Delivery platform on Kubernetes demonstrating **Blue-Green deployments**, **Canary traffic shifting**, **Prometheus-driven automated rollbacks**, **GitOps reconciliation**, and **CI security scanning**.

## Architecture
- **Application**: React (Vite) + Express API with `/health`, `/ready`, `/version`, `/metrics` (Prometheus), and configurable fault/latency injection (`FAIL_RATE`, `LATENCY_MS`).
- **Container**: Multi-stage Alpine Dockerfile running as non-root (`USER node`).
- **CI**: GitHub Actions (Vitest -> Docker Build -> Trivy CVE Scan -> Immutable Git SHA push to GHCR).
- **CD & Progressive Delivery**: Argo CD + Argo Rollouts (`BlueGreen` and `Canary` strategies).
- **Observability**: `kube-prometheus-stack` (Prometheus + Grafana) with `ServiceMonitor` and Argo Rollouts `AnalysisTemplate`.

## Verified Release Scenarios
1. **Blue-Green Cutover**: Deployed `v2.0.0` (Green) to `releaseforge-preview` while `v1.0.0` (Blue) served live traffic on `releaseforge-active`, validated side-by-side, and promoted with zero downtime.
2. **Automated Canary Rollback**: Shifted 25% weight to a faulty release (`FAIL_RATE=0.8`). Argo Rollouts executed a Prometheus `AnalysisRun` querying `/api/orders` HTTP 2xx success rate, detected a breach below the 95% threshold (`failed (2) > failureLimit (1)`), aborted the rollout, terminated the canary pod, and restored 100% traffic to the stable revision.

## Quick Start (Local Kind Cluster)
```bash
kind create cluster --name releaseforge
docker build -t releaseforge:v1.0.0 ./app
kind load docker-image releaseforge:v1.0.0 --name releaseforge
kubectl apply -f kubernetes/base/namespace.yaml
kubectl apply -f gitops/analysis-templates/
kubectl apply -f gitops/rollouts/canary/

# ReleaseForge — Progressive Delivery Platform

![ReleaseForge CI](https://github.com/PROTIKPATRA/releaseforge/actions/workflows/ci.yaml/badge.svg)

```mermaid
flowchart LR
    Dev[Developer Push] --> CI[GitHub Actions: Vitest + Docker + Trivy]
    CI --> GHCR[GHCR Immutable SHA Image]
    Git[GitOps Repo] --> ArgoCD[Argo CD]
    ArgoCD --> Rollouts[Argo Rollouts: Blue-Green / Canary]
    Rollouts --> K8s[Kubernetes Pods]
    K8s --> Prom[Prometheus + Grafana]
    Prom -->|Success Rate < 95%| Rollouts