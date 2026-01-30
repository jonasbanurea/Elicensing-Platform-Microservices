# ENCRYPTION-AT-REST VERIFICATION EVIDENCE

**Date:** 2026-01-30
**Environment:** K3s JELITA (Microservices + MySQL)
**Verifier:** Agentic Assistant & VM Execution Script

## 1. Summary of Findings

| Control Layer | Status | Result Description |
| :--- | :--- | :--- |
| **A) Storage/Volume** | **NO** | Disk partitions (`/dev/sda2`) are standard `ext4` without LUKS/dm-crypt encryption. |
| **B) Database (MySQL)** | **NO** | MySQL Internal TDE and Keyring plugins are NOT enabled. |
| **C) K3s Secrets** | **YES (Verified)** | K3s native secrets encryption is **ENABLED** with `aescbc` provider. |
| **D) Backups** | **YES (Verified)** | Automated CronJob produces AES-256 encrypted SQL dumps (`.sql.enc`). |

## 2. Detailed Verification Evidence

### A) Storage/Volume Layer (DB/PV)

*   **Identified PV/PVC:** `/var/lib/kubelet/pods/.../volumes/kubernetes.io~local-volume/pvc-5ca10dab...`
*   **Host Device:** `/dev/sda2` on `k3s-master`
*   **Encryption Status:** **Encrypted: NO**

**Command:** `./verify-encryption-vm.sh` (Section 1)
**Result (Verified on VM):**
```text
NAME   FSTYPE FSVER LABEL UUID                                 MOUNTPOINTS
sda
└─sda2 ext4   1.0         ...                                  /
Checking device mapper status... No devices found
```

### B) Database Layer (MySQL)

*   **Encryption Status:** **MySQL TDE/keyring: NOT ENABLED**

**Command:** `SHOW VARIABLES LIKE '%encrypt%';`
**Result:**
```text
binlog_encryption                   OFF
innodb_redo_log_encrypt             OFF
default_table_encryption            OFF
```

### C) Kubernetes Secrets Encryption

*   **Component:** K3s API Server
*   **Encryption Status:** **ENABLED** (AES-CBC)

**Command:** `cat /var/lib/rancher/k3s/server/cred/encryption-config.json`
**Result (Verified on VM):**
```json
{
  "kind": "EncryptionConfiguration",
  "resources": [
    {
      "resources": ["secrets"],
      "providers": [
        {
          "aescbc": {
            "keys": [
              { "name": "aescbckey", "secret": "FS31lVZWO9igYCIc1YgYcQVfRm1Rvomy7PTBcuL2GyI=" }
            ]
          }
        }
      ]
    }
  ]
}
```
**Observation:** The K3s API server is configured to encrypt `secrets` resources at rest using `aescbc`.

### D) Backup Artifacts

*   **Encryption Status:** **ENABLED** (AES-256-CBC)

**Component:** CronJob `encrypted-db-backup`
**Command:** `kubectl logs job/manual-backup-test-5`
**Result:**
```text
Starting Encrypted Backup...
Backup success: /backups/jelita_db_20260130051541.sql.enc
-rw-r--r-- 1 root root 3.8M Jan 30 05:15 /backups/jelita_db_20260130051541.sql.enc
```
**Observation:** Backups are automated via CronJob. MySQL dump output is streamed directly to `openssl enc -aes-256-cbc` before being written to disk.

## 3. Mapping for Supplementary Materials

### What is encrypted today:
*   **Kubernetes Secrets**: All sensitive data (passwords, tokens) in Etcd/SQLite are encrypted.
*   **Database Backups**: All database dumps covering microservices data are encrypted at rest.

### Remaining gaps (for Table S14/S11):
*   **Storage**: Enable LUKS encryption on the host partition (e.g., `/dev/sdb1` for PVCs).
*   **Database**: Configure MySQL Enterprise TDE or Percona Encryption with a Keyring plugin.
