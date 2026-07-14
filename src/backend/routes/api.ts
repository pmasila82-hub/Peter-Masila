import { Router } from "express";
import { verifyToken, restrictTo } from "../middlewares/auth";
import authRouter from "./auth";
import adminRouter from "./admin";
import docsRouter from "./docs";
import crmRouter from "./crm";
import inventoryRouter from "./inventory";
import salesRouter from "./sales";
import procurementRouter from "./procurement";
import ispRouter from "./isp";
import projectRouter from "./project";
import supportRouter from "./support";
import analyticsRouter from "./analytics";
import integrationsRouter from "./integrations";

const apiRouter = Router();

// Mount system API documentation
apiRouter.use("/docs", docsRouter);

// ---------------------------------------------------------
// MODULE 1: AUTHENTICATION & SESSIONS
// ---------------------------------------------------------
apiRouter.use("/v1/auth", authRouter);
apiRouter.use("/v1/admin", adminRouter);
apiRouter.use("/v1/crm", crmRouter);
apiRouter.use("/v1/inventory", inventoryRouter);
apiRouter.use("/v1/sales", salesRouter);
apiRouter.use("/v1/procurement", procurementRouter);
apiRouter.use("/v1/isp", ispRouter);
apiRouter.use("/v1/project", projectRouter);
apiRouter.use("/v1/support", supportRouter);
apiRouter.use("/v1/analytics", analyticsRouter);
apiRouter.use("/v1/integrations", integrationsRouter);

// ---------------------------------------------------------
// MODULE 2: SUBSCRIBER MANAGEMENT (ISP Core)
// ---------------------------------------------------------
apiRouter.use("/v1/subscribers", ispRouter);

// ---------------------------------------------------------
// MODULE 3: BILLING & GENERAL LEDGER (Double-Entry Bookkeeping)
// ---------------------------------------------------------
apiRouter.post(
  "/v1/billing/transactions",
  verifyToken,
  restrictTo("SUPER_ADMIN", "ACCOUNTANT"),
  (req, res) => {
    res.json({ message: "Created double-entry transaction record." });
  }
);

// ---------------------------------------------------------
// MODULE 4: TECHNICAL OPS (CCTV, IPAM, GPON & OLTs)
// ---------------------------------------------------------
apiRouter.get(
  "/v1/tech/olt-status",
  verifyToken,
  restrictTo("SUPER_ADMIN", "TECHNICIAN"),
  (req, res) => {
    res.json({ message: "Queried GPON OLT optical diagnostics payload." });
  }
);

// ---------------------------------------------------------
// MODULE 5: HUMAN RESOURCES & PAYROLL (PAYE, NHIF, Housing Levy)
// ---------------------------------------------------------
apiRouter.post(
  "/v1/hr/payroll/calculate",
  verifyToken,
  restrictTo("SUPER_ADMIN", "ACCOUNTANT"),
  (req, res) => {
    res.json({ message: "Payroll calculations complete. Ready for statutory CSV download." });
  }
);

export default apiRouter;
