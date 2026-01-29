# Migration Guide: MicroK8s → K3s
# For prototype_engV3 thesis project

## Prerequisites
- 2 VMs with Ubuntu 20.04/22.04
- Same network setup (Host-Only + NAT)
- Master: 192.168.56.101
- Worker: 192.168.56.102

## Step 1: Backup Current State

### On Master (MicroK8s)
```bash
# Export all manifests
mkdir -p ~/backup-microk8s
kubectl get all -n jelita-system -o yaml > ~/backup-microk8s/all-resources.yaml
kubectl get configmap -n jelita-system -o yaml > ~/backup-microk8s/configmaps.yaml
kubectl get secret -n jelita-system -o yaml > ~/backup-microk8s/secrets.yaml
kubectl get pvc -n jelita-system -o yaml > ~/backup-microk8s/pvc.yaml

# Backup database (if using PVC)
kubectl exec -it mysql-0 -n jelita-system -- mysqldump -u root -proot jelita_db > ~/backup-microk8s/jelita_db.sql
```

## Step 2: Remove MicroK8s (Both Nodes)

```bash
# Stop services
microk8s stop

# Uninstall
sudo snap remove microk8s --purge

# Clean up
sudo rm -rf /var/snap/microk8s
sudo rm -rf ~/.kube
```

## Step 3: Install K3s

### On Master (192.168.56.101)
```bash
# Install K3s master with specific bind address
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--bind-address=192.168.56.101 --advertise-address=192.168.56.101 --node-ip=192.168.56.101" sh -

# Wait for node to be ready
sudo k3s kubectl get nodes

# Get join token
sudo cat /var/lib/rancher/k3s/server/node-token

# Setup kubectl for non-root user
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# Verify
kubectl get nodes
```

### On Worker (192.168.56.102)
```bash
# Join as agent (replace <TOKEN> with actual token from master)
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.56.101:6443 K3S_TOKEN=<TOKEN> INSTALL_K3S_EXEC="--node-ip=192.168.56.102" sh -

# Verify on master
kubectl get nodes
# Should see both master and worker
```

## Step 4: Load Docker Images

K3s uses containerd, similar to MicroK8s but different namespace.

### On Both Nodes
```bash
cd ~/prototype_engV3

# Import images into K3s containerd (k8s.io namespace)
sudo k3s ctr images import user-management.tar
sudo k3s ctr images import registration.tar
sudo k3s ctr images import workflow.tar
sudo k3s ctr images import survey.tar
sudo k3s ctr images import archive.tar
sudo k3s ctr images import api-gateway.tar

# Verify
sudo k3s ctr images ls | grep jelita
```

## Step 5: Update Manifests for K3s

K3s uses different storage class and some annotations.

```bash
cd ~/prototype_engV3/k8s

# Update storage class in mysql-deployment.yaml
sed -i 's/storageClassName: microk8s-hostpath/storageClassName: local-path/g' mysql-deployment.yaml

# K3s already has metrics-server and storage, no need to enable
```

## Step 6: Deploy to K3s

```bash
cd ~/prototype_engV3

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql-deployment.yaml

# Wait for MySQL
kubectl wait --for=condition=ready pod -l app=mysql -n jelita-system --timeout=300s

# Deploy services
kubectl apply -f k8s/user-management-deployment.yaml
kubectl apply -f k8s/registration-deployment.yaml
kubectl apply -f k8s/workflow-deployment.yaml
kubectl apply -f k8s/survey-deployment.yaml
kubectl apply -f k8s/archive-deployment.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/network-policies.yaml

# Initialize database
USER_POD=$(kubectl get pods -n jelita-system -l app=user-management -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $USER_POD -n jelita-system -- node scripts/setupDatabase.js
kubectl exec -it $USER_POD -n jelita-system -- node scripts/seedTestData.js

# Get access URL
MASTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
NODE_PORT=$(kubectl get service api-gateway -n jelita-system -o jsonpath='{.spec.ports[0].nodePort}')
echo "Access URL: http://${MASTER_IP}:${NODE_PORT}"
```

## Step 7: Verify Stability

```bash
# Monitor pods for 5 minutes
watch -n 2 'kubectl get pods -n jelita-system -o wide'

# Check resource usage
watch -n 5 'kubectl top nodes && echo "" && kubectl top pods -n jelita-system'

# Check for restarts
kubectl get pods -n jelita-system -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'
```

## Key Differences

| Feature | MicroK8s | K3s |
|---------|----------|-----|
| **kubectl** | `microk8s kubectl` | `kubectl` (direct) |
| **Image import** | `microk8s ctr image import` | `sudo k3s ctr images import` |
| **Storage class** | `microk8s-hostpath` | `local-path` |
| **Service port** | API on 16443 | API on 6443 |
| **Config location** | `/var/snap/microk8s` | `/etc/rancher/k3s` |

## Troubleshooting K3s

### Agent not joining
```bash
# On master, check if port 6443 is open
sudo netstat -tulpn | grep 6443

# Test from worker
telnet 192.168.56.101 6443

# Check logs on worker
sudo journalctl -u k3s-agent -f
```

### Pods pending (no resources)
```bash
# K3s has lower overhead, but check:
kubectl describe nodes | grep -A 5 "Allocated resources"

# If still tight, reduce pod requests in deployments
```

### Images not found
```bash
# Ensure images imported on correct node
kubectl get pods -n jelita-system -o wide
# Note which node pod is on

# SSH to that node and verify
sudo k3s ctr images ls | grep jelita
```

## Rollback to MicroK8s

If K3s doesn't work:

```bash
# Uninstall K3s
sudo /usr/local/bin/k3s-uninstall.sh  # On master
sudo /usr/local/bin/k3s-agent-uninstall.sh  # On worker

# Reinstall MicroK8s (follow QUICK_START_K8S_TESTING.md)
```

## Performance Comparison

After migration, compare:

```bash
# Memory usage
free -h

# K3s processes
ps aux | grep k3s

# vs MicroK8s (if still installed)
# ps aux | grep microk8s

# Expected: K3s uses ~200-300MB less RAM
```

## Expected Benefits

1. **Lower memory usage**: ~30-40% reduction
2. **Faster pod startup**: ~2-3x faster
3. **More stable**: Fewer OOM kills
4. **Simpler operations**: Direct kubectl access

## Notes for Thesis

Document in jurnal:
- Migration reason (resource constraints)
- Before/after metrics (memory, stability)
- Stability comparison (restart counts)
- Resource efficiency gains

---

**Estimated Migration Time:** 1-2 hours
**Difficulty:** Medium
**Risk:** Low (can rollback)
**Recommended:** Yes, if resource constraints confirmed
