#!/bin/bash
# verify-encryption-vm.sh
# Run this on the K3s Master Node (192.168.56.101) to verify Encryption-at-Rest

echo "======================================================="
echo "VERIFICATION 1: STORAGE / DISK ENCRYPTION"
echo "======================================================="
echo "Checking block devices for crypto/LUKS..."
lsblk -f
echo ""
echo "Checking block IDs..."
sudo blkid
echo ""
echo "Checking device mapper status..."
sudo dmsetup ls 2>/dev/null || echo "dmsetup not found or no mapped devices"

echo ""
echo "======================================================="
echo "VERIFICATION 2: DATABASE LAYER (MySQL)"
echo "======================================================="
# Locate MySQL Container ID in containerd
CTR_ID=$(sudo k3s crictl ps --name mysql --state Running -q | head -n 1)

if [ -z "$CTR_ID" ]; then
    echo "ERROR: MySQL Container NOT FOUND. Ensure pod is Running."
else
    echo "Found MySQL Container ID: $CTR_ID"
    echo "Querying Encryption Variables..."
    # Using the known root password from previous steps
    sudo k3s crictl exec $CTR_ID mysql -u root -pJelitaMySQL2024 -e "SHOW VARIABLES LIKE '%encrypt%'; SHOW PLUGINS;" 2>/dev/null
fi

echo ""
echo "======================================================="
echo "VERIFICATION 3: K3S SECRETS ENCRYPTION"
echo "======================================================="
echo "Checking K3s process arguments for --secrets-encryption..."
ps aux | grep k3s | grep '\-\-secrets-encryption' || echo "Result: Flag --secrets-encryption NOT FOUND"
echo ""
echo "Checking for encryption-config.json..."
if [ -f "/var/lib/rancher/k3s/server/cred/encryption-config.json" ]; then
    echo "Result: encryption-config.json FOUND."
    ls -l /var/lib/rancher/k3s/server/cred/encryption-config.json
else
    echo "Result: encryption-config.json NOT FOUND."
fi

echo ""
echo "======================================================="
echo "VERIFICATION 4: BACKUPS"
echo "======================================================="
echo "Searching for 'backup' files in /var/lib/rancher..."
sudo find /var/lib/rancher -name "*backup*" -type f | head -n 10

echo ""
echo "======================================================="
echo "VERIFICATION COMPLETE"
