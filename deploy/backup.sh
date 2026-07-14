#!/usr/bin/env bash

# =========================================================================
# CELCOM ERP PRO - AUTOMATED POSTGRESQL BACKUP ENGINE
# Optimized for Crontab Scheduler Execution on Ubuntu Server 24.04
# =========================================================================

# Strict bash runtime configuration
set -euo pipefail

# Configuration Parameters
CONTAINER_NAME="celcom_erp_db"
DATABASE_USER="postgres"
DATABASE_NAME="celcom_erp"
BACKUP_DIR="/opt/celcom-erp-pro/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="celcom_erp_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
LOG_FILE="/var/log/celcom_backup.log"

# Setup directory and logging
mkdir -p "${BACKUP_DIR}"
touch "${LOG_FILE}"

log() {
    local message="$1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}" | tee -a "${LOG_FILE}"
}

error_handler() {
    log "CRITICAL ERROR: Database backup operation aborted at line $1"
    # Placeholder: Notify sysadmin (e.g., using curl to Slack/PagerDuty webhook)
    # curl -X POST -H 'Content-type: application/json' --data '{"text":"🚨 CELCOM ERP DB BACKUP FAILED!"}' https://hooks.slack.com/services/...
}

trap 'error_handler $LINENO' ERR

log "Starting database backup sequence..."

# Verify Docker container state
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running."
    exit 1
fi

log "Executing pg_dump inside database container..."

# Execute pg_dump, pipe to gzip, write to target folder
docker exec "${CONTAINER_NAME}" pg_dump -U "${DATABASE_USER}" -d "${DATABASE_NAME}" -F c | gzip -9 > "${BACKUP_PATH}"

# Verify backup success
if [ -f "${BACKUP_PATH}" ] && [ -s "${BACKUP_PATH}" ]; then
    FILE_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_FILENAME} (Size: ${FILE_SIZE})"
else
    log "ERROR: Backup file was not created or is empty!"
    exit 1
fi

# Run retention/purge policies
log "Enforcing database retention policy (Purging backups older than ${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "celcom_erp_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)

if [ "${DELETED_COUNT}" -gt 0 ]; then
    log "Purged ${DELETED_COUNT} legacy backup file(s) successfully."
else
    log "No legacy backup files reached expiration criteria."
fi

log "Backup sequence completed successfully."
exit 0
