import { Router, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { SalesService } from "../services/sales.service";

const salesRouter = Router();
const salesService = new SalesService();

// Helper to get active user
const getActorName = (req: AuthenticatedRequest): string => {
  return req.user?.email || "Celcom ERP Staff";
};

// -------------------------------------------------------------
// QUOTATIONS
// -------------------------------------------------------------
salesRouter.get("/quotations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getQuotations();
    res.json({ success: true, quotations: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch quotations." });
  }
});

salesRouter.get("/quotations/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.getQuotation(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Quotation not found." });
    res.json({ success: true, quotation: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch quotation." });
  }
});

salesRouter.post("/quotations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creator = req.user?.id || "admin-user";
    const salesPerson = getActorName(req);
    const item = await salesService.createQuotation({
      ...req.body,
      createdBy: creator,
      salesPerson
    });
    res.status(201).json({ success: true, message: "Quotation created successfully.", quotation: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create quotation." });
  }
});

salesRouter.put("/quotations/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.updateQuotation(req.params.id, req.body);
    res.json({ success: true, message: "Quotation updated successfully.", quotation: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update quotation." });
  }
});

salesRouter.post("/quotations/:id/duplicate", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.duplicateQuotation(req.params.id);
    res.json({ success: true, message: "Quotation duplicated successfully.", quotation: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to duplicate quotation." });
  }
});

salesRouter.post("/quotations/:id/convert", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await salesService.convertQuotationToInvoice(req.params.id);
    res.json({ success: true, message: "Quotation converted to Sales Order & Invoice successfully.", invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to convert quotation." });
  }
});

// -------------------------------------------------------------
// SALES ORDERS
// -------------------------------------------------------------
salesRouter.get("/orders", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getSalesOrders();
    res.json({ success: true, salesOrders: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch sales orders." });
  }
});

salesRouter.post("/orders", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const salesPerson = getActorName(req);
    const item = await salesService.createSalesOrder({
      ...req.body,
      assignedSalesPerson: salesPerson
    });
    res.status(201).json({ success: true, message: "Sales Order registered successfully.", salesOrder: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create sales order." });
  }
});

salesRouter.put("/orders/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.updateSalesOrder(req.params.id, req.body.status);
    res.json({ success: true, message: "Sales Order status updated successfully.", salesOrder: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update Sales Order status." });
  }
});

// -------------------------------------------------------------
// INVOICES
// -------------------------------------------------------------
salesRouter.get("/invoices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getInvoices();
    res.json({ success: true, invoices: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch invoices." });
  }
});

salesRouter.get("/invoices/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.getInvoice(req.params.id);
    if (!item) return res.status(440).json({ success: false, message: "Invoice not found." });
    res.json({ success: true, invoice: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch invoice." });
  }
});

salesRouter.post("/invoices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.createInvoice(req.body);
    res.status(201).json({ success: true, message: "Invoice generated successfully.", invoice: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate invoice." });
  }
});

salesRouter.put("/invoices/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.updateInvoiceStatus(req.params.id, req.body.status);
    res.json({ success: true, message: "Invoice status updated successfully.", invoice: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update invoice status." });
  }
});

// -------------------------------------------------------------
// PAYMENTS & RECEIPTS
// -------------------------------------------------------------
salesRouter.get("/payments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getPayments();
    res.json({ success: true, payments: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch payment records." });
  }
});

salesRouter.get("/receipts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getReceipts();
    res.json({ success: true, receipts: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch receipts." });
  }
});

salesRouter.post("/payments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await salesService.createPaymentAndReceipt(req.body);
    res.status(201).json({
      success: true,
      message: "Payment received. Customer Invoice updated, Receipt issued, and stock reduced successfully.",
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to process payment." });
  }
});

// -------------------------------------------------------------
// CREDIT NOTES
// -------------------------------------------------------------
salesRouter.get("/credit-notes", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await salesService.getCreditNotes();
    res.json({ success: true, creditNotes: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch credit notes." });
  }
});

salesRouter.post("/credit-notes", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await salesService.createCreditNote(req.body);
    res.status(201).json({ success: true, message: "Credit Note issued successfully.", creditNote: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to issue credit note." });
  }
});

// -------------------------------------------------------------
// CUSTOMER STATEMENT
// -------------------------------------------------------------
salesRouter.get("/statements/:customerId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statement = await salesService.getCustomerStatement(req.params.customerId);
    res.json({ success: true, statement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch customer statement." });
  }
});

// -------------------------------------------------------------
// ISP BILLING PREPARATION
// -------------------------------------------------------------
salesRouter.get("/isp-preps", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const preps = await salesService.getIspBillingPreps();
    res.json({ success: true, ispPreps: preps });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch ISP preps." });
  }
});

salesRouter.post("/isp-preps/recurring", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const runResult = await salesService.executeIspRecurringBillingRun();
    res.json({ success: true, message: "ISP monthly recurring billing run executed successfully.", runResult });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to execute ISP billing run." });
  }
});

// -------------------------------------------------------------
// SALES REPORTS
// -------------------------------------------------------------
salesRouter.get("/reports", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await salesService.getSalesReports();
    res.json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to compile sales reports." });
  }
});

export default salesRouter;
