import { Router, Response } from "express";
import { adminService } from "../services/admin.service";
import { verifyToken, restrictTo, AuthenticatedRequest } from "../middlewares/auth";
import { asyncHandler } from "../utils/errors";
import { validateRequest } from "../middlewares/validation";

const adminRouter = Router();

// Validate user body schema
const userCreationSchema = {
  body: {
    email: { type: "email" as const, required: true },
    firstName: { type: "string" as const, required: true, min: 2 },
    lastName: { type: "string" as const, required: true, min: 2 },
    phoneNumber: { type: "string" as const, required: false },
    role: { type: "string" as const, required: true }
  }
};

const userUpdateSchema = {
  body: {
    email: { type: "email" as const, required: true },
    firstName: { type: "string" as const, required: true, min: 2 },
    lastName: { type: "string" as const, required: true, min: 2 },
    phoneNumber: { type: "string" as const, required: false },
    role: { type: "string" as const, required: true },
    isActive: { type: "boolean" as const, required: true }
  }
};

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------

// Fetch users
adminRouter.get(
  "/users",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "HR_MANAGER"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const users = await adminService.getUsers();
    res.json({ success: true, users });
  })
);

// Create user
adminRouter.post(
  "/users",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "HR_MANAGER"),
  validateRequest(userCreationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const user = await adminService.createUser(actorId, actorEmail, req.body);
    res.status(201).json({ success: true, user, message: "User created successfully." });
  })
);

// Edit user
adminRouter.put(
  "/users/:id",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR", "HR_MANAGER"),
  validateRequest(userUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const user = await adminService.updateUser(actorId, actorEmail, req.params.id, req.body);
    res.json({ success: true, user, message: "User configurations updated successfully." });
  })
);

// Deactivate user
adminRouter.delete(
  "/users/:id",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    await adminService.deactivateUser(actorId, actorEmail, req.params.id);
    res.json({ success: true, message: "Staff user deactivated successfully." });
  })
);

// -------------------------------------------------------------
// PERMISSION & ROLE MANAGEMENT
// -------------------------------------------------------------

// Fetch permission matrices
adminRouter.get(
  "/roles-permissions",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await adminService.getRolePermissionsMatrix();
    res.json({ success: true, ...data });
  })
);

// Update permissions for a role
adminRouter.post(
  "/roles-permissions/:roleName",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: "Permissions must be an array of slugs." });
    }
    await adminService.updateRolePermissions(actorId, actorEmail, req.params.roleName, permissions);
    res.json({ success: true, message: `Access permissions for ${req.params.roleName} updated successfully.` });
  })
);

// -------------------------------------------------------------
// SYSTEM SETTINGS & COMPANY PROFILE
// -------------------------------------------------------------

adminRouter.get(
  "/company-profile",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await adminService.getCompanyProfile();
    res.json({ success: true, profile });
  })
);

adminRouter.put(
  "/company-profile",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const profile = await adminService.updateCompanyProfile(actorId, actorEmail, req.body);
    res.json({ success: true, profile, message: "Company profile updated successfully." });
  })
);

// -------------------------------------------------------------
// BRANCH SETTINGS
// -------------------------------------------------------------

adminRouter.get(
  "/branches",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const branches = await adminService.getBranches();
    res.json({ success: true, branches });
  })
);

adminRouter.post(
  "/branches",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const branch = await adminService.createBranch(actorId, actorEmail, req.body);
    res.status(201).json({ success: true, branch, message: "Branch location registered successfully." });
  })
);

adminRouter.put(
  "/branches/:id",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    const branch = await adminService.updateBranch(actorId, actorEmail, req.params.id, req.body);
    res.json({ success: true, branch, message: "Branch details modified successfully." });
  })
);

adminRouter.delete(
  "/branches/:id",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user?.id || "unknown";
    const actorEmail = req.user?.email || "unknown";
    await adminService.deleteBranch(actorId, actorEmail, req.params.id);
    res.json({ success: true, message: "Branch location deleted successfully." });
  })
);

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------

adminRouter.get(
  "/audit-logs",
  verifyToken,
  restrictTo("SUPER_ADMIN", "MANAGING_DIRECTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await adminService.getAuditLogs();
    res.json({ success: true, logs });
  })
);

export default adminRouter;
