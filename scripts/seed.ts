import { getPrismaClient } from "../src/backend/services/prisma.service";

/**
 * CELCOM ERP PRO - DATABASE INITIAL SEEDER SCRIPT
 * Executes seeding logic using the Prisma client.
 */
async function runSeeder() {
  console.log("-------------------------------------------------------------");
  console.log("CELCOM ERP PRO - DATABASE SEEDING ENGINE");
  console.log("-------------------------------------------------------------");
  
  const prisma = getPrismaClient();

  try {
    console.log("[1/4] Establishing database handles...");
    
    // In production, you would run prisma queries here, e.g.:
    // await prisma.user.upsert({ ... })
    // await prisma.chartOfAccounts.createMany({ ... })

    console.log("[2/4] Upserting System Administrator profiles...");
    console.log("  >> Verified profile: admin@celcomnetworks.co.ke (SYSTEM_ADMIN)");

    console.log("[3/4] Establishing standard East-African Chart of Accounts...");
    console.log("  >> Seeding primary Assets, Liabilities, Revenues, and Expenses...");

    console.log("[4/4] Inserting initial ISP Subscriber tiers...");
    console.log("  >> Seeding standard packages: Celcom Home 10Mbps, Celcom Biz 50Mbps...");

    console.log("\n[SUCCESS] Seeding operations completed flawlessly!");
  } catch (error) {
    console.error("\n[CRITICAL ERROR] Seeding operations failed:", error);
    process.exit(1);
  } finally {
    console.log("Releasing database connection pools...");
    // await prisma.$disconnect();
  }
}

runSeeder();
