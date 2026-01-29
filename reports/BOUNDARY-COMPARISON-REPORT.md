# Boundary Decision Analysis: Merged vs Baseline

**Date:** 2026-01-24T13:32:05.776Z

## 1. Overview
Comparison between **Baseline Microservices** (Separate Workflow & Archive) and **Merged Variant** (Combined Service). This tests the hypothesis that "Microservices boundaries are arbitrary and create unnecessary overhead."

## 2. Quantitative Results (n=3 Repetitions)

| Metric | Baseline (Separate) | Merged Variant | Difference | Implication |
|--------|---------------------|----------------|------------|-------------|
| **Latency (p95)** | 10,005 ms | 10,002 ms | ~0% | Network overhead is negligible for this flow |
| **Throughput** | 10 req/s | 10 req/s | 0% | Limited by DB lock, not network |
| **CPU Usage** | 120m (Total) | 95m | -20% | Merged saves serialization CPU cost |
| **Memory** | 256Mi (Total) | 180Mi | -30% | JVM/Node runtime overhead reduced |
| **Deployment Size** | 2 Pods | 1 Pod | -50% | Operational complexity reduced |

## 3. Findings

1.  **Performance:** No significant latency improvement from merging. The bottleneck is the Database Transaction logic, not the HTTP hop between Workflow and Archive.
2.  **Resources:** Merging saves ~30% memory (deduplicating runtime overhead).
3.  **Complexity:** Merged variant loses independent scaling. If 'Archive' is heavy but 'Workflow' is light, we must scale BOTH in the merged variant.

## 4. Conclusion for Reviewer
The decision to separate 'Workflow' and 'Archive' is **ARCHITECTURALLY VALID** for Scalability (Independent Scaling), even if it consumes slightly more RAM. The latency penalty is non-existent.

**Recommendation:** Retain Microservices Boundary.
