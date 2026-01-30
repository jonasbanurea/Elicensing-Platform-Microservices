#!/bin/bash
# enable-secrets-encryption.sh
# Run on K3s Master (192.168.56.101)

CONFIG_FILE="/etc/rancher/k3s/config.yaml"

echo "==========================================="
echo "ENABLING K3S SECRETS ENCRYPTION"
echo "==========================================="

# 1. Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Creating empty $CONFIG_FILE..."
    sudo mkdir -p /etc/rancher/k3s
    sudo touch "$CONFIG_FILE"
fi

# 2. Add secrets-encryption: true if not present
if grep -q "secrets-encryption: true" "$CONFIG_FILE"; then
    echo "Configuration already present in $CONFIG_FILE."
else
    echo "Adding 'secrets-encryption: true' to $CONFIG_FILE..."
    echo "secrets-encryption: true" | sudo tee -a "$CONFIG_FILE"
fi

# 3. Restart K3s
echo "Restarting K3s service..."
sudo systemctl restart k3s

# 4. Wait for K3s to be up
echo "Waiting for K3s to stabilize (15s)..."
rest=15
while [ $rest -gt 0 ]; do
    echo -ne " $rest\033[0K\r"
    sleep 1
    ((rest--))
done
echo ""

# 5. Verify
echo "==========================================="
echo "VERIFICATION"
echo "==========================================="
echo "Checking process args..."
ps aux | grep k3s | grep secrets-encryption

echo "Checking for encryption-config.json..."
ls -l /var/lib/rancher/k3s/server/cred/encryption-config.json

echo "==========================================="
echo "DONE. Encryption at Rest (Secrets) Enabled."
