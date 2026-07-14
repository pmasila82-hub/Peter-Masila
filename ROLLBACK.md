# CELCOM ERP PRO - SYSTEM ROLLBACK PROCEDURES
These procedures must be followed step-by-step to revert the production system to a stable state in the event of a critical deployment failure.

---

## 1. Scenario 1: Quick Code Rollback (Minor Application Crash)

If the database schema has not changed, but the application is crashing or exhibiting regressions:

### 1.1 Pull Previous Stable Release Tag
Identify the last known stable Git commit hash or deployment tag:
```bash
git log --oneline -n 10
```

Revert the working directory (replace `[STABLE_COMMIT_HASH]` with the verified commit ID):
```bash
git checkout [STABLE_COMMIT_HASH]
```

### 1.2 Rebuild and Reboot App Container
Force rebuild and launch the application under the previous code version:
```bash
docker compose up -d --build app
```

### 1.3 Verify Application Stability
Verify that the server is responding to local health checks:
```bash
curl -f http://127.0.0.1:3000/api/health
```

---

## 2. Scenario 2: Full Stack Rollback (Code, Schema, and Database Snapshot)

If a deployment introduced breaking database migrations or data corruption and a full state restoration is required:

### 2.1 Stop Ingress Traffic (Nginx Maintenance Mode)
Prevent further data from being written while rollback executes:
```bash
# Copy placeholder maintenance file or simply stop Nginx
sudo systemctl stop nginx
```

### 2.2 Revert Codebase Context
Checkout the previous stable version in Git:
```bash
git checkout [STABLE_COMMIT_HASH]
```

### 2.3 Stop Active Containers and Purge Stale Volumes
Clean the Docker context to prevent stale state remnants:
```bash
docker compose down -v
```

### 2.4 Re-bootstrap Core Containers
Spin up the base database and app containers from scratch:
```bash
docker compose up -d db app
```
Wait approximately 10 seconds for the PostgreSQL engine to complete boot cycles.

### 2.5 Reconstruct Schema Topology
Re-apply the database structure from the stable branch schema definition:
```bash
docker compose exec -T app npx prisma db push --force-reset
```

### 2.6 Restore the Database Snapshot from Last Night
Identify the latest healthy, compressed SQL dump in `/opt/celcom-erp-pro/backups/`:
```bash
ls -lt /opt/celcom-erp-pro/backups/
```

Assuming the selected target backup file is `celcom_erp_backup_20260713_020000.sql.gz`:

1. Uncompress the SQL file:
   ```bash
   gunzip -c /opt/celcom-erp-pro/backups/celcom_erp_backup_20260713_020000.sql.gz > /tmp/restore.sql
   ```
2. Stream the SQL commands directly into the active PostgreSQL container instance:
   ```bash
   docker exec -i celcom_erp_db psql -U postgres -d celcom_erp < /tmp/restore.sql
   ```
3. Purge the raw temporary SQL file to secure user records:
   ```bash
   rm -f /tmp/restore.sql
   ```

### 2.7 Restart the Application Containers
Reboot the Express app container so it reconnects with the restored database:
```bash
docker compose restart app
```

### 2.8 Resume Public Ingress Traffic (Start Nginx)
```bash
sudo systemctl start nginx
```

---

## 3. Post-Rollback Auditing Checklists

Once rollback is complete, execute these checks to verify functional status:

| Service | Test Command | Expected Result |
| :--- | :--- | :--- |
| **Ingress Gate** | `curl -Iv https://erp.celcomnetworks.co.ke/health` | HTTP `200 OK` + `{"status":"ok"}`. |
| **Auth Gateway** | Log in via staff email with corporate credentials | Successful token grant and redirection. |
| **Data Integrity** | Run manual SELECT count check on key schemas | Record counts match expected snapshot state. |
| **Log Status** | `docker compose logs -f app` | Clean log output with no SQL errors. |
