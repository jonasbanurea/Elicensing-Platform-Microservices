# Kubernetes Deployment Manifests

This directory contains Kubernetes manifests for deploying the JELITA e-licensing microservices system on a multi-node cluster.

## Architecture

- **Master Node:** 4 CPU, 4GB RAM (control plane + workload)
- **Worker Node:** 2 CPU, 4GB RAM (workload)
- **Services:** 6 microservices + API Gateway + MySQL
- **Scaling:** HPA-enabled with resource limits
- **Security:** Network policies for service isolation

## Prerequisites

- MicroK8s 1.28+ installed on both nodes
- Worker joined to Master
- Enabled addons: dns, hostpath-storage, metrics-server, rbac
- kubectl configured to access the cluster

## Deployment Order

### 1. Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. MySQL Database
```bash
kubectl apply -f mysql-deployment.yaml
kubectl wait --for=condition=ready pod -l app=mysql -n jelita-system --timeout=300s
```

### 3. Microservices
```bash
kubectl apply -f user-management-deployment.yaml
kubectl apply -f registration-deployment.yaml
kubectl apply -f workflow-deployment.yaml
kubectl apply -f survey-deployment.yaml
kubectl apply -f archive-deployment.yaml
```

### 4. API Gateway
```bash
kubectl apply -f api-gateway-deployment.yaml
```

### 5. Network Policies
```bash
kubectl apply -f network-policies.yaml
```

## Resource Allocation

| Service | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit | HPA Max |
|---------|----------|-------------|-----------|----------------|--------------|---------|
| MySQL | 1 | 500m | 1000m | 1Gi | 2Gi | - |
| User Management | 2 | 200m | 500m | 256Mi | 512Mi | 5 |
| Registration | 3 | 250m | 600m | 256Mi | 512Mi | 8 |
| Workflow | 3 | 250m | 600m | 256Mi | 512Mi | 8 |
| Survey | 2 | 100m | 300m | 128Mi | 256Mi | 4 |
| Archive | 2 | 100m | 300m | 128Mi | 256Mi | 4 |
| API Gateway | 2 | 100m | 300m | 128Mi | 256Mi | 4 |

**Total Requests:** ~6.4 CPU, ~7.75 GB RAM  
**Cluster Capacity:** 6 CPU, 8 GB RAM

## HPA Configuration

All services (except MySQL) have HPA enabled:

- **Scale Up:** When CPU > 70% or Memory > 80%
- **Scale Down:** After 5 minutes stabilization
- **Behavior:** 
  - Scale up: 100% increase per 30s (fast response)
  - Scale down: 50% decrease per 60s (gradual)

## Network Policies

- **Default Deny All:** All traffic blocked by default
- **API Gateway:** Can accept external traffic, forward to backend
- **Backend Services:** Can communicate with each other and MySQL
- **MySQL:** Only accepts connections from backend services
- **DNS:** All pods can access DNS

## Health Checks

All services have:

- **Liveness Probe:** Ensures container is running
  - Initial delay: 30s
  - Period: 10s
  - Timeout: 5s
  
- **Readiness Probe:** Ensures service is ready for traffic
  - Initial delay: 10s
  - Period: 5s
  - Timeout: 3s

## Pod Anti-Affinity

Services use `preferredDuringSchedulingIgnoredDuringExecution` to distribute pods across nodes for better fault tolerance.

## Access

**NodePort Service (api-gateway):** Port 30000

```bash
# Get access URL
MASTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Access URL: http://${MASTER_IP}:30000"
```

## Verification Commands

```bash
# Check all resources
kubectl get all -n jelita-system

# Check pods distribution
kubectl get pods -n jelita-system -o wide

# Check HPA status
kubectl get hpa -n jelita-system

# Check resource usage
kubectl top pods -n jelita-system
kubectl top nodes

# Check network policies
kubectl get networkpolicies -n jelita-system

# Check service endpoints
kubectl get endpoints -n jelita-system
```

## Monitoring

```bash
# Watch pods
watch -n 2 'kubectl get pods -n jelita-system -o wide'

# Watch HPA
watch -n 5 'kubectl get hpa -n jelita-system'

# Watch resource usage
watch -n 10 'kubectl top pods -n jelita-system'
```

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n jelita-system
kubectl logs <pod-name> -n jelita-system
```

**Common Issues:**
- `ImagePullBackOff`: Image not available on node
- `CrashLoopBackOff`: Application error
- `Pending`: Insufficient resources

### HPA Not Scaling

```bash
kubectl describe hpa <hpa-name> -n jelita-system

# Check metrics-server
kubectl top pods -n jelita-system

# If not working, enable:
microk8s enable metrics-server
```

### Network Issues

```bash
# Test pod-to-pod connectivity
kubectl exec -it <pod-name> -n jelita-system -- curl http://mysql:3306

# Temporarily disable network policies
kubectl delete networkpolicy --all -n jelita-system

# Re-apply after testing
kubectl apply -f network-policies.yaml
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace jelita-system

# Or delete individual resources
kubectl delete -f .
```

## Notes

- MySQL uses PersistentVolumeClaim with `microk8s-hostpath` storage class
- All services share the same JWT secret (for testing only)
- Database credentials are hardcoded (use Secrets in production)
- Images use `imagePullPolicy: Never` (for local testing)

## For Production

Consider these improvements:

1. **Secrets Management:** Use Kubernetes Secrets or external vault
2. **Image Registry:** Use private registry instead of local images
3. **TLS/SSL:** Enable HTTPS with cert-manager
4. **Persistent Storage:** Use proper storage class with backup
5. **Monitoring:** Add Prometheus + Grafana
6. **Logging:** Centralized logging with ELK/Loki
7. **Service Mesh:** Consider Istio for advanced traffic management
8. **Backup:** Regular database backups
9. **High Availability:** Multi-replica MySQL with replication
10. **Resource Quotas:** Limit namespace resource consumption

## Testing

This setup is designed for:

- **Baseline Load:** 35 virtual users
- **Stress Load:** 75 virtual users
- **Soak Test:** 24+ hours stability
- **Interoperability:** OSS-RBA/SPBE compliance

See [PANDUAN_TESTING_KOMPREHENSIF_K8S.md](../docs/PANDUAN_TESTING_KOMPREHENSIF_K8S.md) for full testing guide.
