# CELCOM ERP PRO — ARCHITECTURE & DEVELOPER ONBOARDING GUIDE

Welcome to the **CELCOM ERP PRO** enterprise resource planning repository. This documentation acts as the definitive architecture reference and developer guide for setting up, running, and contributing to the application.

---

## 📂 COMPLETE PROJECT STRUCTURE DIRECTORY

Below is the directory map of the entire production-ready structure. Each folder has a dedicated responsiblity ensuring compliance with full-stack separation of concerns.

```text
├── config/                 # Central environmental configuration maps & statutory tax rates
├── docs/                   # System design diagrams, API documentation, and compliance journals
├── prisma/                 # Database schemas, SQL migration logs, and client definitions
├── reports/                # On-demand generated PDF customer invoices and payroll CSV files
├── scripts/                # Database seeding routines, Radius sync scripts, & backup runners
├── src/                    # Primary application codebase
│   ├── backend/            # Express.js REST API layer
│   │   ├── controllers/    # Route controllers (deserialises inputs, calls service layers)
│   │   ├── middlewares/    # Session JWT validations, RBAC checks, and error interceptors
│   │   ├── routes/         # Router declarations linking endpoints to controllers
│   │   └── services/       # Core business workflows & Prisma query interactions
│   ├── frontend/           # React Single Page Application (Vite framework)
│   │   ├── assets/         # Static visual resources (icons, vector charts)
│   │   ├── components/     # UI elements (shadcn blocks, interactive tables, charts)
│   │   ├── hooks/          # Client-side custom React hooks (TanStack Query client wrappers)
│   │   ├── pages/          # Full route-view components (Dashboard, Ledger, HR, Subscribers)
│   │   ├── services/       # HTTP Client API wrappers (Axios integrations)
│   │   └── store/          # Global client-side state managers (Zustand context states)
│   └── shared/             # Code shared concurrently between Client & Server
│       ├── types/          # Shared TypeScript interfaces & types (e.g. Roles, Statuses)
│       └── validation/     # Shared request schema checkers (Zod validation schemes)
├── templates/              # Visual and text blueprints used for output generators
│   └── email/              # HTML/text mail models for customer billing and technical alerts
├── tests/                  # Integrity verification unit and integration test scripts
├── uploads/                # Physical repository for CCTV layout files and vendor invoice attachments
├── .env.example            # Declared system environment environment keys reference
├── Dockerfile              # Multi-stage production container instructions
├── docker-compose.yml      # Local Postgres, pgAdmin, and server container orchestrator
├── package.json            # Dependency catalog & unified build script configurations
├── tsconfig.json           # Master TypeScript compiler rule mappings
└── vite.config.ts          # Client-side bundler settings
```

---

## 🛠️ ARCHITECTURAL MODULE RESPONSIBILITY

### 1. Frontend SPA (`/src/frontend`)
- **React 19 + Vite 6**: High-speed hot module replacement during development, and tight static bundles in production.
- **`components/` & `pages/`**: All views are broken into clean visual blocks.
- **`store/`**: Tracks login tokens, active session parameters, and UI drawer states.
- **`services/` & `hooks/`**: Abstracts HTTP queries from UI rendering, enforcing a strict separation of concerns.

### 2. Backend Rest API (`/src/backend`)
- **Express.js Core**: Manages API endpoints under unified, standardized routers.
- **`middlewares/`**: Performs pre-routing security checks, verifying high-entropy JWT tokens, and verifying Kenyan statutory compliance roles before hitting database logic.
- **Prisma Client (`services/prisma.service.ts`)**: Serves a thread-safe singleton database client, avoiding thread exhaustion when communicating with PostgreSQL.

### 3. Database Persistence (`/prisma`)
- Enforces relational models designed in the **Database Design Matrix**.
- Tracks physical schema modifications through sequential, SQL-based migration logs.

### 4. Shared Types (`/src/shared`)
- Eliminates code duplication by maintaining single sources of truth for types like `UserRole`, `SubscriberStatus`, or `PaymentStatus`.

### 5. Containers & Deployments (`/Dockerfile`, `/docker-compose.yml`)
- Provides seamless local development. Spinning up PostgreSQL, pgAdmin, and the application requires running exactly one CLI instruction.
- Optimizes production container sizing down to bare Node.js alpine sizes by utilizing a clean **Multi-stage Docker build**.

---

## 🚀 GETTING STARTED

### 1. Provision Local Services
Copy the example environment settings to your local configuration:
```bash
cp .env.example .env
```

Fire up the local container orchestration stack:
```bash
docker compose up --build -d
```
This boots:
- **PostgreSQL Database** on port `5432`
- **pgAdmin (Database Viewer)** on port `5050` (Login with: `admin@celcomnetworks.co.ke` / `admin_secure_password`)
- **CELCOM ERP PRO Core** on port `3000`

### 2. Run Database Seeding
Ensure migrations are deployed and seed default ERP constants:
```bash
npx prisma migrate dev
npm run seed
```

### 3. Production Compilation & Packaging
To compile the ERP for high-scale, secure deployment:
```bash
npm run build
```
This builds React into `/dist`, and bundles our server using esbuild into `/dist/server.cjs` for execution.
To launch the production server:
```bash
npm run start
```
