import { Router, Request, Response } from "express";

const docsRouter = Router();

const DOCS_METADATA = {
  appName: "CELCOM ERP PRO",
  version: "1.0.0-beta.1",
  description: "Enterprise Resource Planning and ISP Billing Core System",
  security: {
    authType: "JWT Bearer Token",
    header: "Authorization: Bearer <token>",
    roles: ["SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "HR_MANAGER", "SALES", "PROCUREMENT", "STORE_MANAGER", "TECHNICIAN", "CUSTOMER_SUPPORT", "VIEWER"]
  },
  endpoints: [
    {
      module: "System Security & Integration Core",
      path: "/api/health",
      method: "GET",
      auth: "Public",
      description: "Monitors overall system availability, checking database connection loops and process runtimes.",
      response: {
        status: "HEALTHY",
        database: "CONNECTED",
        service: "CELCOM ERP PRO API Core",
        timestamp: "ISOString"
      }
    },
    {
      module: "System Security & Integration Core",
      path: "/api/docs",
      method: "GET",
      auth: "Public",
      description: "Serves full technical specifications for all core integrations, schemas, and endpoints.",
      response: "HTML Developer Console / JSON Payload"
    },
    {
      module: "Module 1: Authentication & Sessions",
      path: "/api/v1/auth/login",
      method: "POST",
      auth: "Public",
      description: "Authenticates administrative staff, issuing short-lived JWT access and long-lived refresh credentials.",
      payload: {
        email: "email (required)",
        password: "string (required)"
      },
      response: {
        success: true,
        accessToken: "JWT_STRING",
        user: { id: "string", name: "string", role: "ROLE" }
      }
    },
    {
      module: "Module 2: GPON Subscriber & OLT Operations",
      path: "/api/v1/subscribers",
      method: "GET",
      auth: "verifyToken (All Roles)",
      description: "Queries active FTTH/FTTB subscriber roster with filtering, sorting, and cursor pagination parameters.",
      response: {
        subscribers: "Array<Subscriber>",
        pagination: { total: 140, page: 1, limit: 50 }
      }
    },
    {
      module: "Module 3: Billing & General Ledger Bookkeeping",
      path: "/api/v1/billing/transactions",
      method: "POST",
      auth: "restrictTo(SUPER_ADMIN, ACCOUNTANT)",
      description: "Writes audited double-entry debit or credit journal ledger entries to database records.",
      payload: {
        subscriberId: "string (required)",
        amountKES: "number (required)",
        entryType: "DEBIT | CREDIT (required)",
        refCode: "string (required)",
        description: "string"
      },
      response: {
        transactionId: "string",
        recordedAt: "ISOString",
        newBalanceKES: "number"
      }
    },
    {
      module: "Module 4: GPON Technical Operations",
      path: "/api/v1/tech/olt-status",
      method: "GET",
      auth: "restrictTo(SUPER_ADMIN, TECHNICIAN)",
      description: "Pings Westlands/Central headend OLT ports to fetch optical diagnostic light values in dBm.",
      response: {
        oltId: "string",
        uptime: "string",
        opticalPowerDbm: -21.4,
        status: "OPTIMAL"
      }
    },
    {
      module: "Module 5: HR, Payroll & Taxation",
      path: "/api/v1/hr/payroll/calculate",
      method: "POST",
      auth: "restrictTo(SUPER_ADMIN, ACCOUNTANT)",
      description: "Computes corporate payroll spreadsheets with exact KRA, NHIF, and Affordable Housing Levy rates.",
      payload: {
        billingMonth: "YYYY-MM (required)"
      },
      response: {
        processedRecords: 48,
        totalWithheldKES: 1945000,
        kraStatus: "COMPILED"
      }
    }
  ]
};

docsRouter.get("/", (req: Request, res: Response) => {
  const acceptsHtml = req.accepts("html");
  const acceptsJson = req.accepts("json");

  // Return JSON if consumer specifically requests JSON or does not accept HTML
  if (acceptsJson && !acceptsHtml) {
    res.json(DOCS_METADATA);
    return;
  }

  // Otherwise, serve a visually striking, polished dark developer documentation web console!
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Developer Hub | CELCOM ERP PRO Core</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
              }
            }
          }
        }
      </script>
      <style>
        body { font-family: 'Inter', sans-serif; background-color: #0b0f19; color: #f1f5f9; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body class="min-h-screen">
      <!-- Top Branding Navigation Header -->
      <nav class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-sm tracking-tighter">
              CEL
            </div>
            <div>
              <span class="font-extrabold text-white tracking-wide text-sm block">CELCOM ERP PRO</span>
              <span class="text-[10px] text-slate-500 font-mono">v1.0.0-beta.1 // Developer Core Console</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-semibold">
              BASE URL: /api
            </span>
          </div>
        </div>
      </nav>

      <!-- Main Layout -->
      <main class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Left Quick Navigation Sidebar -->
        <aside class="space-y-6">
          <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Security Protocol</h3>
            <div class="space-y-3">
              <div>
                <span class="text-[11px] text-slate-500 block">Auth Transport</span>
                <span class="text-xs font-medium text-slate-200 block">${DOCS_METADATA.security.authType}</span>
              </div>
              <div>
                <span class="text-[11px] text-slate-500 block">HTTP Header Format</span>
                <code class="text-[11px] text-sky-400 font-mono block select-all p-1.5 bg-slate-950 rounded mt-1 border border-slate-800/60">
                  ${DOCS_METADATA.security.header}
                </code>
              </div>
            </div>
          </div>

          <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Staff Role Hierarchy</h3>
            <ul class="space-y-2">
              ${DOCS_METADATA.security.roles.map(role => `
                <li class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                  <span class="text-[11px] font-mono font-medium text-slate-300">${role}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </aside>

        <!-- Right Content Block: Endpoints -->
        <section class="lg:col-span-3 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-white">System API Endpoints</h1>
              <p class="text-xs text-slate-400 mt-1">Foundational route contracts supporting transactional ISP billing and infrastructure control.</p>
            </div>
          </div>

          <div class="space-y-6">
            ${DOCS_METADATA.endpoints.map((ep, idx) => {
              const badgeColors: Record<string, string> = {
                GET: "bg-emerald-950/60 text-emerald-400 border-emerald-900/50",
                POST: "bg-sky-950/60 text-sky-400 border-sky-900/50",
                PUT: "bg-amber-950/60 text-amber-400 border-amber-900/50",
                DELETE: "bg-red-950/60 text-red-400 border-red-900/50"
              };

              const methodBadge = badgeColors[ep.method] || "bg-slate-950 text-slate-400";
              const authBadge = ep.auth === "Public" 
                ? "bg-slate-850 text-slate-400 border-slate-700/50" 
                : "bg-indigo-950/60 text-indigo-400 border-indigo-900/50";

              return `
                <div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-750">
                  <!-- Endpoint Top Header Row -->
                  <div class="p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/20 border-b border-slate-800/40">
                    <div class="flex items-center gap-3">
                      <span class="px-2.5 py-1 text-xs font-mono font-black border rounded-lg ${methodBadge}">
                        ${ep.method}
                      </span>
                      <span class="font-mono text-sm font-bold text-white tracking-wide select-all">
                        ${ep.path}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-slate-500 uppercase font-mono">${ep.module}</span>
                      <span class="px-2 py-0.5 border text-[10px] font-mono font-semibold rounded ${authBadge}">
                        ${ep.auth}
                      </span>
                    </div>
                  </div>

                  <!-- Endpoint Body Content -->
                  <div class="p-5 space-y-4">
                    <div>
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Functional Description</h4>
                      <p class="text-xs text-slate-300 leading-relaxed">${ep.description}</p>
                    </div>

                    ${ep.payload ? `
                      <div>
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Body Schema (JSON)</h4>
                        <pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 select-all overflow-x-auto">${JSON.stringify(ep.payload, null, 2)}</pre>
                      </div>
                    ` : ""}

                    <div>
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Success Response Sample</h4>
                      <pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 select-all overflow-x-auto">${JSON.stringify(ep.response, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </section>
      </main>
      
      <!-- Sticky Page Footer -->
      <footer class="border-t border-slate-800/80 mt-12 bg-slate-950 py-6 px-6">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <span>Celcom Networks Operations Hub &copy; 2026. All Rights Reserved.</span>
          <span class="font-mono">Compiled with Express, TypeScript, Prisma ORM, and Tailwind.</span>
        </div>
      </footer>
    </body>
    </html>
  `;

  res.send(html);
});

export default docsRouter;
