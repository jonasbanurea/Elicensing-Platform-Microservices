# TESTING EXECUTION CHECKLIST

Gunakan checklist ini untuk memastikan semua langkah testing dilakukan dengan benar.

---

## 📋 PHASE 1: INFRASTRUCTURE SETUP

### VM Preparation
- [ ] VM 1 (Master): Ubuntu 24.04.3 LTS installed
  - [ ] 4 CPU cores allocated
  - [ ] 4GB RAM allocated
  - [ ] 40GB storage allocated
  - [ ] Static IP configured: ________________
  
- [ ] VM 2 (Worker): Ubuntu 24.04.3 LTS installed
  - [ ] 2 CPU cores allocated
  - [ ] 4GB RAM allocated
  - [ ] 40GB storage allocated
  - [ ] Static IP configured: ________________

- [ ] Network connectivity verified between VMs
- [ ] SSH access configured from host machine

### MicroK8s Installation - Master Node
- [ ] MicroK8s installed: `sudo snap install microk8s --classic --channel=1.28/stable`
- [ ] User added to microk8s group
- [ ] DNS addon enabled
- [ ] hostpath-storage addon enabled
- [ ] metrics-server addon enabled
- [ ] rbac addon enabled
- [ ] Status verified: `microk8s status --wait-ready`
- [ ] Node visible: `microk8s kubectl get nodes`

### MicroK8s Installation - Worker Node
- [ ] MicroK8s installed on worker
- [ ] User added to microk8s group
- [ ] Status verified

### Cluster Formation
- [ ] Join command generated on master: `microk8s add-node`
- [ ] Join command copied: ________________________________________________
- [ ] Worker joined to cluster
- [ ] Both nodes visible: `microk8s kubectl get nodes`
- [ ] Both nodes in Ready state

### Host Machine Setup
- [ ] kubectl installed
- [ ] kubeconfig obtained from master
- [ ] kubectl can access cluster: `kubectl get nodes`
- [ ] k6 installed
- [ ] Python 3.8+ installed
- [ ] Python packages installed: `pip install pandas numpy scipy statsmodels matplotlib seaborn`
- [ ] Git repository cloned

**Estimated Time:** 2-3 hours  
**Completion Date:** ________________

---

## 📋 PHASE 2: APPLICATION DEPLOYMENT

### Docker Images
- [ ] Images built on master node:
  - [ ] jelita-user-management:latest
  - [ ] jelita-registration:latest
  - [ ] jelita-workflow:latest
  - [ ] jelita-survey:latest
  - [ ] jelita-archive:latest

- [ ] Images transferred to worker node (if not using registry)
- [ ] Images verified on both nodes: `docker images | grep jelita`

### Kubernetes Deployment
- [ ] Namespace created: `kubectl apply -f k8s/namespace.yaml`
- [ ] Namespace verified: `kubectl get namespace jelita-system`

- [ ] MySQL deployed: `kubectl apply -f k8s/mysql-deployment.yaml`
- [ ] MySQL ready: `kubectl wait --for=condition=ready pod -l app=mysql -n jelita-system --timeout=300s`
- [ ] MySQL logs checked (no errors)

- [ ] User Management deployed: `kubectl apply -f k8s/user-management-deployment.yaml`
- [ ] Registration deployed: `kubectl apply -f k8s/registration-deployment.yaml`
- [ ] Workflow deployed: `kubectl apply -f k8s/workflow-deployment.yaml`
- [ ] Survey deployed: `kubectl apply -f k8s/survey-deployment.yaml`
- [ ] Archive deployed: `kubectl apply -f k8s/archive-deployment.yaml`

- [ ] API Gateway deployed: `kubectl apply -f k8s/api-gateway-deployment.yaml`

- [ ] Network policies applied: `kubectl apply -f k8s/network-policies.yaml`

### Verification
- [ ] All pods running: `kubectl get pods -n jelita-system`
- [ ] All services created: `kubectl get services -n jelita-system`
- [ ] All HPAs created: `kubectl get hpa -n jelita-system`
- [ ] Pods distributed across nodes: `kubectl get pods -n jelita-system -o wide`

### Database Initialization
- [ ] User pod identified: `kubectl get pods -n jelita-system -l app=user-management`
- [ ] Setup script executed: `kubectl exec -it <pod-name> -n jelita-system -- node scripts/setupDatabase.js`
- [ ] Seed script executed: `kubectl exec -it <pod-name> -n jelita-system -- node scripts/seedDatabase.js`

### Connectivity Test
- [ ] NodePort retrieved: `kubectl get service api-gateway -n jelita-system`
- [ ] Access URL: http://________________:30000
- [ ] Health check successful: `curl http://<master-ip>:30000/health`
- [ ] Registration endpoint tested (optional)

**Estimated Time:** 2-3 hours  
**Completion Date:** ________________

---

## 📋 PHASE 3: BASELINE TESTING (35 VU)

### Pre-Test Checks
- [ ] All pods running and ready
- [ ] HPA metrics available: `kubectl top pods -n jelita-system`
- [ ] Base URL configured: ________________
- [ ] Test date set: ________________

### Execute Baseline Tests
- [ ] Test results directory exists: `test-results/raw/`
- [ ] Started baseline tests: `.\scripts\run-k8s-tests.ps1 -TestType baseline`
  
**Run Progress (30 iterations):**

| Run | Status | Error Rate | Notes |
|-----|--------|------------|-------|
| 1 | ⬜ | | |
| 2 | ⬜ | | |
| 3 | ⬜ | | |
| 4 | ⬜ | | |
| 5 | ⬜ | | |
| 6 | ⬜ | | |
| 7 | ⬜ | | |
| 8 | ⬜ | | |
| 9 | ⬜ | | |
| 10 | ⬜ | | |
| 11 | ⬜ | | |
| 12 | ⬜ | | |
| 13 | ⬜ | | |
| 14 | ⬜ | | |
| 15 | ⬜ | | |
| 16 | ⬜ | | |
| 17 | ⬜ | | |
| 18 | ⬜ | | |
| 19 | ⬜ | | |
| 20 | ⬜ | | |
| 21 | ⬜ | | |
| 22 | ⬜ | | |
| 23 | ⬜ | | |
| 24 | ⬜ | | |
| 25 | ⬜ | | |
| 26 | ⬜ | | |
| 27 | ⬜ | | |
| 28 | ⬜ | | |
| 29 | ⬜ | | |
| 30 | ⬜ | | |

### Post-Test Verification
- [ ] 30 JSON files created in `test-results/raw/`
- [ ] File naming correct: `k6-microservices-k8s-baseline-run*.json`
- [ ] Files contain valid JSON
- [ ] No major errors (>10% error rate)
- [ ] K8s metrics collected
- [ ] Pod logs saved (if issues occurred)

**Estimated Time:** 7-8 hours  
**Start Time:** ________________  
**Completion Time:** ________________

---

## 📋 PHASE 4: STRESS TESTING (75 VU)

### Pre-Test Checks
- [ ] System recovered from baseline testing (15+ min cool-down)
- [ ] All pods back to normal state
- [ ] HPA scaled down to minimum replicas
- [ ] Database cleaned (if necessary)

### Execute Stress Tests
- [ ] Started stress tests: `.\scripts\run-k8s-tests.ps1 -TestType stress`

**Run Progress (30 iterations):**

| Run | Status | Error Rate | HPA Scaling | Notes |
|-----|--------|------------|-------------|-------|
| 1 | ⬜ | | | |
| 2 | ⬜ | | | |
| 3 | ⬜ | | | |
| 4 | ⬜ | | | |
| 5 | ⬜ | | | |
| 6 | ⬜ | | | |
| 7 | ⬜ | | | |
| 8 | ⬜ | | | |
| 9 | ⬜ | | | |
| 10 | ⬜ | | | |
| 11 | ⬜ | | | |
| 12 | ⬜ | | | |
| 13 | ⬜ | | | |
| 14 | ⬜ | | | |
| 15 | ⬜ | | | |
| 16 | ⬜ | | | |
| 17 | ⬜ | | | |
| 18 | ⬜ | | | |
| 19 | ⬜ | | | |
| 20 | ⬜ | | | |
| 21 | ⬜ | | | |
| 22 | ⬜ | | | |
| 23 | ⬜ | | | |
| 24 | ⬜ | | | |
| 25 | ⬜ | | | |
| 26 | ⬜ | | | |
| 27 | ⬜ | | | |
| 28 | ⬜ | | | |
| 29 | ⬜ | | | |
| 30 | ⬜ | | | |

### Post-Test Verification
- [ ] 30 JSON files created for stress scenario
- [ ] File naming correct: `k6-microservices-k8s-stress-run*.json`
- [ ] Files contain valid JSON
- [ ] Error rate acceptable (<10%)
- [ ] HPA scaling observed and logged
- [ ] K8s metrics collected

**Estimated Time:** 6-7 hours  
**Start Time:** ________________  
**Completion Time:** ________________

---

## 📋 PHASE 5: INTEROPERABILITY TESTING

### Mock OSS-RBA Setup
- [ ] Mock OSS-RBA server running (if applicable)
- [ ] Mock server accessible from host: http://localhost:4000
- [ ] Endpoints responding

### Execute Interoperability Tests
- [ ] Started interop tests: `.\scripts\run-k8s-tests.ps1 -TestType interop`
- [ ] Test completed successfully
- [ ] Results file created: `test-results/interoperability-test-*.json`

### Review Compliance Metrics
- [ ] Conformance rate: ______% (Target: >95%)
- [ ] Security compliance: ______% (Target: >95%)
- [ ] Privacy compliance: ______% (Target: >95%)
- [ ] Governance compliance: ______% (Target: >90%)
- [ ] Audit trail: ______% (Target: >98%)
- [ ] Overall compliance: ______% (Target: >95%)

### Issues Found
- [ ] Security violations: ________ (list if any)
- [ ] Privacy violations: ________ (list if any)
- [ ] Governance violations: ________ (list if any)

**Estimated Time:** 1-2 hours  
**Completion Date:** ________________

---

## 📋 PHASE 6: SOAK TESTING (24 HOURS)

### Pre-Test Preparation
- [ ] System fully recovered
- [ ] Monitoring scripts prepared
- [ ] Alert contacts informed
- [ ] Maintenance window scheduled
- [ ] Backup plan prepared

### Start Soak Test
- [ ] Started soak test: `.\scripts\run-k8s-tests.ps1 -TestType soak`
- [ ] Start time: ________________
- [ ] Expected end: ________________

### Monitoring Checklist (Every 2-4 Hours)

| Time | Pods Status | Error Rate | Response Time | HPA Status | Issues |
|------|-------------|------------|---------------|------------|--------|
| 2h | ⬜ | | | | |
| 4h | ⬜ | | | | |
| 6h | ⬜ | | | | |
| 8h | ⬜ | | | | |
| 10h | ⬜ | | | | |
| 12h | ⬜ | | | | |
| 14h | ⬜ | | | | |
| 16h | ⬜ | | | | |
| 18h | ⬜ | | | | |
| 20h | ⬜ | | | | |
| 22h | ⬜ | | | | |
| 24h | ⬜ | | | | |

### Post-Test Analysis
- [ ] Soak test completed
- [ ] Results file created: `test-results/k8s-soak-test-*.json`
- [ ] Degradation analysis completed
- [ ] Time-series plots generated
- [ ] No significant performance degradation (<10%)
- [ ] No memory leaks detected
- [ ] Error rate remained stable (<5%)

**Estimated Time:** 24+ hours  
**Start Date/Time:** ________________  
**End Date/Time:** ________________

---

## 📋 PHASE 7: STATISTICAL ANALYSIS

### Run Analysis Script
- [ ] All test result files present (60+ files)
- [ ] Analysis script executed: `python scripts/statistical_analysis.py test-results/raw`
- [ ] Script completed without errors

### Verify Outputs
- [ ] `test-results/analysis/raw_metrics.csv` created
- [ ] Comparison CSV files created
- [ ] Statistical report TXT files created
- [ ] Comparison PNG plots created
- [ ] Degradation analysis CSV created
- [ ] Soak test time-series PNG created

### Review Results

**Baseline vs Stress Comparison:**

| Metric | Baseline Mean | Stress Mean | p-value | Cohen's d | Significant? |
|--------|--------------|-------------|---------|-----------|--------------|
| Throughput | | | | | |
| Avg Response Time | | | | | |
| P95 Response Time | | | | | |
| Error Rate | | | | | |

**Effect Size Interpretation:**
- [ ] Throughput: ________________ (negligible/small/medium/large)
- [ ] Response Time: ________________
- [ ] Error Rate: ________________

**Degradation Analysis (Soak Test):**
- [ ] Response time trend slope: ________________ (near 0 = good)
- [ ] Error rate trend: ________________ (stable = good)
- [ ] Percent change: ________________ (<10% = acceptable)

**Estimated Time:** 1-2 hours  
**Completion Date:** ________________

---

## 📋 PHASE 8: DOCUMENTATION & REPORTING

### Collect Evidence
- [ ] K8s cluster screenshots
  - [ ] Node status
  - [ ] Pod distribution
  - [ ] HPA scaling
  - [ ] Resource usage

- [ ] Test result screenshots
  - [ ] K6 summary output
  - [ ] Statistical analysis plots
  - [ ] Compliance metrics
  - [ ] Time-series graphs

- [ ] K8s metrics exports
  - [ ] kubectl top nodes
  - [ ] kubectl top pods
  - [ ] kubectl get hpa
  - [ ] Event logs

### Update Report Template
- [ ] Comprehensive report opened: `test-results/reports/COMPREHENSIVE_TEST_REPORT_*.md`
- [ ] Section 4: Performance results filled in
- [ ] Section 5: Statistical analysis filled in
- [ ] Section 6: Interoperability results filled in
- [ ] Section 7: Soak test results filled in
- [ ] Section 8: Conclusions written

### Create Presentation
- [ ] Slide deck created
- [ ] Multi-node architecture diagram
- [ ] Performance comparison charts
- [ ] Statistical rigor explanation
- [ ] Compliance scorecard
- [ ] Sustainability metrics

### Journal Revision
- [ ] Methods section updated (K8s cluster description)
- [ ] Results section updated (statistical analysis)
- [ ] Discussion section updated (cost-benefit, service boundaries)
- [ ] Tables updated (comparison results)
- [ ] Figures updated (plots, diagrams)
- [ ] References added (if needed)

**Estimated Time:** 4-6 hours  
**Completion Date:** ________________

---

## 📋 PHASE 9: QUALITY ASSURANCE

### Data Validation
- [ ] All 30 baseline runs have valid data
- [ ] All 30 stress runs have valid data
- [ ] No anomalous outliers (or documented)
- [ ] Sample size sufficient (n=30)
- [ ] Confidence intervals calculated
- [ ] Effect sizes interpreted

### Compliance Check
- [ ] All 6 reviewer points addressed
  - [ ] Point #1: Production-grade environment ✅
  - [ ] Point #5: Statistical rigor ✅
  - [ ] Point #4: Security & governance ✅
  - [ ] Point #6: Long-term sustainability ✅
  - [ ] Point #2: Cost-benefit analysis 📝
  - [ ] Point #3: Service boundaries 📝

### Documentation Review
- [ ] All commands documented
- [ ] All issues documented
- [ ] All results interpreted
- [ ] All evidence collected
- [ ] All screenshots annotated

### Reproducibility Check
- [ ] Testing procedure clearly documented
- [ ] Scripts provided and tested
- [ ] Configuration files included
- [ ] Environment specifications documented

**Completion Date:** ________________

---

## 📋 PHASE 10: FINAL SUBMISSION

### Journal Preparation
- [ ] Revised manuscript ready
- [ ] All evidence attached
- [ ] Response to reviewers drafted
- [ ] Co-authors reviewed
- [ ] Final proofreading done

### Submission
- [ ] Manuscript submitted
- [ ] Submission date: ________________
- [ ] Submission ID: ________________

---

## ✅ COMPLETION SUMMARY

**Total Testing Time:** ________________ hours  
**Total Files Generated:** ________________  
**Issues Encountered:** ________________  
**Final Status:** ⬜ Complete / ⬜ Partial / ⬜ Issues

**Key Findings:**
1. ________________________________________________________________________
2. ________________________________________________________________________
3. ________________________________________________________________________

**Recommendations for Future Work:**
1. ________________________________________________________________________
2. ________________________________________________________________________
3. ________________________________________________________________________

**Notes:**
________________________________________________________________________
________________________________________________________________________
________________________________________________________________________

---

**Completed By:** ________________  
**Date:** ________________  
**Signature:** ________________
