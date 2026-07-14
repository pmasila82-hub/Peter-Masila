import { Router, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { IspService } from "../services/isp.service";

const ispRouter = Router();
const ispService = new IspService();

// Helper to get active user's name or email
const getActorName = (req: AuthenticatedRequest): string => {
  const user = req.user as any;
  if (!user) return "Celcom ERP Staff";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Celcom ERP Staff";
};

// -------------------------------------------------------------
// ISP DASHBOARD STATS
// -------------------------------------------------------------
ispRouter.get("/stats", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await ispService.getISPDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch ISP stats." });
  }
});

// -------------------------------------------------------------
// INTERNET PACKAGES
// -------------------------------------------------------------
ispRouter.get("/packages", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getPackages();
    res.json({ success: true, packages: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch packages." });
  }
});

ispRouter.post("/packages", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pkg = await ispService.createPackage(req.body);
    res.status(201).json({ success: true, message: "Internet Package created successfully.", package: pkg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create package." });
  }
});

ispRouter.put("/packages/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pkg = await ispService.updatePackage(req.params.id, req.body);
    res.json({ success: true, message: "Internet Package updated successfully.", package: pkg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update package." });
  }
});

ispRouter.delete("/packages/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await ispService.deletePackage(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Package not found." });
    res.json({ success: true, message: "Internet Package deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete package." });
  }
});

// -------------------------------------------------------------
// SUBSCRIBERS
// -------------------------------------------------------------
ispRouter.get("/subscribers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getSubscribers();
    res.json({ success: true, subscribers: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch subscribers." });
  }
});

ispRouter.get("/subscribers/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriber = await ispService.getSubscriber(req.params.id);
    if (!subscriber) return res.status(404).json({ success: false, message: "Subscriber not found." });
    res.json({ success: true, subscriber });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch subscriber." });
  }
});

ispRouter.post("/subscribers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await ispService.createSubscriber(req.body);
    res.status(201).json({ success: true, message: "Broadband subscriber registered successfully.", subscriber: sub });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register subscriber." });
  }
});

ispRouter.put("/subscribers/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await ispService.updateSubscriber(req.params.id, req.body);
    res.json({ success: true, message: "Subscriber details updated successfully.", subscriber: sub });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update subscriber." });
  }
});

ispRouter.patch("/subscribers/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActorName(req);
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status parameter is required." });
    
    const sub = await ispService.changeSubscriberStatus(req.params.id, status, reason || "Administrative update", actor);
    res.json({ success: true, message: `Subscriber SLA status updated to ${status}.`, subscriber: sub });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to alter subscriber status." });
  }
});

// -------------------------------------------------------------
// INSTALLATIONS
// -------------------------------------------------------------
ispRouter.get("/installations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getInstallations();
    res.json({ success: true, installations: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch installations." });
  }
});

ispRouter.post("/installations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ins = await ispService.createInstallation(req.body);
    res.status(201).json({ success: true, message: "Installation scheduled successfully.", installation: ins });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to schedule installation." });
  }
});

ispRouter.put("/installations/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, technicianName, equipmentUsed, materialsUsed, installationCost } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status parameter is required." });

    const ins = await ispService.updateInstallationStatus(
      req.params.id,
      status,
      technicianName,
      equipmentUsed,
      materialsUsed,
      installationCost
    );
    res.json({ success: true, message: "Installation progress updated successfully.", installation: ins });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update installation." });
  }
});

// -------------------------------------------------------------
// ROUTER ASSIGNMENTS
// -------------------------------------------------------------
ispRouter.get("/equipment-assignments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getEquipmentAssignments();
    res.json({ success: true, assignments: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch equipment assignments." });
  }
});

ispRouter.post("/equipment-assignments", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignment = await ispService.createEquipmentAssignment(req.body);
    res.status(201).json({ success: true, message: "Equipment allocated successfully.", assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to allocate equipment." });
  }
});

// -------------------------------------------------------------
// BILLING & RECURRING RUNS
// -------------------------------------------------------------
ispRouter.get("/invoices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getBillingInvoices();
    res.json({ success: true, invoices: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch subscriber invoices." });
  }
});

ispRouter.post("/billing/recurring", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { billingPeriod } = req.body;
    if (!billingPeriod) return res.status(400).json({ success: false, message: "Billing period (e.g. July 2026) is required." });

    const actor = getActorName(req);
    const invoices = await ispService.executeIspRecurringBillingRun(billingPeriod, actor);
    res.json({
      success: true,
      message: `Recurring billing run completed. ${invoices.length} invoices generated and journal ledger posts registered.`,
      invoices
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to run billing execution." });
  }
});

// -------------------------------------------------------------
// NETWORK DEVICES
// -------------------------------------------------------------
ispRouter.get("/devices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ispService.getNetworkDevices();
    res.json({ success: true, devices: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch network devices." });
  }
});

ispRouter.post("/devices", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dev = await ispService.createNetworkDevice(req.body);
    res.status(201).json({ success: true, message: "Network device registered successfully.", device: dev });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register network device." });
  }
});

ispRouter.put("/devices/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dev = await ispService.updateNetworkDevice(req.params.id, req.body);
    res.json({ success: true, message: "Network device configuration updated.", device: dev });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update device configuration." });
  }
});

ispRouter.post("/devices/:id/logs", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, message } = req.body;
    if (!type || !message) return res.status(400).json({ success: false, message: "Type and message are required." });

    const added = await ispService.addDeviceLog(req.params.id, type, message);
    if (!added) return res.status(404).json({ success: false, message: "Device not found." });
    res.json({ success: true, message: "Log added successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register device log." });
  }
});

// -------------------------------------------------------------
// CUSTOMER PORTAL PAYLOAD SIMULATOR
// -------------------------------------------------------------
ispRouter.get("/portal/:subscriberId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = await ispService.getCustomerPortalData(req.params.subscriberId);
    if (!payload) return res.status(404).json({ success: false, message: "Subscriber portal data not found." });
    res.json({ success: true, portalData: payload });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to compile customer portal payload." });
  }
});

export default ispRouter;
