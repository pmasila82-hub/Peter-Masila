import { Router, Response } from "express";
import { verifyToken } from "../middlewares/auth";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ProjectService } from "../services/project.service";

const projectRouter = Router();
const projectService = new ProjectService();

// Helper to get active user's name
const getActorName = (req: AuthenticatedRequest): string => {
  const user = req.user as any;
  if (!user) return "Celcom ERP Staff";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Celcom ERP Staff";
};

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
projectRouter.get("/dashboard-stats", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await projectService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch project stats." });
  }
});

// -------------------------------------------------------------
// PROJECTS
// -------------------------------------------------------------
projectRouter.get("/projects", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await projectService.getProjects();
    res.json({ success: true, projects: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch projects." });
  }
});

projectRouter.post("/projects", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = { ...req.body, projectManager: getActorName(req) };
    const project = await projectService.createProject(data);
    res.status(201).json({ success: true, message: "Project created successfully.", project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create project." });
  }
});

projectRouter.put("/projects/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    res.json({ success: true, message: "Project updated successfully.", project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update project." });
  }
});

projectRouter.delete("/projects/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await projectService.deleteProject(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: "Project not found." });
    res.json({ success: true, message: "Project deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete project." });
  }
});

// Expenses
projectRouter.post("/projects/:id/expenses", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const expense = await projectService.addProjectExpense(req.params.id, req.body);
    res.status(201).json({ success: true, message: "Expense added successfully.", expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to add expense." });
  }
});

// Materials
projectRouter.post("/projects/:id/materials", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allocation = await projectService.addMaterialAllocation(req.params.id, req.body);
    res.status(201).json({ success: true, message: "Material allocated successfully.", allocation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to allocate material." });
  }
});

projectRouter.put("/projects/:id/materials/:allocationId/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, quantity } = req.body; // action: "ISSUE" | "USE" | "RETURN"
    const allocation = await projectService.updateMaterialStatus(req.params.id, req.params.allocationId, action, quantity);
    res.json({ success: true, message: `Material successfully actioned: ${action}.`, allocation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update material allocation." });
  }
});

// -------------------------------------------------------------
// SITE SURVEYS
// -------------------------------------------------------------
projectRouter.get("/surveys", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const surveys = await projectService.getSurveys();
    res.json({ success: true, surveys });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch site surveys." });
  }
});

projectRouter.post("/surveys", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const survey = await projectService.createSurvey(req.body);
    res.status(201).json({ success: true, message: "Site survey logged successfully.", survey });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create site survey." });
  }
});

// -------------------------------------------------------------
// TASKS
// -------------------------------------------------------------
projectRouter.get("/tasks", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await projectService.getTasks();
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch tasks." });
  }
});

projectRouter.post("/tasks", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await projectService.createTask(req.body);
    res.status(201).json({ success: true, message: "Task created successfully.", task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create task." });
  }
});

projectRouter.put("/tasks/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const task = await projectService.updateTaskStatus(req.params.id, status);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.json({ success: true, message: "Task status updated.", task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update task status." });
  }
});

// -------------------------------------------------------------
// INSTALLATIONS
// -------------------------------------------------------------
projectRouter.get("/fibre-records", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await projectService.getFibreRecords();
    res.json({ success: true, records: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch fibre records." });
  }
});

projectRouter.post("/fibre-records", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await projectService.createFibreRecord(req.body);
    res.status(201).json({ success: true, message: "Fibre Installation record registered.", record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create fibre record." });
  }
});

projectRouter.get("/cctv-records", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await projectService.getCctvRecords();
    res.json({ success: true, records: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch CCTV records." });
  }
});

projectRouter.post("/cctv-records", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await projectService.createCctvRecord(req.body);
    res.status(201).json({ success: true, message: "CCTV Installation record registered.", record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create CCTV record." });
  }
});

// -------------------------------------------------------------
// MAINTENANCE CONTRACTS
// -------------------------------------------------------------
projectRouter.get("/maintenance-contracts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contracts = await projectService.getMaintenanceContracts();
    res.json({ success: true, contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch maintenance contracts." });
  }
});

projectRouter.post("/maintenance-contracts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contract = await projectService.createMaintenanceContract(req.body);
    res.status(201).json({ success: true, message: "Maintenance contract generated successfully.", contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create contract." });
  }
});

// -------------------------------------------------------------
// JOB CARDS
// -------------------------------------------------------------
projectRouter.get("/job-cards", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cards = await projectService.getJobCards();
    res.json({ success: true, jobCards: cards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch job cards." });
  }
});

projectRouter.post("/job-cards", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const card = await projectService.createJobCard(req.body);
    res.status(201).json({ success: true, message: "Job card created successfully.", jobCard: card });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create job card." });
  }
});

projectRouter.put("/job-cards/:id/status", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, workDone, materialsUsed, customerSignature } = req.body;
    const card = await projectService.updateJobCardStatus(req.params.id, status, { workDone, materialsUsed, customerSignature });
    if (!card) return res.status(404).json({ success: false, message: "Job card not found." });
    res.json({ success: true, message: "Job card updated successfully.", jobCard: card });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update job card." });
  }
});

// -------------------------------------------------------------
// COMPLETION CERTIFICATES
// -------------------------------------------------------------
projectRouter.get("/completion-certificates", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await projectService.getCompletionCertificates();
    res.json({ success: true, certificates: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch completion certificates." });
  }
});

projectRouter.post("/completion-certificates", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const certificate = await projectService.createCompletionCertificate(req.body);
    res.status(201).json({ success: true, message: "Completion certificate recorded.", certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to record completion certificate." });
  }
});

// -------------------------------------------------------------
// TECHNICIANS
// -------------------------------------------------------------
projectRouter.get("/technicians", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const technicians = await projectService.getTechnicians();
    res.json({ success: true, technicians });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch technicians list." });
  }
});

export default projectRouter;
