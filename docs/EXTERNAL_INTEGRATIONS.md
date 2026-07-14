# CELCOM ERP PRO — External Integrations Module Documentation

The **External Integrations Module** acts as the communications and provisioning hub for Celcom ERP Pro. It links internal business workflows (such as invoicing, subscriber activation, billing collections, and data backups) to reliable third-party networks and infrastructure gateways.

---

## 1. Architectural Design

The integrations engine is designed on a stateless event-driven architecture coupled to a durable file-based state store (`src/backend/data/integrations_store.json`). This ensures high performance, separation of concerns, and instant recovery during cold starts or container scale-downs on Cloud Run.

### Key Features
- **Secure Keyring**: API credentials, certificates, and access tokens are isolated, masked on UI outputs, and saved with AES/SHA compliance.
- **Asynchronous Scheduler**: A background queue with automated retries and exponential backoff manages bulk notifications, mail dispatches, and infrastructure syncs.
- **Webhook IPN Receivers**: Fast Webhook routes verify, parse, and map external transaction notifications (e.g. Safaricom M-Pesa C2B) directly to double-entry general ledger structures.
- **Diagnostics Monitor**: Real-time ping loops calculate latency, response codes, and uptime SLAs.

---

## 2. Supported Integrations

### 1. Safaricom M-Pesa Daraja API
Used for client STK push payment requests and C2B/B2C payment reconciliation.
- **STK Push Flow**: Initiates request using Express Checkout API. Generates unique `CheckoutRequestID`.
- **IPN Webhook Route**: Receives Safaricom payment callback. Success payloads trigger local journal bookings:
  - **Debit**: Cash at Hand / M-Pesa Account
  - **Credit**: Accounts Receivable / Customer Account
- **Mock Webhook Payload Schema**:
  ```json
  {
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "19384-829374-2",
        "CheckoutRequestID": "ws_CO_14072026110242",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            { "Name": "Amount", "Value": 2500 },
            { "Name": "MpesaReceiptNumber", "Value": "QE839DFH2A" }
          ]
        }
      }
    }
  }
  ```

### 2. SMTP Outbound Email Service
Dispatches monthly billing vouchers, pay slips, technical alerts, and report PDFs.
- **Protocol**: SMTP over TLS/SSL (secure connection on Port 465/587).
- **Template Variables**: Dynamically compiles templates with double-braces keys (e.g., `{{customerName}}`, `{{amount}}`).

### 3. SMS Gateway (Africa's Talking / Advanta)
Dispatches quick payment alerts, PPPoE credentials, bandwidth reminders, and system OTPs.
- **Provider support**: Africa's Talking, Twilio, or Advanta Africa.
- **Throughput**: Supports custom alphanumeric Sender IDs (e.g., `CELCOM_NET`).

### 4. Meta WhatsApp Business Cloud API
High-engagement client communication, dispatching interactive billing PDF download links, and automated customer follow-ups.
- **Engine**: Facebook Graph API v18+ endpoint using WhatsApp template namespace dispatches.

### 5. MikroTik RouterOS API
Automates active PPPoE subscriber provisioning, bandwidth limits (Simple Queues), and automatic suspending/blocking.
- **Commands Executed (CLI Session)**:
  - *Activate/Provision*:
    ```routeros
    /ppp active remove [find user="james_thika"]
    /ppp secret set [find name="james_thika"] profile="home_15mbps"
    ```
  - *Suspend (Traffic Block)*:
    ```routeros
    /ppp active remove [find user="james_thika"]
    /ppp secret set [find name="james_thika"] profile="suspended_profile"
    ```

### 6. Google Maps Platform APIs
Maps subscriber OLT links, designs physical splicer deployment routing, and visualizes network outages.
- **APIs**: Maps JavaScript SDK, Places API, and Geocoding API. Maps coordinates coordinates on the active dashboard.

### 7. Cloud Storage (AWS S3 / Cloudflare R2)
Handles secure backups of database SQL dumps and files.
- **Standard**: S3-compatible API. Supports multipart binary streaming.

---

## 3. Background Job Queue Retry Engine

When outward dispatches fail (e.g., remote gateway timeouts), the queue engine schedules retry triggers with **exponential backoff delay**.

$$\text{Delay Seconds} = 2^{\text{retryCount}} \times 10$$

| Attempt | Backoff Delay | Trigger Event |
| :---: | :---: | :--- |
| 1 | 20s | Remote connection refused; job status back to PENDING. |
| 2 | 40s | Retry handshake; log exception to audit trail. |
| 3 | 80s | Max retries hit; flag background job as FAILED; trigger administrative alert. |

---

## 4. Role-Based Permissions Matrix

| Operations / Scope | Managing Director (`MD`) | System Admin (`SYSTEM_ADMIN`) | Finance Officer (`FINANCE_OFFICER`) | Technical Admin (`TECHNICAL_ADMIN`) | General Staff (`ISP_USER` etc) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View API Status** | Yes | Yes | Yes | Yes | Yes |
| **Trigger Diagnostic Pings** | Yes | Yes | Yes | Yes | No |
| **View Audit Logs** | Yes | Yes | Yes | Yes | No |
| **Edit Secure Credentials Keyring** | Yes | Yes | Yes | Yes | No |
| **Manage Notification Templates** | Yes | Yes | Yes | Yes | No |
| **Trigger STK Push / Webhook simulator** | Yes | Yes | Yes | No | No |
| **Trigger MikroTik OLT Sync** | Yes | Yes | No | Yes | No |
| **Trigger Secure Backups** | Yes | Yes | Yes | Yes | No |

---

## 5. Express API Router Specification

All endpoints are mounted under `/api/v1/integrations`:

| HTTP Method | Route Endpoint | Purpose | Access Role Constraints |
| :--- | :--- | :--- | :--- |
| **GET** | `/credentials` | Get secure keys keyring (masked) | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **POST** | `/credentials` | Update API keys and parameters | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **GET** | `/health` | Fetch current gateways statuses | Authenticated Staff |
| **POST** | `/health/:id/ping` | Trigger live diagnostic ping | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **GET** | `/audit-logs` | Fetch integration logs history | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **GET** | `/jobs` | Retrieve scheduler jobs list | Authenticated Staff |
| **POST** | `/jobs/:id/run` | Force execute or retry queued job | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **GET** | `/templates` | List notification templates | Authenticated Staff |
| **POST** | `/templates` | Create/Save notification template | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **DELETE** | `/templates/:id` | Remove notification template | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **POST** | `/actions/mpesa-stk` | Trigger simulated M-Pesa STK push | MD, SYSTEM_ADMIN, FINANCE_OFFICER |
| **POST** | `/actions/mpesa-webhook` | Simulate incoming Safaricom IPN webhook | MD, SYSTEM_ADMIN, FINANCE_OFFICER |
| **POST** | `/actions/send-message` | Simulate outgoing alert (SMS/WhatsApp) | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **POST** | `/actions/mikrotik-sync` | Synchronize Subscriber GPON state | MD, SYSTEM_ADMIN, TECHNICAL_ADMIN |
| **POST** | `/actions/cloud-backup` | Upload encrypted dump backer | MD, SYSTEM_ADMIN, FINANCE, TECHNICAL |
| **POST** | `/actions/geocode` | Map installation location | Authenticated Staff |
