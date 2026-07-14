# CELCOM ERP PRO - COMPLETE TESTING STRATEGY & QUALITY ASSURANCE SPECIFICATION

This document outlines the comprehensive quality assurance architecture, automated testing frameworks, performance benchmarks, and user acceptance pathways engineered for **CELCOM ERP PRO**.

---

## 1. Quality Assurance Pipeline Overview

CELCOM ERP PRO employs a modern, full-stack, automated testing pipeline designed to maintain maximum security, uptime, and operational integrity for our corporate enterprise portal.

```
                  ┌───────────────────────────────────────────────┐
                  │          Continuous Integration (CI)          │
                  └───────────────────────┬───────────────────────┘
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       ▼                                  ▼                                  ▼
┌──────────────┐                  ┌──────────────┐                  ┌────────────────┐
│  Unit Tests  │                  │ Integrations │                  │  End-to-End    │
│  (Vitest +   │                  │  (Supertest) │                  │  (Playwright)  │
│    RTL)      │                  │              │                  │                │
└──────────────┘                  └──────────────┘                  └────────────────┘
```

---

## 2. Automated Testing Architectures

### 2.1 Unit Testing (Frontend React Layer)
*   **Frameworks:** `Vitest` + `React Testing Library` (RTL) + `jsdom`.
*   **Coverage Focus:** Visual components, state boundaries, local event triggers, form validation visual feedback, and responsive state handlers.
*   **Mocking Philosophy:** Deep mocking of global providers (e.g., `AuthContext`, `NotificationContext`) to ensure isolated, repeatable, and fast tests.
*   **Execution Target:** `/tests/unit/**/*.test.tsx`
*   **Command:** `npm run test` (or `npx vitest run tests/unit`)

### 2.2 Integration Testing (API & Middleware Layer)
*   **Frameworks:** `Vitest` + `Supertest` + `Express` (In-memory loopback).
*   **Coverage Focus:** Endpoint routing resolution, HTTP header verification, rate-limiting triggers, JWT validation gates, and schema-validation middleware.
*   **Database Treatment:** Decoupled from physical persistent engines (Prisma client is mocked or bypassed via modular controller testing) to keep execution under 100ms.
*   **Execution Target:** `/tests/integration/**/*.test.ts`
*   **Command:** `npx vitest run tests/integration`

### 2.3 End-to-End (E2E) Testing (Full-Stack Browser Flow)
*   **Framework:** `Playwright`
*   **Coverage Focus:** Real-browser browser actions, cookie storage, navigation, responsive reflows, and cross-browser accessibility (Chromium, Firefox, WebKit).
*   **Server Lifecycle:** Playwright automatically builds and launches the Express server inside its execution lifecycle, tears it down, and captures screenshots or traces on failure.
*   **Execution Target:** `/tests/e2e/**/*.spec.ts`
*   **Command:** `npm run test:e2e`

### 2.4 Performance & Load Testing
*   **Framework:** Native Vitest asynchronous concurrent loops + Supertest.
*   **Coverage Focus:** System throughput limit tests, peak load simulation, connection handshake latency, and database-less controller processing speeds.
*   **Performance Metrics Captured:**
    *   **Average Latency:** Mean request turnaround time.
    *   **95th Percentile (p95) Latency:** Eliminates outlier distortion to reflect true system limits.
    *   **Rate-Limiting Stability:** Validates that the server rejects exceeding requests with HTTP 429 without failing globally.
*   **Execution Target:** `/tests/performance/**/*.test.ts`
*   **Command:** `npx vitest run tests/performance`

---

## 3. Specialized Testing Specifications

### 3.1 Security Testing Strategy
Our security test suite actively verifies our **Security Hardening hotfixes** against regressions:
1.  **Production Bypass Block check:** Confirms that sending the mock administrative token (`Bearer mock-admin-token`) is **strictly blocked** when `NODE_ENV === 'production'`.
2.  **Brute-Force Bracing:** Confirms that authentication endpoints (`/api/v1/auth/login`) throttle traffic aggressively via custom rate limiters.
3.  **CORS & CSP Leak Check:** Verifies that Cross-Origin Resource Sharing (CORS) wildcards are revoked in production, and Content-Security-Policy (CSP) injection guards are present in HTTP responses.
4.  **OWASP Cryptographic Benchmark:** Confirms new passwords are hashed with **210,000 PBKDF2 iteration rounds** while preserving backward parsing compatibility for legacy users.

### 3.2 Regression Testing Strategy
Whenever an ERP module is modified or added, the regression suite runs:
*   `tsc --noEmit` to catch strict static type check violations.
*   `vitest run` to ensure no legacy security policies, cryptographic iteration counts, or API route shapes were broken by the new code.
*   Standard schema consistency validations.

### 3.3 User Acceptance Testing (UAT)
UAT verifies real business processes for core corporate staff personas:

| Staff Persona | Operational Flow Tested | Acceptance Criteria |
| :--- | :--- | :--- |
| **Super Admin** | ERP dashboard sync, user management controls, log audit review. | Full global write/read access. Audit trails write successfully to persistent storage. |
| **Finance Officer** | Payroll computation, supplier procurement processing. | Precise billing math. Payroll calculation executes inside secure limits. |
| **NOC Technician** | ISP network monitoring, client support ticket resolution. | Live ping tools functional. Ticket status changes persist correctly. |

---

## 4. Execution Dashboard & Command Reference

| Action | Target | Command |
| :--- | :--- | :--- |
| **Lint & Type Check** | Global Workspace | `npm run lint` |
| **Execute Test Suite** | All Automated Tests (Unit, Integration, Load) | `npm run test` |
| **Watch Mode Tests** | Interactive Test Driver | `npm run test:watch` |
| **End-to-End Suite** | Real Browser Automation | `npm run test:e2e` |

---

## 5. Directory Structure of Test Suite

```
/tests
├── setup.ts                    # Vitest environment setup & global mocks
├── unit/
│   └── LoginPage.test.tsx      # React Testing Library unit checks for authentication
├── integration/
│   └── api.test.ts             # Supertest route integration and rate limiter checks
├── e2e/
│   └── auth.spec.ts            # Playwright End-to-End multi-browser test scenarios
└── performance/
    └── load.test.ts            # High-concurrency load and p95 latency test simulations
```
