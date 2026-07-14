import { Router } from "express";
import { verifyToken, restrictTo, AuthenticatedRequest } from "../middlewares/auth";
import { IntegrationsService } from "../services/integrations.service";
import { asyncHandler } from "../utils/errors";

const integrationsRouter = Router();
const integrationsService = IntegrationsService.getInstance();

// Helper to get actor from request
function getActorString(req: AuthenticatedRequest): string {
  if (req.user) {
    return `${req.user.id} (${req.user.email})`;
  }
  return "System Operator";
}

// 1. GET CREDENTIALS (Saves sensitive data masking for safe UI display)
integrationsRouter.get(
  "/credentials",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const credentials = integrationsService.getCredentials(getActorString(req));
    res.json({ success: true, credentials });
  })
);

// 2. UPDATE CREDENTIALS
integrationsRouter.post(
  "/credentials",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = getActorString(req);
    const updated = integrationsService.saveCredentials(req.body, actor);
    res.json({ success: true, message: "Secure integration parameters updated.", credentials: updated });
  })
);

// 3. GET HEALTH MONITOR STATUS
integrationsRouter.get(
  "/health",
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const health = integrationsService.getHealthStatuses();
    res.json({ success: true, health });
  })
);

// 4. TRIGGER DIAGNOSTIC PING
integrationsRouter.post(
  "/health/:id/ping",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const actor = getActorString(req);
    const status = await integrationsService.pingGateway(id, actor);
    
    if (!status) {
      return res.status(404).json({ success: false, error: "Gateway status monitor not found." });
    }
    res.json({ success: true, status });
  })
);

// 5. GET AUDIT LOGS
integrationsRouter.get(
  "/audit-logs",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const logs = integrationsService.getAuditLogs();
    res.json({ success: true, logs });
  })
);

// 6. GET BACKGROUND JOB QUEUE
integrationsRouter.get(
  "/jobs",
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const jobs = integrationsService.getJobQueue();
    res.json({ success: true, jobs });
  })
);

// 7. FORCE RUN OR RETRY BACKGROUND JOB
integrationsRouter.post(
  "/jobs/:id/run",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const actor = getActorString(req);
    const job = await integrationsService.triggerJobExecution(id, actor);
    
    if (!job) {
      return res.status(404).json({ success: false, error: "Background job not found." });
    }
    res.json({ success: true, job });
  })
);

// 8. GET NOTIFICATION TEMPLATES
integrationsRouter.get(
  "/templates",
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const templates = integrationsService.getTemplates();
    res.json({ success: true, templates });
  })
);

// 9. SAVE OR UPDATE NOTIFICATION TEMPLATE
integrationsRouter.post(
  "/templates",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = getActorString(req);
    const saved = integrationsService.saveTemplate(req.body, actor);
    res.json({ success: true, message: "Notification template saved.", template: saved });
  })
);

// 10. DELETE NOTIFICATION TEMPLATE
integrationsRouter.delete(
  "/templates/:id",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const actor = getActorString(req);
    const success = integrationsService.deleteTemplate(id, actor);
    
    if (!success) {
      return res.status(404).json({ success: false, error: "Template not found." });
    }
    res.json({ success: true, message: "Notification template deleted successfully." });
  })
);

// 11. ACTION: TRIGGER M-PESA STK PUSH
integrationsRouter.post(
  "/actions/mpesa-stk",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { phoneNumber, amount, accountCode } = req.body;
    if (!phoneNumber || !amount || !accountCode) {
      return res.status(400).json({ success: false, error: "Phone number, amount, and account code are required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateMpesaStkPush(phoneNumber, Number(amount), accountCode, actor);
    res.json(result);
  })
);

// 12. ACTION: M-PESA WEBHOOK / CALLBACK SIMULATION
integrationsRouter.post(
  "/actions/mpesa-webhook",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { checkoutId, success } = req.body;
    if (!checkoutId) {
      return res.status(400).json({ success: false, error: "Checkout Request ID is required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateMpesaWebhook(checkoutId, success === true || success === "true", actor);
    res.json(result);
  })
);

// 13. ACTION: OUTGOING SMS/WHATSAPP MESSAGE
integrationsRouter.post(
  "/actions/send-message",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { channel, recipient, templateId } = req.body;
    if (!channel || !recipient || !templateId) {
      return res.status(400).json({ success: false, error: "Channel, recipient, and templateId are required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateOutgoingMessage(channel, recipient, templateId, actor);
    res.json(result);
  })
);

// 14. ACTION: MIKROTIK PROVISIONING SYNC
integrationsRouter.post(
  "/actions/mikrotik-sync",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { username, speed, action } = req.body;
    if (!username || !speed || !action) {
      return res.status(400).json({ success: false, error: "Username, speed profile, and action are required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateMikrotikSync(username, speed, action, actor);
    res.json(result);
  })
);

// 15. ACTION: SECURE OBJECT UPLOADER (Backup storage)
integrationsRouter.post(
  "/actions/cloud-backup",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "ACCOUNTANT", "TECHNICIAN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileName, fileSizeMb } = req.body;
    if (!fileName) {
      return res.status(400).json({ success: false, error: "File name is required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateCloudBackup(fileName, Number(fileSizeMb || 5), actor);
    res.json(result);
  })
);

// 16. ACTION: GOOGLE MAPS GEOCODE ADDRESS
integrationsRouter.post(
  "/actions/geocode",
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, error: "Address query is required." });
    }
    const actor = getActorString(req);
    const result = integrationsService.simulateGeocode(address, actor);
    res.json(result);
  })
);

export default integrationsRouter;
