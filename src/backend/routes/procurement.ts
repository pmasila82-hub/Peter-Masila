import { Router, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { ProcurementService } from "../services/procurement.service";

const procurementRouter = Router();
const procurementService = new ProcurementService();

// Helper to get active user
const getActorName = (req: AuthenticatedRequest): string => {
  const user = req.user as any;
  if (user) {
    return `${user.firstName || "Celcom"} ${user.lastName || "Staff"}`.trim();
  }
  return "Celcom ERP Staff";
};

// -------------------------------------------------------------
// SUPPLIER MANAGEMENT
// -------------------------------------------------------------
procurementRouter.get("/suppliers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getSuppliers();
    res.json({ success: true, suppliers: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch suppliers." });
  }
});

procurementRouter.post("/suppliers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await procurementService.createSupplier(req.body);
    res.status(201).json({ success: true, message: "Supplier registered successfully.", supplier: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register supplier." });
  }
});

procurementRouter.post("/suppliers/:id/documents", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, fileName, fileSize, fileType } = req.body;
    const item = await procurementService.uploadSupplierDocument(req.params.id, title, fileName, fileSize, fileType);
    res.json({ success: true, message: "Document uploaded successfully.", document: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to upload document." });
  }
});

procurementRouter.put("/suppliers/:id/rating", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, details } = req.body;
    await procurementService.updateSupplierRating(req.params.id, rating, details);
    res.json({ success: true, message: "Supplier rating and feedback logged successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update supplier rating." });
  }
});

// -------------------------------------------------------------
// PURCHASE REQUESTS
// -------------------------------------------------------------
procurementRouter.get("/requests", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getPurchaseRequests();
    res.json({ success: true, purchaseRequests: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch purchase requests." });
  }
});

procurementRouter.post("/requests", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = getActorName(req);
    const item = await procurementService.createPurchaseRequest({
      ...req.body,
      requestedBy: requester
    });
    res.status(201).json({ success: true, message: "Purchase Request drafted successfully.", purchaseRequest: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create purchase request." });
  }
});

procurementRouter.post("/requests/:id/submit", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await procurementService.submitPurchaseRequest(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: "Purchase Request not found." });
    res.json({ success: true, message: "Purchase Request submitted to department approval queue." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit purchase request." });
  }
});

procurementRouter.post("/requests/:id/approve", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, decision, comments } = req.body;
    const actorName = getActorName(req);
    const item = await procurementService.approvePurchaseRequest(req.params.id, role, actorName, decision, comments);
    if (!item) return res.status(404).json({ success: false, message: "Purchase Request or Approval tier not found." });
    res.json({ success: true, message: `Workflow status updated to ${decision}.`, purchaseRequest: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to action approval workflow." });
  }
});

// -------------------------------------------------------------
// LPO MANAGEMENT
// -------------------------------------------------------------
procurementRouter.get("/lpos", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getLPOs();
    res.json({ success: true, lpos: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch LPOs." });
  }
});

procurementRouter.post("/lpos", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { purchaseRequestId, supplierId, terms, deliveryLocation } = req.body;
    const lpo = await procurementService.generateLPO(purchaseRequestId, supplierId, terms, deliveryLocation);
    if (!lpo) return res.status(400).json({ success: false, message: "Could not generate LPO. Ensure Purchase Request is fully approved." });
    res.status(201).json({ success: true, message: "LPO generated and approved successfully.", lpo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate LPO." });
  }
});

// -------------------------------------------------------------
// PURCHASE ORDERS
// -------------------------------------------------------------
procurementRouter.get("/orders", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getPurchaseOrders();
    res.json({ success: true, purchaseOrders: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch purchase orders." });
  }
});

procurementRouter.post("/orders", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lpoId, expectedDeliveryDate } = req.body;
    const po = await procurementService.createPOFromLPO(lpoId, expectedDeliveryDate);
    if (!po) return res.status(400).json({ success: false, message: "Could not generate PO. Verify LPO reference." });
    res.status(201).json({ success: true, message: "Purchase Order dispatched to Supplier.", purchaseOrder: po });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create Purchase Order." });
  }
});

// -------------------------------------------------------------
// GOODS RECEIVED NOTE (GRN)
// -------------------------------------------------------------
procurementRouter.get("/grns", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getGRNs();
    res.json({ success: true, grns: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch GRNs." });
  }
});

procurementRouter.post("/grns", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorName = getActorName(req);
    const grn = await procurementService.createGRN({
      ...req.body,
      receivedBy: actorName
    });
    if (!grn) return res.status(400).json({ success: false, message: "Failed to generate GRN. Verify PO reference." });
    res.status(201).json({ success: true, message: "Goods received successfully. Inventory balances and serial records synchronized.", grn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to record GRN." });
  }
});

// -------------------------------------------------------------
// SUPPLIER BILLS/INVOICES
// -------------------------------------------------------------
procurementRouter.get("/invoices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getSupplierInvoices();
    res.json({ success: true, invoices: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch invoices." });
  }
});

procurementRouter.post("/invoices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await procurementService.createSupplierInvoice(req.body);
    if (!item) return res.status(400).json({ success: false, message: "Failed to record invoice. Verify Supplier reference." });
    res.status(201).json({ success: true, message: "Supplier bill/invoice logged successfully in Accounts Payable ledger.", invoice: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to log invoice." });
  }
});

// -------------------------------------------------------------
// SUPPLIER PAYMENTS
// -------------------------------------------------------------
procurementRouter.get("/payments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await procurementService.getSupplierPayments();
    res.json({ success: true, payments: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch payments." });
  }
});

procurementRouter.post("/payments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await procurementService.recordSupplierPayment(req.body);
    if (!item) return res.status(400).json({ success: false, message: "Failed to record payment. Verify invoice reference." });
    res.status(201).json({ success: true, message: "Payment recorded. Accounts Payable ledger updated.", payment: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to log payment." });
  }
});

// -------------------------------------------------------------
// ANALYTICS & REPORTS
// -------------------------------------------------------------
procurementRouter.get("/reports", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await procurementService.getProcurementReports();
    res.json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch reports." });
  }
});

export default procurementRouter;
