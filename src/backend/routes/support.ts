import { Router, Response } from "express";
import { verifyToken } from "../middlewares/auth";
import { AuthenticatedRequest } from "../middlewares/auth";
import { SupportService } from "../services/support.service";

const supportRouter = Router();
const supportService = new SupportService();

// Helper to extract active worker/actor name
const getActorName = (req: AuthenticatedRequest): string => {
  const user = req.user as any;
  if (!user) return "Celcom Support Agent";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Celcom Support Agent";
};

// -------------------------------------------------------------
// ANALYTICS & STATS
// -------------------------------------------------------------
supportRouter.get("/dashboard-stats", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await supportService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch support statistics." });
  }
});

// -------------------------------------------------------------
// TICKETS
// -------------------------------------------------------------
supportRouter.get("/tickets", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await supportService.getTickets();
    res.json({ success: true, tickets: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch support tickets." });
  }
});

supportRouter.get("/tickets/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await supportService.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket profile not found." });
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch ticket." });
  }
});

supportRouter.post("/tickets", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActorName(req);
    const ticket = await supportService.createTicket({ ...req.body, createdBy: actor });
    res.status(201).json({ success: true, message: "Support ticket registered.", ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register ticket." });
  }
});

supportRouter.put("/tickets/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await supportService.updateTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket profile not found." });
    res.json({ success: true, message: "Support ticket updated.", ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update ticket." });
  }
});

supportRouter.post("/tickets/:id/messages", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActorName(req);
    const message = await supportService.addTicketMessage(req.params.id, {
      ...req.body,
      senderName: actor
    });
    res.status(201).json({ success: true, note: "Ticket log updated.", ticketMessage: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to append communication message." });
  }
});

// -------------------------------------------------------------
// JOB CARDS
// -------------------------------------------------------------
supportRouter.get("/job-cards", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await supportService.getJobCards();
    res.json({ success: true, jobCards: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch job cards." });
  }
});

supportRouter.post("/tickets/:id/job-card", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActorName(req);
    const jobCard = await supportService.createJobCardFromTicket(req.params.id, { ...req.body, technician: actor });
    res.status(201).json({ success: true, message: "Job card created successfully.", jobCard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate job card." });
  }
});

supportRouter.post("/job-cards/:id/complete", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobCard = await supportService.completeJobCard(req.params.id, req.body);
    if (!jobCard) return res.status(404).json({ success: false, message: "Job card not found." });
    res.json({ success: true, message: "Job card completed. Inventory quantities updated.", jobCard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to finalize job card." });
  }
});

// -------------------------------------------------------------
// PREVENTIVE MAINTENANCE SCHEDULING
// -------------------------------------------------------------
supportRouter.get("/schedules", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await supportService.getSchedules();
    res.json({ success: true, schedules: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch maintenance schedules." });
  }
});

supportRouter.post("/schedules", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await supportService.createSchedule(req.body);
    res.status(201).json({ success: true, message: "Preventive maintenance scheduled.", schedule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register maintenance date." });
  }
});

supportRouter.post("/schedules/:id/complete", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await supportService.completeSchedule(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: "Maintenance schedule not found." });
    res.json({ success: true, message: "Preventive maintenance marked as completed.", schedule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to complete schedule." });
  }
});

// -------------------------------------------------------------
// CUSTOMER FEEDBACK
// -------------------------------------------------------------
supportRouter.post("/tickets/:id/feedback", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, comments } = req.body;
    const ticket = await supportService.submitFeedback(req.params.id, rating, comments);
    res.json({ success: true, message: "Satisfaction feedback recorded successfully.", ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to log satisfaction metrics." });
  }
});

// -------------------------------------------------------------
// KNOWLEDGE BASE
// -------------------------------------------------------------
supportRouter.get("/knowledge-base", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await supportService.getKnowledgeBase();
    res.json({ success: true, articles: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch knowledge base." });
  }
});

supportRouter.post("/knowledge-base/:id/helpful", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const article = await supportService.incrementHelpfulCount(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: "Article not found." });
    res.json({ success: true, article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to upvote article." });
  }
});

export default supportRouter;
