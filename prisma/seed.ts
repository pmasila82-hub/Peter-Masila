import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/backend/utils/hash";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CELCOM ERP PRO SEEDING PROCESS STARTED ===");

  // 1. Core Permission Slugs Definition
  const permissionsData = [
    { slug: "users:create", description: "Create staff user accounts" },
    { slug: "users:read", description: "View staff list and profiles" },
    { slug: "users:update", description: "Modify staff user accounts" },
    { slug: "users:delete", description: "Deactivate/delete staff accounts" },
    
    { slug: "roles:manage", description: "Manage roles and security permissions matrix" },
    { slug: "roles:read", description: "View access control roles" },
    
    { slug: "subscribers:create", description: "Provision and activate new GPON subscribers" },
    { slug: "subscribers:read", description: "View subscriber status and routing profiles" },
    { slug: "subscribers:update", description: "Modify subscriber bandwidth and optical profile" },
    { slug: "subscribers:delete", description: "Suspend or terminate subscriber accounts" },
    
    { slug: "billing:manage", description: "Issue invoices, process payments, write ledger adjustments" },
    { slug: "billing:read", description: "View billing history, invoices, and transaction receipts" },
    
    { slug: "olt:manage", description: "Modify OLT light values, configuration profiles and splitters" },
    { slug: "olt:read", description: "View active OLT hardware telemetry and optic levels" },
    
    { slug: "payroll:manage", description: "Process staff salary, NHIF, housing levy, and tax filings" },
    { slug: "payroll:read", description: "View corporate payroll spreadsheets and staff slips" },
    
    { slug: "reports:read", description: "Read general ledger, tax audits, SLA performance, and growth reports" },
  ];

  console.log("Seeding security permission definitions...");
  const seededPermissions: Record<string, string> = {};
  for (const perm of permissionsData) {
    const record = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: { description: perm.description },
      create: { slug: perm.slug, description: perm.description },
    });
    seededPermissions[perm.slug] = record.id;
  }
  console.log(`Seeded ${Object.keys(seededPermissions).length} permission levels.`);

  // 2. Core Roles Definition
  const rolesData = [
    { name: "SUPER_ADMIN", description: "Full root access to all ERP modules and OLT GPON endpoints" },
    { name: "MANAGING_DIRECTOR", description: "Executive operations oversight, report intelligence, and audit reviews" },
    { name: "ACCOUNTANT", description: "Handles double-entry general ledger, invoicing, tax compliance, and payroll calculations" },
    { name: "HR_MANAGER", description: "Manages staff profiles, contracts, statutory PAYE calculations, and timesheets" },
    { name: "SALES", description: "Registers customer prospects, issues quotes, and coordinates initial GPON drop installations" },
    { name: "PROCUREMENT", description: "Generates Local Purchase Orders (LPOs) and maintains suppliers rosters" },
    { name: "STORE_MANAGER", description: "Warehouse coordinator tracking hardware stock assets, serialized ONTs, and fibers" },
    { name: "TECHNICIAN", description: "Physical ODF fiber splicing, subscriber optic drops, OLT port tuning, and OLT telemetry" },
    { name: "CUSTOMER_SUPPORT", description: "Manages active service SLA tickets, subscriber profiles, and initiates support diagnostics" },
    { name: "VIEWER", description: "Read-only access to operations for audit, research, and general administrative view" },
  ];

  console.log("Seeding system role definitions...");
  const seededRoles: Record<string, string> = {};
  for (const r of rolesData) {
    const record = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    seededRoles[r.name] = record.id;
  }
  console.log(`Seeded ${Object.keys(seededRoles).length} security roles.`);

  // 3. Define Role-Permission Matrices
  const rolePermissionsMatrix: Record<string, string[]> = {
    SUPER_ADMIN: permissionsData.map(p => p.slug), // All permissions
    MANAGING_DIRECTOR: permissionsData.map(p => p.slug), // All permissions
    ACCOUNTANT: [
      "users:read",
      "subscribers:read",
      "billing:manage",
      "billing:read",
      "payroll:read",
      "reports:read"
    ],
    HR_MANAGER: [
      "users:create",
      "users:read",
      "users:update",
      "payroll:manage",
      "payroll:read",
      "reports:read"
    ],
    SALES: [
      "subscribers:create",
      "subscribers:read",
      "subscribers:update",
      "billing:read",
      "reports:read"
    ],
    PROCUREMENT: [
      "reports:read"
    ],
    STORE_MANAGER: [
      "reports:read"
    ],
    TECHNICIAN: [
      "subscribers:read",
      "subscribers:update",
      "olt:manage",
      "olt:read"
    ],
    CUSTOMER_SUPPORT: [
      "subscribers:read",
      "subscribers:update",
      "olt:read"
    ],
    VIEWER: [
      "users:read",
      "roles:read",
      "subscribers:read",
      "billing:read",
      "olt:read",
      "payroll:read",
      "reports:read"
    ]
  };

  console.log("Populating Role-Permission access matrices...");
  for (const [roleName, permSlugs] of Object.entries(rolePermissionsMatrix)) {
    const roleId = seededRoles[roleName];
    if (!roleId) continue;

    // Fast cleanup of existing links for idempotency
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    const rolePermLinks = permSlugs.map(slug => ({
      roleId,
      permissionId: seededPermissions[slug],
    })).filter(link => link.permissionId !== undefined);

    await prisma.rolePermission.createMany({
      data: rolePermLinks,
    });
  }
  console.log("Role-Permission security matrices configured successfully.");

  // 4. Create Default Administrative Staff User Account
  const adminEmail = "admin@celcomnetworks.co.ke";
  const defaultPassword = "AdminSecurePassword2026!";
  const adminPasswordHash = hashPassword(defaultPassword);

  console.log(`Checking/Instantiating default administrator account [${adminEmail}]...`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      firstName: "Admin",
      lastName: "Root",
      passwordHash: adminPasswordHash,
      phoneNumber: "+254700000000",
      isActive: true,
    },
  });

  // Assign SUPER_ADMIN role to the admin user
  const superAdminRoleId = seededRoles["SUPER_ADMIN"];
  if (superAdminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRoleId,
      },
    });
  }

  console.log("=================================================");
  console.log("Default Administrator Created Successfully!");
  console.log(`Email:      ${adminEmail}`);
  console.log(`Password:   ${defaultPassword}`);
  console.log("=================================================");
  console.log("=== CELCOM ERP PRO SEEDING COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Error occurred during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
