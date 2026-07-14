import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { AnalyticsService } from "../services/analytics.service";
import { logger } from "../services/logger.service";

const analyticsRouter = Router();
const service = AnalyticsService.getInstance();

// 1. Fetch entire consolidated analytics data
analyticsRouter.get("/aggregated", verifyToken, (req, res) => {
  try {
    const data = service.getAggregatedAnalytics();
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error("ANALYTICS_ROUTES", "Failed to compile aggregated analytics", error);
    res.status(500).json({ success: false, message: error.message || "Aggregation failed." });
  }
});

// 2. Dashboard configs endpoints
analyticsRouter.get("/configs", verifyToken, (req, res) => {
  try {
    res.json({ success: true, configs: service.getDashboardConfigs() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.post("/configs", verifyToken, (req, res) => {
  try {
    const saved = service.saveDashboardConfig(req.body);
    res.json({ success: true, config: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Report templates endpoints
analyticsRouter.get("/templates", verifyToken, (req, res) => {
  try {
    res.json({ success: true, templates: service.getReportTemplates() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.post("/templates", verifyToken, (req, res) => {
  try {
    const created = service.createReportTemplate(req.body);
    res.status(201).json({ success: true, template: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Saved reports endpoints
analyticsRouter.get("/saved", verifyToken, (req, res) => {
  try {
    res.json({ success: true, reports: service.getSavedReports() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.post("/saved", verifyToken, (req, res) => {
  try {
    const actor = (req as any).user ? `${(req as any).user.firstName} ${(req as any).user.lastName}` : "Authorized Staff";
    const report = service.saveReport({
      ...req.body,
      generatedBy: actor,
    });
    res.status(201).json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.delete("/saved/:id", verifyToken, (req, res) => {
  try {
    const deleted = service.deleteSavedReport(req.params.id);
    res.json({ success: deleted, message: deleted ? "Saved report removed." : "Report not found." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Scheduled reports endpoints
analyticsRouter.get("/scheduled", verifyToken, (req, res) => {
  try {
    res.json({ success: true, schedules: service.getScheduledReports() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.post("/scheduled", verifyToken, (req, res) => {
  try {
    const created = service.createScheduledReport(req.body);
    res.status(201).json({ success: true, schedule: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.put("/scheduled/:id", verifyToken, (req, res) => {
  try {
    const updated = service.updateScheduledReport(req.params.id, req.body);
    res.json({ success: !!updated, schedule: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.delete("/scheduled/:id", verifyToken, (req, res) => {
  try {
    const deleted = service.deleteScheduledReport(req.params.id);
    res.json({ success: deleted, message: deleted ? "Schedule removed." : "Schedule not found." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Professional export trigger simulators
analyticsRouter.post("/export", verifyToken, (req, res) => {
  try {
    const { format, reportName, dataSummary } = req.body;
    logger.info("ANALYTICS_ROUTES", `Exported report [${reportName}] as format [${format}]`);
    // Return mock successful file download link and base64 hash simulation
    res.json({
      success: true,
      message: `Successfully prepared ${format} structure.`,
      fileName: `${reportName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_compiled.${format.toLowerCase()}`,
      sizeBytes: Math.floor(Math.random() * 850000) + 150000,
      downloadUrl: `https://celcomnetworks.co.ke/erp/assets/downloads/${Math.random().toString(36).substring(2, 10)}.${format.toLowerCase()}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

analyticsRouter.post("/email", verifyToken, (req, res) => {
  try {
    const { reportName, recipients, format } = req.body;
    logger.info("ANALYTICS_ROUTES", `Emailed report [${reportName}] as [${format}] to: ${recipients.join(", ")}`);
    res.json({
      success: true,
      message: `Report successfully dispatched. SMTPS outbound gateway cleared for recipients: ${recipients.join(", ")}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default analyticsRouter;
