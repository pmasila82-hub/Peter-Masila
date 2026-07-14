# CELCOM ERP PRO - ENTERPRISE PRODUCTION DEPLOYMENT MANUAL
**Target Platform:** Ubuntu Server 24.04 LTS (x86_64 or ARM64)  
**Infrastructure Stack:** Docker / Docker Compose, Nginx (Reverse Proxy with SSL & HTTP/2), PostgreSQL 15, and Let's Encrypt (Certbot).

---

## 1. Production Deployment Topology

```
                  ┌───────────────────────────────────────────────┐
                  │              Public Internet                  │
                  └───────────────────────┬───────────────────────┘
                                          │  HTTPS (443) / HTTP/2
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │              Nginx Reverse Proxy              │
                  │   - TLS v1.2/v1.3    - Security Headers (A+)  │
                  │   - Gzip Engine      - Rate Limiting Zones    │
                  └───────────────────────┬───────────────────────┘
                                          │  Internal Proxy Loopback (3000)
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │           Docker Bridge Network               │
                  │                                               │
                  │  ┌─────────────────┐     ┌─────────────────┐  │
                  │  │ celcom_erp_app  │ ──> │  celcom_erp_db  │  │
                  │  │ (Express Node)  │     │  (PostgreSQL)   │  │
                  │  └─────────────────┘     └─────────────────┘  │
                  └───────────────────────────────────────────────┘
```

---

## 2. Server Provisioning & Prerequisites

Execute these commands to prepare your clean Ubuntu 24.04 LTS server:

### 2.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Core Infrastructure Packages
```bash
sudo apt install -y curl git certbot python3-certbot-nginx logrotate gnupg2 pass
```

### 2.3 Install Docker Engine & Compose Plugin
```bash
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Directory Structures and Code Fetching

### 3.1 Establish the Working Directories
Create a dedicated application repository path under `/opt`:
```bash
sudo mkdir -p /opt/celcom-erp-pro
sudo chown -R $USER:$USER /opt/celcom-erp-pro
cd /opt/celcom-erp-pro
```

### 3.2 Fetch the Active Repository
Clone the production branch directly into the working directory:
```bash
git clone -b main https://github.com/celcomnetworks/celcom-erp-pro.git .
```

---

## 4. Environment and Secrets Setup

Configure production environment variables securely:

1. Copy the production template file to `.env`:
   ```bash
   cp .env.production.example .env
   ```
2. Edit the file with secure passwords and keys:
   ```bash
   nano .env
   ```
3. Set tight permissions on `.env` to prevent unauthorized read access:
   ```bash
   chmod 600 .env
   ```

---

## 5. SSL / TLS Certificate Provisioning

Provision an A+ rated SSL Certificate via Let's Encrypt:

1. Obtain the certificates (substitute with your real domain):
   ```bash
   sudo certbot certonly --standalone -d erp.celcomnetworks.co.ke --agree-tos --email pmasila82@gmail.com
   ```
2. Set up Certbot renewal system-wide (automatically provisions systemd timer):
   ```bash
   sudo systemctl status certbot.timer
   ```
3. Establish a soft link to allow Nginx to read certificate hooks:
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   # Certbot outputs cert files to: /etc/letsencrypt/live/erp.celcomnetworks.co.ke/
   ```

---

## 6. Nginx Reverse Proxy Orchestration

Configure the boundary proxy layer:

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. Copy our tailored configuration to `/etc/nginx/nginx.conf`:
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/nginx.conf
   ```
3. Test Nginx syntactic integrity:
   ```bash
   sudo nginx -t
   ```
4. Start Nginx and ensure it boots on server startup:
   ```bash
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

---

## 7. Container Stack Initialization & Migrations

Launch the Docker Compose services in production mode:

### 7.1 Build and Launch Services
```bash
docker compose up -d --build
```

### 7.2 Run Database Schema Migration
Ensure the database schema matches the design spec. We execute Prisma sync within the app container context:
```bash
docker compose exec -T app npx prisma db push --accept-data-loss
```

---

## 8. Backup and Log Rotation Automation

### 8.1 Automate Database Backups (Cron Job)
1. Make the backup script executable:
   ```bash
   chmod +x deploy/backup.sh
   ```
2. Link the backup log destination:
   ```bash
   sudo touch /var/log/celcom_backup.log
   sudo chmod 640 /var/log/celcom_backup.log
   ```
3. Install the cron job to run every night at 2:00 AM:
   ```bash
   (crontab -l 2>/dev/null; echo "0 2 * * * /bin/bash /opt/celcom-erp-pro/deploy/backup.sh >> /var/log/celcom_backup.log 2>&1") | crontab -
   ```

### 8.2 Log Rotation Configuration
1. Install our rotation directive:
   ```bash
   sudo cp deploy/logrotate.conf /etc/logrotate.d/celcom-erp-pro
   ```
2. Force a test run to ensure logrotate syntax is clean:
   ```bash
   sudo logrotate -d /etc/logrotate.d/celcom-erp-pro
   ```

---

## 9. Verification & Live Health Checks

Verify that the system is fully operational:

1. **Ping Docker Service:**
   ```bash
   docker ps
   ```
2. **Execute Internal HTTP Probe:**
   ```bash
   curl -I http://127.0.0.1:3000/api/health
   ```
   *Expected Response:* `HTTP/1.1 200 OK`
3. **Verify Public Endpoint Resolves Over Secure TLS:**
   ```bash
   curl -Iv https://erp.celcomnetworks.co.ke/health
   ```
   *Expected Outcome:* Verification of valid SSL handshake, TLSv1.3 protocol usage, HTTP/2 multiplexing, and clean JSON payload `{"status":"ok"}`.
