import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { validateRequest } from "../middlewares/validation";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { asyncHandler } from "../utils/errors";
import { rateLimiter } from "../middlewares/rate-limit";

const authRouter = Router();

// -----------------------------------------------------------------
// VALIDATION SCHEMA SCHEMAS DEFINITION
// -----------------------------------------------------------------

const loginSchema = {
  body: {
    email: { type: "email" as const, required: true },
    password: { type: "string" as const, required: true }
  }
};

const registerSchema = {
  body: {
    email: { type: "email" as const, required: true },
    password: { type: "string" as const, required: true, min: 8 },
    firstName: { type: "string" as const, required: true, min: 2 },
    lastName: { type: "string" as const, required: true, min: 2 },
    phoneNumber: { type: "string" as const, required: false },
    role: { type: "string" as const, required: false }
  }
};

const forgotPasswordSchema = {
  body: {
    email: { type: "email" as const, required: true }
  }
};

const resetPasswordSchema = {
  body: {
    token: { type: "string" as const, required: true },
    password: { type: "string" as const, required: true, min: 8 }
  }
};

const updateProfileSchema = {
  body: {
    firstName: { type: "string" as const, required: true, min: 2 },
    lastName: { type: "string" as const, required: true, min: 2 },
    phoneNumber: { type: "string" as const, required: false }
  }
};

// -----------------------------------------------------------------
// ROUTE IMPLEMENTATIONS
// -----------------------------------------------------------------

/**
 * Staff login
 */
authRouter.post(
  "/login",
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 attempts per IP
    message: "Too many login attempts. Brute force defense triggered. Please try again after 15 minutes.",
  }),
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Express best practice: secure token response payload
    res.json({
      success: true,
      message: "Authentication successful.",
      ...result
    });
  })
);

/**
 * Register new administrative staff user
 */
authRouter.post(
  "/register",
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 staff registrations per IP to mitigate account spamming
    message: "Too many administrative account registration attempts. Please contact a SUPER_ADMIN.",
  }),
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, phoneNumber, role } = req.body;
    const result = await authService.register(email, password, firstName, lastName, phoneNumber, role);
    
    res.status(251).json({
      success: true,
      message: "Administrative user account registered successfully.",
      ...result
    });
  })
);

/**
 * Session Token Rotation / Refresh
 */
authRouter.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REFRESH_TOKEN",
        message: "A valid refresh token is required to extend session lifetime."
      });
    }

    const result = await authService.refresh(refreshToken);
    res.json({
      success: true,
      message: "Access tokens rotated successfully.",
      ...result
    });
  })
);

/**
 * Logout / Revoke Active Session
 */
authRouter.post(
  "/logout",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    res.json({
      success: true,
      message: "Session terminated successfully."
    });
  })
);

/**
 * Initiates Account Forgot-Password Token Generation
 */
authRouter.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const resetToken = await authService.forgotPassword(email);
    
    // Return the reset token explicitly so the sandbox or manual forms can use it instantly in the UI preview!
    res.json({
      success: true,
      message: "If the email matches a registered staff member, a secure reset token has been compiled.",
      resetToken: resetToken !== "mock-silent-code" ? resetToken : undefined
    });
  })
);

/**
 * Consume verification token and reset user password
 */
authRouter.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    
    res.json({
      success: true,
      message: "Your password has been successfully reset. Please log in with your new credentials."
    });
  })
);

/**
 * Get active authenticated staff details
 */
authRouter.get(
  "/me",
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: req.user
    });
  })
);

/**
 * Update authenticated staff profile details
 */
authRouter.put(
  "/profile",
  verifyToken,
  validateRequest(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User session required." });
    }

    const updatedProfile = await authService.updateProfile(userId, req.body);
    res.json({
      success: true,
      message: "Staff profile details updated successfully.",
      user: updatedProfile
    });
  })
);

export default authRouter;
