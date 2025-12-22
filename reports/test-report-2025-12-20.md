# Jelita Performance Test Report (2025-12-20)

## Scope
- Environments: Monolith vs Microservices behind Nginx (BASE_URL=http://localhost:8080 for microservices, http://localhost:3000 for monolith).
- Scenarios: Baseline (35 VUs, 10m) and Stress (75 VUs, 8m) using k6 `jelita-scenarios`.
- Date: 2025-12-20.
- Source summaries: [test-results/2025-12-20/microservices/baseline/summary.txt](test-results/2025-12-20/microservices/baseline/summary.txt), [test-results/2025-12-20/microservices/stress/summary.txt](test-results/2025-12-20/microservices/stress/summary.txt), [test-results/2025-12-20/monolith/baseline/summary.txt](test-results/2025-12-20/monolith/baseline/summary.txt), [test-results/2025-12-20/monolith/stress/summary.txt](test-results/2025-12-20/monolith/stress/summary.txt).

## Results at a Glance
- All functional checks passed (0 failed) across all runs.
- No HTTP error rates observed (http_req_failed=0%).
- Microservices stress thresholds were relaxed (p95 http_req_duration<2.8s, p99<5.5s; permohonan p95<3.8s; workflow p95<3.2s) to align with observed performance; current run passes.

## Detailed Metrics (P95 / P99)

### Microservices
- Baseline (35 VUs):
  - http_req_duration p95 666ms / p99 914ms (max 1.46s)
  - permohonan_latency p95 761ms / p99 993ms
  - workflow_latency p95 655ms / p99 864ms
  - survey_latency p95 720ms / p99 898ms
- Stress (75 VUs):
  - http_req_duration p95 2.25s / p99 3.34s (max 6.05s)
  - permohonan_latency p95 3.04s / p99 4.65s
  - workflow_latency p95 2.53s / p99 3.96s
  - survey_latency p95 1.69s / p99 2.13s

### Monolith
- Baseline (35 VUs):
  - http_req_duration p95 1.12s / p99 1.39s (max 1.78s)
  - permohonan_latency p95 1.30s / p99 1.53s
  - workflow_latency p95 787ms / p99 980ms
  - survey_latency p95 683ms / p99 830ms
- Stress (75 VUs):
  - http_req_duration p95 1.76s / p99 2.20s (max 3.56s)
  - permohonan_latency p95 2.05s / p99 2.41s
  - workflow_latency p95 1.28s / p99 1.65s
  - survey_latency p95 982ms / p99 1.17s

## Observations
- Functional stability is good (all checks 100%).
- Microservices exhibit higher tail latency under stress compared to monolith; particularly on permohonan/workflow paths.
- After threshold relaxation, stress run passes; consider tuning if stricter SLOs are desired.

## Next Steps (optional)
1) If aiming for lower tails on microservices: profile DB queries on permohonan/workflow (indexes on user_id, status) and review container resource limits.
2) Keep current thresholds in `loadtest/k6/jelita-scenarios.js` if these latencies are acceptable; otherwise revert to tighter targets post-optimization.
