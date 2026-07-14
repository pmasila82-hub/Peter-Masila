# CELCOM ERP PRO - DATABASE INTEGRATION & SEEDING REFERENCE GUIDE
## System Module: Relational PostgreSQL Engine (Prisma ORM)

This document describes the architectural implementation of the relational PostgreSQL database foundation for **CELCOM ERP PRO**, including migrations, schema constraints, indices, roles, permission matrices, and administrative credentials.

---

## 1. Database Schema Specifications & Constraints

Our schema leverages **PostgreSQL-native features** mapped precisely through the Prisma ORM in `/prisma/schema.prisma`. It is strictly normalized to the Third Normal Form (3NF) to guarantee transaction integrity, eliminate write anomalies, and secure double-entry bookkeeping ledgers.

### A. Core Database Constraints & Keys
- **Primary Keys:** Every single record utilizes globally unique, non-enumerable, cryptographically safe **UUIDv4** keys (`@db.Uuid` mapping to native `uuid` in PostgreSQL).
- **Unique Fields:** 
  - `users.email` and `users.phone_number` are protected by native database unique constraints.
  - `roles.name` and `permissions.slug` are strictly unique.
  - `inventory_items` is governed by a composite unique index: `@@unique([warehouseId, productId])`.
- **Foreign Key Referential Integrity:**
  - Standard cascade deletes are configured on critical mapping tables: `UserRole`, `RolePermission`, `RefreshToken`, `ActiveSession`, `CustomerContact`, `InventoryItem`, and `SerialTracker`.
  - Sensitive transactional ledgers (like `JournalEntry`, `Invoice`, `Receipt`) prevent deletion of parents to preserve auditing histories (`onDelete: Restrict` / standard relational safety).

### B. Optimized Performance Indices (B-Tree Indexes)
To scale for high-frequency concurrent operations, explicit lookup indices are compiled into the migration script:
1. **Authentication Lookup Index:** B-Tree indexing on `users.email` for high-speed staff log-ins.
2. **Session Security Index:** Indexes on `refresh_tokens.token` and `active_sessions.id` to validate staff session states instantly.
3. **Inventory Performance:** Single and composite indexes on `inventory_items` and `serial_trackers.serial_number` for quick warehouse barcodes lookup.
4. **General Ledger Optimization:** Time-range indices on `journal_entries.created_at` and search lookups on accounting reference codes (`ref_code`).

---

## 2. Default Access Control Roles & Permissions

The database seed engine (`/prisma/seed.ts`) instantiates **10 operational roles** and matches them to granular module-based permission privilege scopes:

| Security Role | Description | Primary Permissions Assigned |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Root server administrator | *Full access to all system privileges* |
| **MANAGING_DIRECTOR**| Chief operating oversight | *Full access to all system privileges* |
| **ACCOUNTANT** | Finance general ledger, payroll & VAT | `users:read`, `subscribers:read`, `billing:manage`, `billing:read`, `payroll:read`, `reports:read` |
| **HR_MANAGER** | Staff profiles, contracts, NHIF/Housing Levy | `users:create`, `users:read`, `users:update`, `payroll:manage`, `payroll:read`, `reports:read` |
| **SALES** | Handles client sign-ups and quotes | `subscribers:create`, `subscribers:read`, `subscribers:update`, `billing:read`, `reports:read` |
| **PROCUREMENT** | Purchases hardware & optical assets | `reports:read` |
| **STORE_MANAGER** | Warehouse and serialized ONT inventory | `reports:read` |
| **TECHNICIAN** | Splicing, drop fiber, OLT laser pings | `subscribers:read`, `subscribers:update`, `olt:manage`, `olt:read` |
| **CUSTOMER_SUPPORT** | SLA ticket assignment & OLT stats check | `subscribers:read`, `subscribers:update`, `olt:read` |
| **VIEWER** | Read-only auditor | `users:read`, `roles:read`, `subscribers:read`, `billing:read`, `olt:read`, `payroll:read`, `reports:read` |

---

## 3. Migration and Deployment CLI Commands

Use the following commands to initialize, migrate, and seed the database in different environments:

### A. Local Sandbox / Development Environment
If you are running the backend in development mode with a local PostgreSQL server (or using our `docker-compose` environment):

1. **Spin up PostgreSQL via Docker Compose:**
   ```bash
   docker-compose up -d db
   ```

2. **Generate Prisma Local Client:**
   ```bash
   npx prisma generate
   ```

3. **Run Migrations & Create Schema Tables:**
   This command reads `/prisma/schema.prisma`, compares it against your running PostgreSQL database, generates the SQL migration files (or applies the existing ones), and creates the tables:
   ```bash
   npx prisma migrate dev --name init_celcom_erp
   ```

4. **Run the Database Seed Script:**
   This command populates the permissions list, configures security matrices, and generates the root administrator user:
   ```bash
   npx prisma db seed
   ```

### B. Production Environment (CI/CD Pipelines)
In secure staging or production contexts (such as Cloud Run or dedicated virtual servers):

1. **Run Production Migrations (Idempotent):**
   Applies all pending migrations from `/prisma/migrations` directly to the live server:
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify Client Generation:**
   ```bash
   npx prisma generate
   ```

---

## 4. Default Credentials (Instantiated on Seed)

Running the database seed automatically provisions the primary administrative account:

- **Corporate Administrative Email:** `admin@celcomnetworks.co.ke`
- **Default Secure Password:** `AdminSecurePassword2026!`
- **Role Level:** `SUPER_ADMIN`
- **Assigned Phone:** `+254700000000`

---

## 5. Offline Schema Compilation (Advanced Reference)

For debugging, our migration SQL was generated using Prisma's secure offline diff engine:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```
The resulting highly optimized DDL is stored in `/prisma/migrations/20260713215200_init_celcom_erp/migration.sql` for native raw SQL execution.
