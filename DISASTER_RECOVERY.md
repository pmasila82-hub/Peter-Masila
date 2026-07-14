# CELCOM ERP PRO - DISASTER RECOVERY & INCIDENT PLAYBOOK
**Classification:** Confidential - Internal Administration Use Only  
**Purpose:** Concrete step-by-step procedures to recover from severe operational failures, database corruption, hardware termination, or network routing blackouts.

---

## 1. Disaster Recovery Objectives (SLA Metrics)

*   **Recovery Point Objective (RPO):** Maximum of 24 hours (governed by the daily night automated backup cron).
*   **Recovery Time Objective (RTO):** Under 30 minutes (governed by automated server-reconstruction scripts).

---

## 2. Emergency Escalation Directory

In the event of an unscheduled system outage lasting over 5 minutes:

1.  **Lead DevOps / System Administrator:** `devops@celcomnetworks.co.ke`
2.  **Database Administrator (DBA):** `dba@celcomnetworks.co.ke`
3.  **Head of IT Operations:** `it-ops@celcomnetworks.co.ke`

---

## 3. Incident Playbook: Actionable Scenarios

### 3.1 Scenario A: Primary Server Termination / Hardware Outage
**Issue:** VPS instance is terminated, deleted, or uncontactable due to physical cloud hardware failure.

**Recovery Protocol (Bare-Metal Reconstruction):**

1.  **Provision a New Ubuntu Server 24.04 LTS instance.**
    *   Ensure CPU (>= 2 Cores) and RAM (>= 4GB) match the minimum performance guidelines.
2.  **Update Domain DNS Records.**
    *   Map `erp.celcomnetworks.co.ke` A/AAAA records to the new instance public IP address via your domain manager.
3.  **Install Core Prerequisites.**
    *   Log into the new instance via SSH and run:
      ```bash
      sudo apt update && sudo apt install -y curl git certbot python3-certbot-nginx logrotate
      ```
4.  **Install Docker & Docker Compose.**
    *   Follow the exact instructions in **Section 2.3 of DEPLOYMENT.md** to configure the official Docker repositories and engines.
5.  **Clone the Enterprise Codebase.**
    *   Run:
      ```bash
      sudo mkdir -p /opt/celcom-erp-pro
      sudo chown -R $USER:$USER /opt/celcom-erp-pro
      git clone https://github.com/celcomnetworks/celcom-erp-pro.git /opt/celcom-erp-pro
      cd /opt/celcom-erp-pro
      ```
6.  **Reconstruct the Environment Configuration File.**
    *   Create `.env`, setting up the required database passwords, secrets, and JWT access strings:
      ```bash
      nano .env
      chmod 600 .env
      ```
7.  **Deploy Backups onto New Host.**
    *   Retrieve the latest compressed database snapshot from your secure offsite storage (e.g., AWS S3, private NAS, or administrative backup vault) and write it to `/opt/celcom-erp-pro/backups/`.
8.  **Re-Initialize System Stack and Run Database Restore.**
    *   Follow the procedures detailed in **Section 2 of ROLLBACK.md** to clean volume mounts, boot PostgreSQL containers, run Prisma push, and restore the uncompressed SQL snapshot.
9.  **Provision SSL Certificates via Let's Encrypt.**
    *   Execute:
      ```bash
      sudo certbot certonly --standalone -d erp.celcomnetworks.co.ke --agree-tos --email pmasila82@gmail.com
      ```
10. **Install and Configure Nginx.**
    *   Copy `/opt/celcom-erp-pro/deploy/nginx.conf` into `/etc/nginx/nginx.conf`, verify syntax (`nginx -t`), and restart the service (`sudo systemctl restart nginx`).

---

### 3.2 Scenario B: Database Volume Corruption or Mass Unintentional Deletion
**Issue:** The database container runs, but index tables are corrupted, or a technician executed destructive queries (e.g., `DELETE FROM` with missing WHERE clauses).

**Recovery Protocol:**

1.  **Stop Ingress Access Immediately.**
    ```bash
    sudo systemctl stop nginx
    ```
2.  **Purge the Corrupted PostgreSQL Volume.**
    ```bash
    cd /opt/celcom-erp-pro
    docker compose down -v # This purges the corrupted pgdata volume cleanly
    ```
3.  **Rebuild Database Container.**
    ```bash
    docker compose up -d db
    sleep 10 # Allow DB boot cycles
    ```
4.  **Reconstruct the Schema Structure.**
    ```bash
    docker compose run --rm app npx prisma db push --force-reset
    ```
5.  **Inject the Latest Stable Database Snapshot.**
    *   Restore the backup using **Section 2.6 of ROLLBACK.md**.
6.  **Reboot the App Container and Start Nginx.**
    ```bash
    docker compose restart app
    sudo systemctl start nginx
    ```

---

## 4. Offsite Backup Replication Strategy

To protect against physical datacenter destruction, it is critical to replicate nightly backups offsite:

1.  **Configure AWS CLI or Rclone Utility on the Server Host.**
2.  **Edit `deploy/backup.sh`** to include an S3 push command right after successful gzip creation:
    ```bash
    # Example addition inside backup.sh:
    aws s3 cp "${BACKUP_PATH}" "s3://celcom-erp-cold-storage/backups/${BACKUP_FILENAME}"
    ```
3.  **Establish Bucket Lifecycle Rules** on the offsite bucket to transition records to Amazon Glacier deep archive after 30 days for maximum storage cost-efficiency.
