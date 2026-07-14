import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { hashPassword } from "../utils/hash";
import { logger } from "./logger.service";
import { AppError } from "../utils/errors";
import { SANDBOX_USERS, SandboxUser } from "./auth.service";

const STORE_PATH = path.join(process.cwd(), "src/backend/data/admin_store.json");

interface CompanyProfile {
  name: string;
  address: string;
  kraPin: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  vatRate: number;
  currency: string;
}

interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  contactPerson: string;
  status: "ACTIVE" | "INACTIVE";
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

interface AdminStore {
  companyProfile: CompanyProfile;
  branches: Branch[];
  auditLogs: AuditLog[];
  sandboxRolePermissions: Record<string, string[]>;
}

class AdminService {
  private isDbConnected = false;

  constructor() {
    this.checkDatabaseLoop();
  }

  private async checkDatabaseLoop() {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      this.isDbConnected = true;
    } catch (err) {
      this.isDbConnected = false;
    }
  }

  private readStore(): AdminStore {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("ADMIN_SERVICE", "Failed to read admin_store.json, using fallback config", e);
    }
    // Return standard fallback if file reading fails
    return {
      companyProfile: {
        name: "Celcom Networks Limited",
        address: "Westlands, Nairobi, Kenya",
        kraPin: "P051234567A",
        contactEmail: "info@celcomnetworks.co.ke",
        contactPhone: "+254 20 1234567",
        website: "www.celcomnetworks.co.ke",
        vatRate: 16.0,
        currency: "KES"
      },
      branches: [],
      auditLogs: [],
      sandboxRolePermissions: {}
    };
  }

  private writeStore(data: AdminStore) {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("ADMIN_SERVICE", "Failed to write admin_store.json to disk", e);
    }
  }

  /**
   * Log administrative events
   */
  public async logAction(userId: string, userEmail: string, action: string, module: string, details: string) {
    const store = this.readStore();
    const newLog: AuditLog = {
      id: `aud_${crypto.randomBytes(4).toString("hex")}`,
      userId,
      userEmail,
      action,
      module,
      details,
      timestamp: new Date().toISOString()
    };
    store.auditLogs.unshift(newLog);
    // Maintain a max of 1000 audit logs on disk
    if (store.auditLogs.length > 1000) {
      store.auditLogs = store.auditLogs.slice(0, 1000);
    }
    this.writeStore(store);
    logger.info("AUDIT_TRAIL", `[${module}] ${action} by ${userEmail}: ${details}`);
  }

  /**
   * GET all system audit logs
   */
  public async getAuditLogs(): Promise<AuditLog[]> {
    const store = this.readStore();
    return store.auditLogs;
  }

  /**
   * GET Company Profile
   */
  public async getCompanyProfile(): Promise<CompanyProfile> {
    const store = this.readStore();
    return store.companyProfile;
  }

  /**
   * UPDATE Company Profile
   */
  public async updateCompanyProfile(actorId: string, actorEmail: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const store = this.readStore();
    store.companyProfile = {
      ...store.companyProfile,
      ...data
    };
    this.writeStore(store);
    await this.logAction(actorId, actorEmail, "COMPANY_SETTINGS_UPDATE", "ADMIN_SYSTEM", "Modified Celcom Networks corporate profile & operational details.");
    return store.companyProfile;
  }

  /**
   * GET Branches
   */
  public async getBranches(): Promise<Branch[]> {
    const store = this.readStore();
    return store.branches;
  }

  /**
   * CREATE Branch
   */
  public async createBranch(actorId: string, actorEmail: string, data: Omit<Branch, "id">): Promise<Branch> {
    const store = this.readStore();
    const newBranch: Branch = {
      id: `br_${crypto.randomBytes(4).toString("hex")}`,
      ...data
    };
    store.branches.push(newBranch);
    this.writeStore(store);
    await this.logAction(actorId, actorEmail, "BRANCH_CREATE", "ADMIN_SYSTEM", `Provisioned new branch location: ${data.name} (${data.code})`);
    return newBranch;
  }

  /**
   * UPDATE Branch
   */
  public async updateBranch(actorId: string, actorEmail: string, branchId: string, data: Partial<Branch>): Promise<Branch> {
    const store = this.readStore();
    const idx = store.branches.findIndex(b => b.id === branchId);
    if (idx === -1) {
      throw new AppError("Branch not found in enterprise registry.", 404);
    }
    store.branches[idx] = {
      ...store.branches[idx],
      ...data
    };
    this.writeStore(store);
    await this.logAction(actorId, actorEmail, "BRANCH_UPDATE", "ADMIN_SYSTEM", `Updated specifications for branch: ${store.branches[idx].name}`);
    return store.branches[idx];
  }

  /**
   * DELETE / DEACTIVATE Branch
   */
  public async deleteBranch(actorId: string, actorEmail: string, branchId: string): Promise<boolean> {
    const store = this.readStore();
    const idx = store.branches.findIndex(b => b.id === branchId);
    if (idx === -1) {
      throw new AppError("Branch not found.", 404);
    }
    const name = store.branches[idx].name;
    store.branches.splice(idx, 1);
    this.writeStore(store);
    await this.logAction(actorId, actorEmail, "BRANCH_DELETE", "ADMIN_SYSTEM", `Removed branch location from roster: ${name}`);
    return true;
  }

  /**
   * GET System Users
   */
  public async getUsers() {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const dbUsers = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        });
        return dbUsers.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          phoneNumber: u.phoneNumber,
          isActive: u.isActive,
          createdAt: u.createdAt,
          role: u.userRoles[0]?.role?.name || "VIEWER"
        }));
      } catch (e) {
        logger.error("ADMIN_SERVICE", "Failed to fetch db users, falling back to sandbox users", e);
      }
    }

    return SANDBOX_USERS.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive,
      createdAt: u.createdAt,
      role: u.role
    }));
  }

  /**
   * CREATE User
   */
  public async createUser(
    actorId: string,
    actorEmail: string,
    data: { email: string; password?: string; firstName: string; lastName: string; phoneNumber?: string; role: string }
  ) {
    const cleanEmail = data.email.toLowerCase().trim();
    const password = data.password || "CelcomStaffDefault2026!";
    const hashed = hashPassword(password);

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          throw new AppError("An account with that email already exists.", 400);
        }

        const roleRecord = await prisma.role.findFirst({ where: { name: data.role } });
        if (!roleRecord) {
          throw new AppError(`Designated role '${data.role}' does not exist.`, 400);
        }

        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash: hashed,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber || null,
            isActive: true,
            userRoles: {
              create: {
                roleId: roleRecord.id
              }
            }
          }
        });

        await this.logAction(actorId, actorEmail, "USER_CREATE", "USER_MANAGEMENT", `Registered new staff member: ${data.firstName} ${data.lastName} (${cleanEmail}) as ${data.role}`);
        return {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
          role: data.role
        };
      } catch (e: any) {
        if (e instanceof AppError) throw e;
        logger.error("ADMIN_SERVICE", "Failed to register DB user, attempting Sandbox fallback", e);
      }
    }

    // Sandbox Fallback
    const existing = SANDBOX_USERS.find(u => u.email === cleanEmail);
    if (existing) {
      throw new AppError("An account with that email already exists.", 400);
    }

    const newSandboxUser: SandboxUser = {
      id: `usr_${crypto.randomBytes(4).toString("hex")}`,
      email: cleanEmail,
      passwordHash: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      isActive: true,
      createdAt: new Date()
    };

    SANDBOX_USERS.push(newSandboxUser);
    await this.logAction(actorId, actorEmail, "USER_CREATE", "USER_MANAGEMENT", `Registered new sandbox staff: ${data.firstName} ${data.lastName} (${cleanEmail}) as ${data.role}`);

    return {
      id: newSandboxUser.id,
      email: newSandboxUser.email,
      firstName: newSandboxUser.firstName,
      lastName: newSandboxUser.lastName,
      phoneNumber: newSandboxUser.phoneNumber,
      isActive: newSandboxUser.isActive,
      createdAt: newSandboxUser.createdAt,
      role: newSandboxUser.role
    };
  }

  /**
   * EDIT User
   */
  public async updateUser(
    actorId: string,
    actorEmail: string,
    userId: string,
    data: { email: string; firstName: string; lastName: string; phoneNumber?: string; role: string; isActive: boolean }
  ) {
    const cleanEmail = data.email.toLowerCase().trim();

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        
        // Ensure email isn't stolen
        const duplicate = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: userId } }
        });
        if (duplicate) {
          throw new AppError("Email is already taken by another user.", 400);
        }

        const roleRecord = await prisma.role.findFirst({ where: { name: data.role } });
        if (!roleRecord) {
          throw new AppError(`Designated role '${data.role}' does not exist.`, 400);
        }

        // Update core user
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: cleanEmail,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber || null,
            isActive: data.isActive
          }
        });

        // Update role
        await prisma.userRole.deleteMany({ where: { userId } });
        await prisma.userRole.create({
          data: {
            userId,
            roleId: roleRecord.id
          }
        });

        await this.logAction(actorId, actorEmail, "USER_UPDATE", "USER_MANAGEMENT", `Modified staff configurations for ${data.firstName} ${data.lastName} (${cleanEmail}). Status: ${data.isActive ? 'ACTIVE' : 'DEACTIVATED'}`);
        
        return {
          id: userId,
          email: cleanEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          isActive: data.isActive,
          role: data.role
        };
      } catch (e: any) {
        if (e instanceof AppError) throw e;
        logger.error("ADMIN_SERVICE", "Failed to update database user, attempting Sandbox fallback", e);
      }
    }

    // Sandbox Mode
    const userIdx = SANDBOX_USERS.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      throw new AppError("User not found in system registry.", 404);
    }

    const duplicate = SANDBOX_USERS.find(u => u.email === cleanEmail && u.id !== userId);
    if (duplicate) {
      throw new AppError("Email is already taken by another user.", 400);
    }

    SANDBOX_USERS[userIdx] = {
      ...SANDBOX_USERS[userIdx],
      email: cleanEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      isActive: data.isActive
    };

    await this.logAction(actorId, actorEmail, "USER_UPDATE", "USER_MANAGEMENT", `Modified sandbox staff configurations for ${data.firstName} ${data.lastName} (${cleanEmail}). Status: ${data.isActive ? 'ACTIVE' : 'DEACTIVATED'}`);

    return {
      id: userId,
      email: cleanEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      isActive: data.isActive,
      role: data.role
    };
  }

  /**
   * DEACTIVATE User
   */
  public async deactivateUser(actorId: string, actorEmail: string, userId: string) {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const user = await prisma.user.update({
          where: { id: userId },
          data: { isActive: false }
        });
        await this.logAction(actorId, actorEmail, "USER_DEACTIVATE", "USER_MANAGEMENT", `Deactivated account: ${user.firstName} ${user.lastName} (${user.email})`);
        return true;
      } catch (e) {
        logger.error("ADMIN_SERVICE", "Failed to deactivate DB user", e);
      }
    }

    const idx = SANDBOX_USERS.findIndex(u => u.id === userId);
    if (idx !== -1) {
      SANDBOX_USERS[idx].isActive = false;
      await this.logAction(actorId, actorEmail, "USER_DEACTIVATE", "USER_MANAGEMENT", `Deactivated sandbox account: ${SANDBOX_USERS[idx].firstName} ${SANDBOX_USERS[idx].lastName} (${SANDBOX_USERS[idx].email})`);
      return true;
    }

    throw new AppError("User not found.", 404);
  }

  /**
   * GET Permissions and Role Permissions Map
   */
  public async getRolePermissionsMatrix() {
    const store = this.readStore();

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
        const permissions = await prisma.permission.findMany({ orderBy: { slug: "asc" } });
        const rolePermissions = await prisma.rolePermission.findMany({
          include: {
            role: true,
            permission: true
          }
        });

        // Format matrices
        const matrix: Record<string, string[]> = {};
        for (const role of roles) {
          matrix[role.name] = [];
        }

        for (const rp of rolePermissions) {
          if (rp.role && rp.permission) {
            matrix[rp.role.name].push(rp.permission.slug);
          }
        }

        return {
          roles: roles.map(r => ({ id: r.id, name: r.name, description: r.description })),
          permissions: permissions.map(p => ({ id: p.id, slug: p.slug, description: p.description })),
          matrix
        };
      } catch (e) {
        logger.error("ADMIN_SERVICE", "Database role matrices lookup failed, falling back to Sandbox stores.", e);
      }
    }

    // Sandbox Role Permissions Matrix
    // Generate simple metadata rosters
    const mockRoles = [
      { id: "r_1", name: "SUPER_ADMIN", description: "Full root access to all ERP modules and OLT GPON endpoints" },
      { id: "r_2", name: "MANAGING_DIRECTOR", description: "Executive operations oversight, report intelligence, and audit reviews" },
      { id: "r_3", name: "ACCOUNTANT", description: "Handles double-entry general ledger, invoicing, tax compliance, and payroll calculations" },
      { id: "r_4", name: "HR_MANAGER", description: "Manages staff profiles, contracts, statutory PAYE calculations, and timesheets" },
      { id: "r_5", name: "SALES", description: "Registers customer prospects, issues quotes, and coordinates initial GPON drop installations" },
      { id: "r_6", name: "PROCUREMENT", description: "Generates Local Purchase Orders (LPOs) and maintains suppliers rosters" },
      { id: "r_7", name: "STORE_MANAGER", description: "Warehouse coordinator tracking hardware stock assets, serialized ONTs, and fibers" },
      { id: "r_8", name: "TECHNICIAN", description: "Physical ODF fiber splicing, subscriber optic drops, OLT port tuning, and OLT telemetry" },
      { id: "r_9", name: "CUSTOMER_SUPPORT", description: "Manages active service SLA tickets, subscriber profiles, and initiates support diagnostics" },
      { id: "r_10", name: "VIEWER", description: "Read-only access to operations for audit, research, and general administrative view" }
    ];

    const mockPermissions = [
      { id: "p_1", slug: "users:create", description: "Create staff user accounts" },
      { id: "p_2", slug: "users:read", description: "View staff list and profiles" },
      { id: "p_3", slug: "users:update", description: "Modify staff user accounts" },
      { id: "p_4", slug: "users:delete", description: "Deactivate/delete staff accounts" },
      { id: "p_5", slug: "roles:manage", description: "Manage roles and security permissions matrix" },
      { id: "p_6", slug: "roles:read", description: "View access control roles" },
      { id: "p_7", slug: "subscribers:create", description: "Provision and activate new GPON subscribers" },
      { id: "p_8", slug: "subscribers:read", description: "View subscriber status and routing profiles" },
      { id: "p_9", slug: "subscribers:update", description: "Modify subscriber bandwidth and optical profile" },
      { id: "p_10", slug: "subscribers:delete", description: "Suspend or terminate subscriber accounts" },
      { id: "p_11", slug: "billing:manage", description: "Issue invoices, process payments, write ledger adjustments" },
      { id: "p_12", slug: "billing:read", description: "View billing history, invoices, and transaction receipts" },
      { id: "p_13", slug: "olt:manage", description: "Modify OLT light values, configuration profiles and splitters" },
      { id: "p_14", slug: "olt:read", description: "View active OLT hardware telemetry and optic levels" },
      { id: "p_15", slug: "payroll:manage", description: "Process staff salary, NHIF, housing levy, and tax filings" },
      { id: "p_16", slug: "payroll:read", description: "View corporate payroll spreadsheets and staff slips" },
      { id: "p_17", slug: "reports:read", description: "Read general ledger, tax audits, SLA performance, and growth reports" }
    ];

    return {
      roles: mockRoles,
      permissions: mockPermissions,
      matrix: store.sandboxRolePermissions || {}
    };
  }

  /**
   * UPDATE Role Permissions Matrix
   */
  public async updateRolePermissions(actorId: string, actorEmail: string, roleName: string, permissionSlugs: string[]) {
    const store = this.readStore();

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          throw new AppError(`Role '${roleName}' not found in database.`, 404);
        }

        // Fast clean and recreate
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

        // Resolve slugs to IDs
        const permissions = await prisma.permission.findMany({
          where: { slug: { in: permissionSlugs } }
        });

        const newLinks = permissions.map(p => ({
          roleId: role.id,
          permissionId: p.id
        }));

        await prisma.rolePermission.createMany({ data: newLinks });
        
        await this.logAction(actorId, actorEmail, "ROLE_PERMISSIONS_UPDATE", "PERMISSIONS_MATRIX", `Updated security permissions matrix for role: ${roleName}. Allowed: [${permissionSlugs.join(", ")}]`);
        
        return true;
      } catch (e) {
        logger.error("ADMIN_SERVICE", `Failed database permissions update for ${roleName}, applying Sandbox fallback.`, e);
      }
    }

    // Sandbox
    if (!store.sandboxRolePermissions) {
      store.sandboxRolePermissions = {};
    }
    store.sandboxRolePermissions[roleName] = permissionSlugs;
    this.writeStore(store);

    await this.logAction(actorId, actorEmail, "ROLE_PERMISSIONS_UPDATE", "PERMISSIONS_MATRIX", `Updated sandbox security permissions matrix for role: ${roleName}. Allowed: [${permissionSlugs.join(", ")}]`);
    return true;
  }
}

export const adminService = new AdminService();
export default adminService;
