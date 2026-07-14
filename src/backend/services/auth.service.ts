import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "./prisma.service";
import { hashPassword, verifyPassword } from "../utils/hash";
import { logger } from "./logger.service";
import { AppError } from "../utils/errors";

// Standard JWT Constants
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "celcom_erp_default_access_secret_2026_safe_key";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "celcom_erp_default_refresh_secret_2026_safe_key";
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export interface UserSessionPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

// -----------------------------------------------------------------
// DUAL-MODE BACKEND SESSION REGISTRY (Postgres + Sandbox fallback)
// -----------------------------------------------------------------

// In-Memory Database Fallback Store (Sandbox mode)
export interface SandboxUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export const SANDBOX_USERS: SandboxUser[] = [
  {
    id: "usr_admin_001",
    email: "admin@celcomnetworks.co.ke",
    passwordHash: hashPassword("AdminSecurePassword2026!"),
    firstName: "Admin",
    lastName: "Root",
    phoneNumber: "+254700000000",
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "usr_fin_001",
    email: "accounting@celcomnetworks.co.ke",
    passwordHash: hashPassword("Accountant2026!"),
    firstName: "Naomi",
    lastName: "Wambui",
    phoneNumber: "+254711223344",
    role: "ACCOUNTANT",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "usr_tech_001",
    email: "noc@celcomnetworks.co.ke",
    passwordHash: hashPassword("Technician2026!"),
    firstName: "Joseph",
    lastName: "Kariuki",
    phoneNumber: "+254722334455",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: new Date(),
  }
];

const SANDBOX_REFRESH_TOKENS = new Set<string>();
const SANDBOX_RESET_TOKENS = new Map<string, { email: string; expiresAt: Date }>();

class AuthService {
  private isDbConnected = false;

  constructor() {
    this.checkDatabaseLoop();
  }

  private async checkDatabaseLoop() {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      this.isDbConnected = true;
      logger.info("AUTH_SERVICE", "Direct Postgres DB link active. Standard schema queries enabled.");
    } catch (err) {
      this.isDbConnected = false;
      logger.warn("AUTH_SERVICE", "Database server unreachable. Starting in robust Sandbox Mode with dual-memory session mapping.");
    }
  }

  // Helper: check if we should run DB or Sandbox logic
  private async runWithDb<T>(dbQuery: () => Promise<T>, sandboxQuery: () => Promise<T>): Promise<T> {
    if (this.isDbConnected) {
      try {
        return await dbQuery();
      } catch (error) {
        logger.error("DB_QUERY_FAILURE", "Failed to query database, attempting sandbox fallback", error);
        return await sandboxQuery();
      }
    }
    return await sandboxQuery();
  }

  /**
   * Generates JWT Access & Refresh Tokens
   */
  public generateTokens(user: UserSessionPayload) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

    return { accessToken, refreshToken };
  }

  /**
   * User login credentials verification
   */
  public async login(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();

    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: {
            userRoles: {
              include: {
                role: true,
              }
            }
          }
        });

        if (!user || !user.isActive) {
          throw new AppError("Invalid credentials or account deactivated.", 401, "UNAUTHORIZED");
        }

        const isMatch = verifyPassword(password, user.passwordHash);
        if (!isMatch) {
          throw new AppError("Invalid credentials or account deactivated.", 401, "UNAUTHORIZED");
        }

        // Get primary role
        const roleName = user.userRoles[0]?.role?.name || "VIEWER";

        const userPayload: UserSessionPayload = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: roleName,
          isActive: user.isActive,
        };

        const tokens = this.generateTokens(userPayload);

        // Store refresh token in database (using a token model or active session model if schema allows, or skip)
        try {
          await prisma.refreshToken.create({
            data: {
              userId: user.id,
              token: tokens.refreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
          });
        } catch (e) {
          logger.warn("TOKEN_PERSISTENCE", "Failed to write refresh token to Postgres. Sessions will fallback to runtime verification.");
        }

        return { user: userPayload, ...tokens };
      },
      async () => {
        const user = SANDBOX_USERS.find(u => u.email === cleanEmail);
        if (!user || !user.isActive) {
          throw new AppError("Invalid credentials or account deactivated.", 401, "UNAUTHORIZED");
        }

        const isMatch = verifyPassword(password, user.passwordHash);
        if (!isMatch) {
          throw new AppError("Invalid credentials or account deactivated.", 401, "UNAUTHORIZED");
        }

        const userPayload: UserSessionPayload = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        };

        const tokens = this.generateTokens(userPayload);
        SANDBOX_REFRESH_TOKENS.add(tokens.refreshToken);

        return { user: userPayload, ...tokens };
      }
    );
  }

  /**
   * Register and activate new staff users
   */
  public async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber?: string,
    role: string = "VIEWER"
  ) {
    const cleanEmail = email.toLowerCase().trim();
    const hashed = hashPassword(password);

    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        
        // Check duplicate
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          throw new AppError("An account with that email already exists.", 400, "DUPLICATE_EMAIL");
        }

        // Get Role ID
        const targetRole = await prisma.role.findFirst({
          where: { name: role }
        });

        if (!targetRole) {
          throw new AppError(`The designated role '${role}' is not a valid system level.`, 400, "INVALID_ROLE");
        }

        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash: hashed,
            firstName,
            lastName,
            phoneNumber,
            isActive: true,
            userRoles: {
              create: {
                roleId: targetRole.id
              }
            }
          }
        });

        const userPayload: UserSessionPayload = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role,
          isActive: newUser.isActive,
        };

        const tokens = this.generateTokens(userPayload);
        return { user: userPayload, ...tokens };
      },
      async () => {
        const existing = SANDBOX_USERS.find(u => u.email === cleanEmail);
        if (existing) {
          throw new AppError("An account with that email already exists.", 400, "DUPLICATE_EMAIL");
        }

        const newUser: SandboxUser = {
          id: `usr_${crypto.randomBytes(4).toString("hex")}`,
          email: cleanEmail,
          passwordHash: hashed,
          firstName,
          lastName,
          phoneNumber,
          role,
          isActive: true,
          createdAt: new Date(),
        };

        SANDBOX_USERS.push(newUser);

        const userPayload: UserSessionPayload = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          isActive: newUser.isActive,
        };

        const tokens = this.generateTokens(userPayload);
        SANDBOX_REFRESH_TOKENS.add(tokens.refreshToken);

        return { user: userPayload, ...tokens };
      }
    );
  }

  /**
   * Refreshes JWT tokens using the Refresh Token rotation flow
   */
  public async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as any;
      const userId = decoded.sub;

      return this.runWithDb(
        async () => {
          const prisma = getPrismaClient();
          const storedToken = await prisma.refreshToken.findFirst({
            where: { token, userId }
          });

          if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new AppError("Session expired or token revoked.", 403, "REVOKED_TOKEN");
          }

          // Revoke used token (rotation)
          await prisma.refreshToken.delete({ where: { id: storedToken.id } });

          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } }
          });

          if (!user || !user.isActive) {
            throw new AppError("Account deactivated.", 403, "DEACTIVATED_USER");
          }

          const roleName = user.userRoles[0]?.role?.name || "VIEWER";

          const userPayload: UserSessionPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roleName,
            isActive: user.isActive,
          };

          const tokens = this.generateTokens(userPayload);

          await prisma.refreshToken.create({
            data: {
              userId: user.id,
              token: tokens.refreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
          });

          return { user: userPayload, ...tokens };
        },
        async () => {
          if (!SANDBOX_REFRESH_TOKENS.has(token)) {
            throw new AppError("Session expired or token revoked.", 403, "REVOKED_TOKEN");
          }

          SANDBOX_REFRESH_TOKENS.delete(token);

          const user = SANDBOX_USERS.find(u => u.id === userId);
          if (!user || !user.isActive) {
            throw new AppError("Account deactivated.", 403, "DEACTIVATED_USER");
          }

          const userPayload: UserSessionPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
          };

          const tokens = this.generateTokens(userPayload);
          SANDBOX_REFRESH_TOKENS.add(tokens.refreshToken);

          return { user: userPayload, ...tokens };
        }
      );
    } catch (err) {
      throw new AppError("Invalid refresh session token.", 403, "INVALID_SESSION");
    }
  }

  /**
   * Revoke session refresh tokens on log out
   */
  public async logout(token: string) {
    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        await prisma.refreshToken.deleteMany({
          where: { token }
        });
        return { success: true };
      },
      async () => {
        SANDBOX_REFRESH_TOKENS.delete(token);
        return { success: true };
      }
    );
  }

  /**
   * Request forgot password reset token
   */
  public async forgotPassword(email: string): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();

    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
          // Silent success to prevent account harvesting
          return "mock-silent-code";
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Map password reset token inside active sessions or store it locally
        // We'll write to a sandbox map for both DB and Sandbox to ensure 100% operation without db overhead
        SANDBOX_RESET_TOKENS.set(resetToken, { email: cleanEmail, expiresAt: expiry });
        logger.info("AUTH_SERVICE", `Password reset token written for ${cleanEmail}: ${resetToken}`);
        return resetToken;
      },
      async () => {
        const user = SANDBOX_USERS.find(u => u.email === cleanEmail);
        if (!user) {
          return "mock-silent-code";
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        
        SANDBOX_RESET_TOKENS.set(resetToken, { email: cleanEmail, expiresAt: expiry });
        logger.info("AUTH_SERVICE", `Password reset token written for ${cleanEmail}: ${resetToken}`);
        return resetToken;
      }
    );
  }

  /**
   * Consume verification token and reset user account password
   */
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const activeReset = SANDBOX_RESET_TOKENS.get(token);
    if (!activeReset || activeReset.expiresAt < new Date()) {
      throw new AppError("Reset token has expired or is invalid.", 400, "INVALID_RESET_TOKEN");
    }

    const cleanEmail = activeReset.email;
    const newHashed = hashPassword(newPassword);

    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        await prisma.user.update({
          where: { email: cleanEmail },
          data: { passwordHash: newHashed }
        });
        SANDBOX_RESET_TOKENS.delete(token);
        logger.info("AUTH_SERVICE", `Database password reset verified for ${cleanEmail}.`);
        return true;
      },
      async () => {
        const userIdx = SANDBOX_USERS.findIndex(u => u.email === cleanEmail);
        if (userIdx === -1) {
          throw new AppError("User not found.", 400, "INVALID_RESET_TOKEN");
        }
        SANDBOX_USERS[userIdx].passwordHash = newHashed;
        SANDBOX_RESET_TOKENS.delete(token);
        logger.info("AUTH_SERVICE", `Sandbox password reset verified for ${cleanEmail}.`);
        return true;
      }
    );
  }

  /**
   * Update active user profile details
   */
  public async updateProfile(userId: string, data: { firstName: string; lastName: string; phoneNumber?: string }) {
    return this.runWithDb(
      async () => {
        const prisma = getPrismaClient();
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
          },
          include: { userRoles: { include: { role: true } } }
        });

        const roleName = updated.userRoles[0]?.role?.name || "VIEWER";
        return {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: roleName,
          phoneNumber: updated.phoneNumber,
          isActive: updated.isActive
        };
      },
      async () => {
        const idx = SANDBOX_USERS.findIndex(u => u.id === userId);
        if (idx === -1) {
          throw new AppError("Staff profile not found.", 404, "USER_NOT_FOUND");
        }
        
        SANDBOX_USERS[idx].firstName = data.firstName;
        SANDBOX_USERS[idx].lastName = data.lastName;
        SANDBOX_USERS[idx].phoneNumber = data.phoneNumber;

        const user = SANDBOX_USERS[idx];
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive
        };
      }
    );
  }
}

export const authService = new AuthService();
export default authService;
