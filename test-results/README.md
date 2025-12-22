# Test Results Directory

This directory contains raw test data and artifacts from comprehensive testing validation.

## 📊 Data Format

### ✅ Included Files (Pushed to GitHub)
- **`metrics.zip`** - Compressed CSV metrics from k6 tests (~1-34 MB per file)
- **`summary.txt`** - Test execution summary with key metrics
- **`failures.txt`** - Failure details (if any occurred)
- **Test metadata** - Configuration and timestamps

### ❌ Excluded Files (Gitignored)
- **`metrics.csv`** - Raw uncompressed metrics (replaced by metrics.zip)
- **`*.json`** - Raw k6 JSON output (regenerable from scripts)
- **`*.html`** - HTML reports (regenerable from JSON)

## 📁 Directory Structure

```
test-results/
├── 2025-12-20/              # Initial comparison tests
│   ├── microservices/
│   │   ├── baseline/        # 35 VU × 10 min
│   │   │   ├── metrics.zip  # Compressed test data
│   │   │   ├── summary.txt  # Test summary
│   │   │   └── failures.txt # Any failures
│   │   ├── baseline_r1/     # Run 1 (repetition)
│   │   ├── baseline_r2/     # Run 2
│   │   ├── baseline_r3/     # Run 3
│   │   ├── stress/          # 75 VU × 8 min
│   │   ├── stress_r1/
│   │   ├── stress_r2/
│   │   └── stress_r3/
│   └── monolith/
│       ├── baseline/
│       ├── baseline_r1/
│       ├── baseline_r2/
│       ├── baseline_r3/
│       ├── stress/
│       ├── stress_r1/
│       ├── stress_r2/
│       └── stress_r3/
│
└── 2025-12-21/              # Scale-out and soak tests
    ├── microservices-scaled/
    │   ├── stress/          # Scale-out stress test
    │   ├── soak-baseline/   # 4 hours × 35 VU (33 MB)
    │   └── soak-stress/     # 1 hour × 75 VU (16 MB)
    └── monolith/
        ├── soak-baseline/   # 4 hours × 35 VU (24 MB)
        └── soak-stress/     # 1 hour × 75 VU (11 MB)
```

## 📈 Test Scenarios

### Phase 1: Initial Comparison (Dec 20)
- **Baseline**: 35 VU, 10 minutes (3× repetition)
- **Stress**: 75 VU, 8 minutes (3× repetition)
- **Purpose**: Statistical validity through repetition

### Phase 2: Scale-Out Implementation (Dec 21)
- **Stress**: 75 VU, 8 minutes with horizontal scaling
- **Purpose**: Validate bottleneck resolution

### Phase 3: Soak Testing (Dec 21)
- **Soak-Baseline**: 35 VU, 4 hours
- **Soak-Stress**: 75 VU, 1 hour
- **Purpose**: Long-duration stability validation

## 💾 File Sizes

| Test Type | Architecture | Duration | Compressed Size |
|-----------|--------------|----------|-----------------|
| Baseline | Monolith | 10 min | ~960 KB |
| Baseline | Microservices | 10 min | ~1.2 MB |
| Stress | Monolith | 8 min | ~1.3 MB |
| Stress | Microservices | 8 min | ~1.4 MB |
| Scale-Out Stress | Microservices | 8 min | ~1.9 MB |
| Soak-Baseline | Monolith | 4 hours | **23.5 MB** |
| Soak-Baseline | Microservices | 4 hours | **32.8 MB** |
| Soak-Stress | Monolith | 1 hour | **10.6 MB** |
| Soak-Stress | Microservices | 1 hour | **15.5 MB** |

**Total**: 103.25 MB (21 files, all under 50 MB each)

## 🔍 Using Test Data

### Extract Metrics
```powershell
# Extract specific test
Expand-Archive test-results/2025-12-21/microservices-scaled/stress/metrics.zip -DestinationPath ./extracted/

# View extracted CSV
Import-Csv ./extracted/metrics.csv | Select-Object -First 10
```

### Analyze with k6
```bash
# Regenerate HTML report from metrics
k6 run --out csv=metrics.csv loadtest/k6/stress-test.js
```

### Import to Analysis Tools
- **Excel/Google Sheets**: Import CSV for charts
- **Python/R**: Use pandas/data.table for statistical analysis
- **Grafana**: Import metrics for visualization

## 📊 Metrics Included

Each `metrics.zip` contains CSV with:
- `metric_name` - k6 metric type (http_req_duration, iterations, etc.)
- `timestamp` - Unix timestamp
- `metric_value` - Measured value
- `tags` - Request tags (method, status, name, etc.)

### Key Metrics:
- **http_req_duration**: Request latency (p50, p95, p99)
- **http_req_failed**: Request failure rate
- **iterations**: Completed test iterations
- **vus**: Active virtual users
- **http_reqs**: Total HTTP requests

## 🔬 Research Use

This test data supports:
- **Statistical Analysis**: 3× repetition for mean/std deviation
- **Performance Comparison**: Monolith vs microservices quantitative evidence
- **Long-Duration Validation**: Soak tests for stability analysis
- **Reproducibility**: Raw data available for verification

## 📝 Notes

1. **Compression**: ZIP format reduces size by ~90% (vs raw CSV)
2. **GitHub Limits**: All files under 100 MB per file limit
3. **Regenerable**: JSON/HTML excluded as they can be regenerated from k6 scripts
4. **Completeness**: All test runs included (no cherry-picking)

## 🔗 Related Documentation

- [Scalability Testing Report](../reports/scalability-testing-report-comprehensive.md)
- [VU Selection Methodology](../Report-baseline-stress-user-count-jelita.md)
- [Test Execution Guide](../TESTING_EXECUTION_GUIDE.md)

---

**Last Updated**: December 22, 2025  
**Data Collection Period**: December 20-21, 2025  
**Total Test Duration**: 22+ hours  
**Total Test Runs**: 20 individual executions
