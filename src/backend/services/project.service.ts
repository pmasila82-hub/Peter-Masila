import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";

const PROJECT_STORE_PATH = path.join(process.cwd(), "src/backend/data/project_store.json");
const INVENTORY_STORE_PATH = path.join(process.cwd(), "src/backend/data/inventory_store.json");
const SALES_STORE_PATH = path.join(process.cwd(), "src/backend/data/sales_store.json");
const CRM_STORE_PATH = path.join(process.cwd(), "src/backend/data/crm_store.json");

// -------------------------------------------------------------
// INTERFACES
// -------------------------------------------------------------

export interface ProjectMaterialAllocation {
  id: string;
  projectId: string;
  productId: string;
  productName: string;
  sku: string;
  quantityRequired: number;
  quantityIssued: number;
  quantityUsed: number;
  quantityReturned: number;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: "TRANSPORT" | "LABOUR" | "EQUIPMENT" | "OTHER";
  description: string;
  amount: number;
  date: string;
}

export interface ProjectStoreProject {
  id: string;
  projectNumber: string;
  name: string;
  customerId: string;
  customerName: string;
  projectType: "FIBRE_INSTALLATION" | "CCTV_INSTALLATION" | "NETWORKING" | "WIRELESS_INSTALLATION" | "MAINTENANCE" | "OTHER";
  projectManager: string;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  budget: number;
  status: "PLANNING" | "APPROVED" | "IN_PROGRESS" | "TESTING" | "COMPLETED" | "CANCELLED";
  description: string;
  materials: ProjectMaterialAllocation[];
  expenses: ProjectExpense[];
  labourCost: number;
  transportCost: number;
  otherExpenses: number;
  totalProjectCost: number;
  profitMargin: number; // percentage
}

export interface SiteSurvey {
  id: string;
  surveyNumber: string;
  customerId: string;
  customerName: string;
  location: string;
  gpsCoordinates: string;
  surveyDate: string;
  surveyTechnician: string;
  requirements: string;
  photos: string[];
  recommendations: string;
  estimatedMaterials: { productId: string; name: string; sku: string; quantity: number; cost: number }[];
  estimatedLabourCost: number;
}

export interface ProjectTask {
  id: string;
  taskNumber: string;
  projectId: string;
  projectName: string;
  assignedEmployee: string; // Employee Name
  description: string;
  startDate: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
}

export interface FibreInstallationRecord {
  id: string;
  projectId: string;
  projectName: string;
  customerName: string;
  routeDetails: string;
  cableLength: number; // in meters
  fibreType: string;
  ontSerialNumber: string;
  router: string;
  signalTestResults: string; // e.g. "-19dBm"
  installationDate: string;
  technician: string;
  photos: string[];
}

export interface CCTVInstallationRecord {
  id: string;
  projectId: string;
  projectName: string;
  customerName: string;
  cameraQuantity: number;
  cameraType: string;
  dvrNvrModel: string;
  storageCapacity: string;
  cableUsed: string;
  installationDate: string;
  technician: string;
}

export interface MaintenanceContract {
  id: string;
  customerId: string;
  customerName: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  servicesIncluded: string;
  renewalDate: string;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
}

export interface JobCard {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  issue: string;
  technician: string;
  date: string;
  workDone: string;
  materialsUsed: string;
  customerSignature: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

export interface CompletionCertificate {
  id: string;
  projectId: string;
  projectNumber: string;
  projectName: string;
  customerName: string;
  workCompleted: string;
  equipmentInstalled: string;
  warranty: string;
  customerApprovalName: string;
  technicianSignature: string;
  dateSigned: string;
}

export interface ProjectStoreData {
  projects: ProjectStoreProject[];
  surveys: SiteSurvey[];
  tasks: ProjectTask[];
  fibreRecords: FibreInstallationRecord[];
  cctvRecords: CCTVInstallationRecord[];
  maintenanceContracts: MaintenanceContract[];
  jobCards: JobCard[];
  completionCertificates: CompletionCertificate[];
}

export class ProjectService {
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

  // -------------------------------------------------------------
  // STORE PERSISTENCE
  // -------------------------------------------------------------

  private readStore(): ProjectStoreData {
    try {
      if (fs.existsSync(PROJECT_STORE_PATH)) {
        const raw = fs.readFileSync(PROJECT_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("PROJECT_SERVICE", "Failed to read project_store.json, building initial seed data", e);
    }

    // High quality initial seed data
    const seedStore: ProjectStoreData = {
      projects: [
        {
          id: "prj-1",
          projectNumber: "PRJ-2026-001",
          name: "Westlands Mall High-Speed Fibre Connection",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          projectType: "FIBRE_INSTALLATION",
          projectManager: "Sarah Mwangi",
          startDate: "2026-07-10",
          expectedCompletionDate: "2026-07-25",
          budget: 250000,
          status: "IN_PROGRESS",
          description: "Splicing and routing GPON high-speed fiber link to Westlands Mall administrative blocks and anchoring OLT backbone nodes.",
          materials: [
            {
              id: "mat-1",
              projectId: "prj-1",
              productId: "prod-1",
              productName: "Mikrotik hEX gr3 Gigabit Router",
              sku: "MT-HEX-GR3",
              quantityRequired: 2,
              quantityIssued: 2,
              quantityUsed: 1,
              quantityReturned: 1
            }
          ],
          expenses: [
            {
              id: "exp-1",
              projectId: "prj-1",
              category: "TRANSPORT",
              description: "Technician transit fuel allowance",
              amount: 5000,
              date: "2026-07-11"
            },
            {
              id: "exp-2",
              projectId: "prj-1",
              category: "LABOUR",
              description: "Fiber splicing sub-contractor daily rate",
              amount: 15000,
              date: "2026-07-12"
            }
          ],
          labourCost: 15000,
          transportCost: 5000,
          otherExpenses: 0,
          totalProjectCost: 29500, // (1 * prod-1 cost [6500] + expenses)
          profitMargin: 88.2
        },
        {
          id: "prj-2",
          projectNumber: "PRJ-2026-002",
          name: "Kilimani Estate Surveillance Deployment",
          customerId: "cust-2",
          customerName: "Kilimani Heights Apartments",
          projectType: "CCTV_INSTALLATION",
          projectManager: "Felix Kemboi",
          startDate: "2026-07-12",
          expectedCompletionDate: "2026-08-05",
          budget: 450000,
          status: "PLANNING",
          description: "Full deployment of 12 IP cameras, network recording equipment, outdoor fiber conduit routing, and power backups.",
          materials: [],
          expenses: [],
          labourCost: 0,
          transportCost: 0,
          otherExpenses: 0,
          totalProjectCost: 0,
          profitMargin: 100
        }
      ],
      surveys: [
        {
          id: "srv-1",
          surveyNumber: "SRV-2026-001",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          location: "Ring Road Westlands, Block C",
          gpsCoordinates: "-1.2644, 36.8044",
          surveyDate: "2026-07-08",
          surveyTechnician: "Joseph Kariuki",
          requirements: "Requires 150m outdoor armor-plated fiber cable, GPON SFP+ optical module, and 1x Mikrotik hEX Gigabit Router. Power supply must be protected via line-interactive UPS.",
          photos: [],
          recommendations: "Recommend utilizing existing underground conduits from Pole 42 to main riser room. Signal levels estimated at -19dBm with very low loss.",
          estimatedMaterials: [
            { productId: "prod-1", name: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 2, cost: 6500 }
          ],
          estimatedLabourCost: 12000
        }
      ],
      tasks: [
        {
          id: "tsk-1",
          taskNumber: "TSK-2026-001",
          projectId: "prj-1",
          projectName: "Westlands Mall High-Speed Fibre Connection",
          assignedEmployee: "Joseph Kariuki",
          description: "Laying optical drop fiber cable from external pole to Server Room C.",
          startDate: "2026-07-10",
          dueDate: "2026-07-14",
          priority: "HIGH",
          status: "IN_PROGRESS"
        },
        {
          id: "tsk-2",
          taskNumber: "TSK-2026-002",
          projectId: "prj-1",
          projectName: "Westlands Mall High-Speed Fibre Connection",
          assignedEmployee: "David Mwangi",
          description: "Splicing optical fiber distribution drawer and running initial ONT tests.",
          startDate: "2026-07-15",
          dueDate: "2026-07-18",
          priority: "MEDIUM",
          status: "PENDING"
        }
      ],
      fibreRecords: [
        {
          id: "fib-1",
          projectId: "prj-1",
          projectName: "Westlands Mall High-Speed Fibre Connection",
          customerName: "Westlands Retail Center",
          routeDetails: "Pole 42 -> Underground Conduit B -> Block C Riser -> Floor 2 Server Room",
          cableLength: 180,
          fibreType: "Single Mode G.652D",
          ontSerialNumber: "ONT-HW-2026-9801",
          router: "Mikrotik hEX gr3 (S/N: 77890123)",
          signalTestResults: "-18.4 dBm",
          installationDate: "2026-07-13",
          technician: "Joseph Kariuki",
          photos: []
        }
      ],
      cctvRecords: [],
      maintenanceContracts: [
        {
          id: "mc-1",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          contractNumber: "MC-2026-01",
          contractType: "ANNUAL_PREMIUM",
          startDate: "2026-07-15",
          endDate: "2027-07-14",
          monthlyFee: 25000,
          servicesIncluded: "Monthly optical line health inspections, immediate emergency splicing SLA within 4 hours, router firmware maintenance, and continuous ping telemetry monitoring.",
          renewalDate: "2027-06-15",
          status: "ACTIVE"
        }
      ],
      jobCards: [
        {
          id: "jc-1",
          jobNumber: "JC-2026-001",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          issue: "Subsequent fiber packet drop reported in Core Segment 2 after administrative block remodeling.",
          technician: "David Mwangi",
          date: "2026-07-13",
          workDone: "Inspected riser splice cassette. Discovered micro-bends on fiber tail. Re-spliced target core, secured armor-plated sleeve, and verified signal at -19.0dBm.",
          materialsUsed: "1x Optical splice sleeve, 2m indoor armored fiber patch cord.",
          customerSignature: "John Wambua (Mall Operations Manager)",
          status: "COMPLETED"
        }
      ],
      completionCertificates: [
        {
          id: "cert-1",
          projectId: "prj-1",
          projectNumber: "PRJ-2026-001",
          projectName: "Westlands Mall High-Speed Fibre Connection",
          customerName: "Westlands Retail Center",
          workCompleted: "Fibre drop cable installation, optical distribution frame integration, laser splicing, and core router configurations.",
          equipmentInstalled: "1x Mikrotik hEX gr3 Gigabit Router (S/N: 77890123), 1x GPON Huawei ONT",
          warranty: "12 Months hardware replacement, 3 Months labor warranty",
          customerApprovalName: "John Wambua",
          technicianSignature: "Sarah Mwangi (Project Manager)",
          dateSigned: "2026-07-14"
        }
      ]
    };

    this.writeStore(seedStore);
    return seedStore;
  }

  private writeStore(data: ProjectStoreData) {
    try {
      const dir = path.dirname(PROJECT_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PROJECT_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("PROJECT_SERVICE", "Failed to write project_store.json", e);
    }
  }

  // Helper to fetch list of products from Inventory module to populate dropdowns
  private getInventoryProducts(): any[] {
    try {
      if (fs.existsSync(INVENTORY_STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(INVENTORY_STORE_PATH, "utf-8"));
        return data.products || [];
      }
    } catch (e) {
      logger.error("PROJECT_SERVICE", "Failed to load inventory products", e);
    }
    return [
      { id: "prod-1", sku: "MT-HEX-GR3", name: "Mikrotik hEX gr3 Gigabit Router", costPrice: 6500 },
      { id: "prod-2", sku: "UBNT-UAP-AC-LITE", name: "Ubiquiti UniFi AC Lite AP", costPrice: 9000 },
      { id: "prod-3", sku: "HK-DOME-5MP", name: "Hikvision 5MP Dome Camera", costPrice: 4200 }
    ];
  }

  // -------------------------------------------------------------
  // SERVICE METHODS
  // -------------------------------------------------------------

  public async getDashboardStats() {
    const store = this.readStore();
    const active = store.projects.filter(p => ["IN_PROGRESS", "APPROVED", "TESTING"].includes(p.status)).length;
    const completed = store.projects.filter(p => p.status === "COMPLETED").length;
    
    // Budgets & Profits
    let totalBudget = 0;
    let totalCost = 0;
    store.projects.forEach(p => {
      totalBudget += p.budget;
      totalCost += p.totalProjectCost;
    });

    const profitRatio = totalBudget > 0 ? ((totalBudget - totalCost) / totalBudget) * 100 : 0;

    return {
      totalProjects: store.projects.length,
      activeProjects: active,
      completedProjects: completed,
      totalBudget,
      totalCost,
      averageProfitMargin: profitRatio,
      taskCount: store.tasks.length,
      surveyCount: store.surveys.length,
      jobCardCount: store.jobCards.length,
      contractCount: store.maintenanceContracts.length
    };
  }

  // PROJECTS
  public async getProjects() {
    return this.readStore().projects;
  }

  public async getProjectById(id: string) {
    const store = this.readStore();
    return store.projects.find(p => p.id === id);
  }

  public async createProject(data: any) {
    const store = this.readStore();
    const projectNumber = `PRJ-2026-${String(store.projects.length + 1).padStart(3, "0")}`;
    
    const newProject: ProjectStoreProject = {
      id: `prj-${crypto.randomUUID()}`,
      projectNumber,
      name: data.name,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom ERP Customer",
      projectType: data.projectType || "OTHER",
      projectManager: data.projectManager || "N/A",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      expectedCompletionDate: data.expectedCompletionDate || "",
      budget: Number(data.budget) || 0,
      status: "PLANNING",
      description: data.description || "",
      materials: [],
      expenses: [],
      labourCost: 0,
      transportCost: 0,
      otherExpenses: 0,
      totalProjectCost: 0,
      profitMargin: 100
    };

    store.projects.push(newProject);
    this.writeStore(store);
    return newProject;
  }

  public async updateProject(id: string, data: any) {
    const store = this.readStore();
    const index = store.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const project = store.projects[index];
    const oldStatus = project.status;

    // Direct modifications
    project.name = data.name !== undefined ? data.name : project.name;
    project.projectType = data.projectType !== undefined ? data.projectType : project.projectType;
    project.projectManager = data.projectManager !== undefined ? data.projectManager : project.projectManager;
    project.startDate = data.startDate !== undefined ? data.startDate : project.startDate;
    project.expectedCompletionDate = data.expectedCompletionDate !== undefined ? data.expectedCompletionDate : project.expectedCompletionDate;
    project.budget = data.budget !== undefined ? Number(data.budget) : project.budget;
    project.status = data.status !== undefined ? data.status : project.status;
    project.description = data.description !== undefined ? data.description : project.description;

    // Recalculate cost
    this.calculateProjectCostInternal(project);

    // FINANCE INTEGRATION: On complete
    if (project.status === "COMPLETED" && oldStatus !== "COMPLETED") {
      project.actualCompletionDate = new Date().toISOString().split("T")[0];
      await this.triggerFinanceIntegration(project);
    }

    store.projects[index] = project;
    this.writeStore(store);
    return project;
  }

  public async deleteProject(id: string) {
    const store = this.readStore();
    const filter = store.projects.filter(p => p.id !== id);
    if (filter.length === store.projects.length) return false;
    store.projects = filter;
    this.writeStore(store);
    return true;
  }

  // EXPENSES
  public async addProjectExpense(projectId: string, data: any) {
    const store = this.readStore();
    const pIndex = store.projects.findIndex(p => p.id === projectId);
    if (pIndex === -1) throw new Error("Project not found");

    const project = store.projects[pIndex];
    const newExpense: ProjectExpense = {
      id: `exp-${crypto.randomUUID()}`,
      projectId,
      category: data.category || "OTHER",
      description: data.description || "Project Expense",
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().split("T")[0]
    };

    project.expenses.push(newExpense);
    
    // Update direct expense categories
    if (newExpense.category === "LABOUR") project.labourCost += newExpense.amount;
    else if (newExpense.category === "TRANSPORT") project.transportCost += newExpense.amount;
    else project.otherExpenses += newExpense.amount;

    this.calculateProjectCostInternal(project);
    this.writeStore(store);
    return newExpense;
  }

  // MATERIALS INTEGRATION
  public async addMaterialAllocation(projectId: string, data: any) {
    const store = this.readStore();
    const pIndex = store.projects.findIndex(p => p.id === projectId);
    if (pIndex === -1) throw new Error("Project not found");

    const project = store.projects[pIndex];
    const products = this.getInventoryProducts();
    const targetProduct = products.find(prod => prod.id === data.productId || prod.sku === data.sku);

    const allocation: ProjectMaterialAllocation = {
      id: `mat-${crypto.randomUUID()}`,
      projectId,
      productId: data.productId || targetProduct?.id || "prod-custom",
      productName: targetProduct?.name || data.productName || "Custom Material",
      sku: targetProduct?.sku || data.sku || "SKU-CUSTOM",
      quantityRequired: Number(data.quantityRequired) || 0,
      quantityIssued: 0,
      quantityUsed: 0,
      quantityReturned: 0
    };

    project.materials.push(allocation);
    this.writeStore(store);
    return allocation;
  }

  public async updateMaterialStatus(projectId: string, allocationId: string, action: "ISSUE" | "USE" | "RETURN", quantity: number) {
    const store = this.readStore();
    const pIndex = store.projects.findIndex(p => p.id === projectId);
    if (pIndex === -1) throw new Error("Project not found");

    const project = store.projects[pIndex];
    const matIndex = project.materials.findIndex(m => m.id === allocationId);
    if (matIndex === -1) throw new Error("Material allocation not found");

    const mat = project.materials[matIndex];
    const qty = Number(quantity) || 0;

    if (action === "ISSUE") {
      mat.quantityIssued += qty;
      this.triggerInventoryTransaction(mat.productId, -qty, "STOCK_OUT", `Issued for project ${project.projectNumber}`);
    } else if (action === "USE") {
      mat.quantityUsed += qty;
    } else if (action === "RETURN") {
      mat.quantityReturned += qty;
      this.triggerInventoryTransaction(mat.productId, qty, "STOCK_IN", `Returned from project ${project.projectNumber}`);
    }

    this.calculateProjectCostInternal(project);
    this.writeStore(store);
    return mat;
  }

  // Internal helper to calculate cost & profit margin
  private calculateProjectCostInternal(project: ProjectStoreProject) {
    const products = this.getInventoryProducts();
    
    // Sum of used material cost
    let materialCostSum = 0;
    project.materials.forEach(mat => {
      const match = products.find(p => p.id === mat.productId);
      const unitPrice = match ? match.costPrice : 1000; // fallback cost
      materialCostSum += mat.quantityUsed * unitPrice;
    });

    // Labours & Transports are summed from expenses
    let labourSum = 0;
    let transportSum = 0;
    let otherSum = 0;
    project.expenses.forEach(e => {
      if (e.category === "LABOUR") labourSum += e.amount;
      else if (e.category === "TRANSPORT") transportSum += e.amount;
      else otherSum += e.amount;
    });

    project.labourCost = labourSum;
    project.transportCost = transportSum;
    project.otherExpenses = otherSum;

    project.totalProjectCost = materialCostSum + labourSum + transportSum + otherSum;

    // Profit margin = ((budget - actual) / budget) * 100
    if (project.budget > 0) {
      project.profitMargin = Number((((project.budget - project.totalProjectCost) / project.budget) * 100).toFixed(1));
    } else {
      project.profitMargin = 0;
    }
  }

  // Integration side-effect: Inventory stock reduction/re-entry
  private triggerInventoryTransaction(productId: string, quantity: number, type: "STOCK_IN" | "STOCK_OUT", reason: string) {
    try {
      if (fs.existsSync(INVENTORY_STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(INVENTORY_STORE_PATH, "utf-8"));
        const item = data.inventoryItems?.find((ii: any) => ii.productId === productId);
        if (item) {
          item.quantity += quantity;
          // Log transactions
          if (!data.transactions) data.transactions = [];
          data.transactions.push({
            id: `tx-${crypto.randomUUID()}`,
            warehouseId: item.warehouseId || "wh-1",
            productId,
            quantity,
            type,
            referenceId: null,
            refDocument: "Project Module",
            reason,
            performedBy: "system_project_agent",
            createdAt: new Date().toISOString()
          });
          fs.writeFileSync(INVENTORY_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
          logger.info("PROJECT_SERVICE", `Inventory adjustment triggered: ${productId} by ${quantity}`);
        }
      }
    } catch (e) {
      logger.error("PROJECT_SERVICE", "Failed to propagate inventory transaction", e);
    }
  }

  // Finance integration: Automatically generate final invoice in Sales/Finance module
  private async triggerFinanceIntegration(project: ProjectStoreProject) {
    try {
      if (fs.existsSync(SALES_STORE_PATH)) {
        const salesData = JSON.parse(fs.readFileSync(SALES_STORE_PATH, "utf-8"));
        if (!salesData.invoices) salesData.invoices = [];

        // Check if invoice for this project already exists
        const exists = salesData.invoices.some((inv: any) => inv.projectRef === project.projectNumber);
        if (exists) return;

        const invoiceNumber = `INV-PRJ-${String(salesData.invoices.length + 1).padStart(4, "0")}`;
        const subTotal = project.budget / 1.16; // reverse KES VAT 16%
        const taxAmount = project.budget - subTotal;

        const newInvoice = {
          id: `inv-${crypto.randomUUID()}`,
          invoiceNumber,
          customerId: project.customerId,
          customerName: project.customerName,
          customerEmail: "finance@client.co.ke",
          subTotal: Number(subTotal.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          totalAmount: project.budget,
          amountPaid: 0,
          status: "PENDING",
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          items: [
            {
              productId: "prod-custom",
              name: `Project Completion: ${project.name} (${project.projectType})`,
              quantity: 1,
              unitPrice: project.budget,
              discount: 0
            }
          ],
          projectRef: project.projectNumber,
          createdAt: new Date().toISOString()
        };

        salesData.invoices.push(newInvoice);
        fs.writeFileSync(SALES_STORE_PATH, JSON.stringify(salesData, null, 2), "utf-8");

        // Record project revenue double-entry mock log in CRM customer history
        if (fs.existsSync(CRM_STORE_PATH)) {
          const crmData = JSON.parse(fs.readFileSync(CRM_STORE_PATH, "utf-8"));
          if (!crmData.history) crmData.history = [];
          crmData.history.push({
            id: `hist-${crypto.randomUUID()}`,
            customerId: project.customerId,
            eventType: "SYSTEM_LOG",
            eventDetails: `Project completed and final invoice generated: ${invoiceNumber} for KES ${project.budget}. Estimated Profit: KES ${(project.budget - project.totalProjectCost).toLocaleString()}`,
            performedBy: project.projectManager,
            createdAt: new Date().toISOString()
          });
          fs.writeFileSync(CRM_STORE_PATH, JSON.stringify(crmData, null, 2), "utf-8");
        }

        logger.info("PROJECT_SERVICE", `Finance invoice generated successfully: ${invoiceNumber}`);
      }
    } catch (e) {
      logger.error("PROJECT_SERVICE", "Failed to trigger finance billing loop", e);
    }
  }

  // SITE SURVEYS
  public async getSurveys() {
    return this.readStore().surveys;
  }

  public async createSurvey(data: any) {
    const store = this.readStore();
    const surveyNumber = `SRV-2026-${String(store.surveys.length + 1).padStart(3, "0")}`;

    const newSurvey: SiteSurvey = {
      id: `srv-${crypto.randomUUID()}`,
      surveyNumber,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom Customer",
      location: data.location || "",
      gpsCoordinates: data.gpsCoordinates || "",
      surveyDate: data.surveyDate || new Date().toISOString().split("T")[0],
      surveyTechnician: data.surveyTechnician || "Joseph Kariuki",
      requirements: data.requirements || "",
      photos: [],
      recommendations: data.recommendations || "",
      estimatedMaterials: data.estimatedMaterials || [],
      estimatedLabourCost: Number(data.estimatedLabourCost) || 0
    };

    store.surveys.push(newSurvey);
    this.writeStore(store);
    return newSurvey;
  }

  // TASKS
  public async getTasks() {
    return this.readStore().tasks;
  }

  public async createTask(data: any) {
    const store = this.readStore();
    const taskNumber = `TSK-2026-${String(store.tasks.length + 1).padStart(3, "0")}`;

    const project = store.projects.find(p => p.id === data.projectId);

    const newTask: ProjectTask = {
      id: `tsk-${crypto.randomUUID()}`,
      taskNumber,
      projectId: data.projectId,
      projectName: project ? project.name : "N/A",
      assignedEmployee: data.assignedEmployee || "Joseph Kariuki",
      description: data.description || "",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      dueDate: data.dueDate || "",
      priority: data.priority || "MEDIUM",
      status: data.status || "PENDING"
    };

    store.tasks.push(newTask);
    this.writeStore(store);
    return newTask;
  }

  public async updateTaskStatus(id: string, status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED") {
    const store = this.readStore();
    const idx = store.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    store.tasks[idx].status = status;
    this.writeStore(store);
    return store.tasks[idx];
  }

  // INSTALLATIONS (FIBRE & CCTV)
  public async getFibreRecords() {
    return this.readStore().fibreRecords;
  }

  public async createFibreRecord(data: any) {
    const store = this.readStore();
    const project = store.projects.find(p => p.id === data.projectId);

    const record: FibreInstallationRecord = {
      id: `fib-${crypto.randomUUID()}`,
      projectId: data.projectId,
      projectName: project ? project.name : "N/A",
      customerName: project ? project.customerName : data.customerName || "Celcom Customer",
      routeDetails: data.routeDetails || "",
      cableLength: Number(data.cableLength) || 0,
      fibreType: data.fibreType || "Single Mode G.652D",
      ontSerialNumber: data.ontSerialNumber || "",
      router: data.router || "",
      signalTestResults: data.signalTestResults || "",
      installationDate: data.installationDate || new Date().toISOString().split("T")[0],
      technician: data.technician || "Joseph Kariuki",
      photos: []
    };

    store.fibreRecords.push(record);
    this.writeStore(store);
    return record;
  }

  public async getCctvRecords() {
    return this.readStore().cctvRecords;
  }

  public async createCctvRecord(data: any) {
    const store = this.readStore();
    const project = store.projects.find(p => p.id === data.projectId);

    const record: CCTVInstallationRecord = {
      id: `cctv-${crypto.randomUUID()}`,
      projectId: data.projectId,
      projectName: project ? project.name : "N/A",
      customerName: project ? project.customerName : data.customerName || "Celcom Customer",
      cameraQuantity: Number(data.cameraQuantity) || 0,
      cameraType: data.cameraType || "IP Dome 5MP",
      dvrNvrModel: data.dvrNvrModel || "",
      storageCapacity: data.storageCapacity || "2TB Surveillance HDD",
      cableUsed: data.cableUsed || "Cat6 Shielded Outdoor",
      installationDate: data.installationDate || new Date().toISOString().split("T")[0],
      technician: data.technician || "Joseph Kariuki"
    };

    store.cctvRecords.push(record);
    this.writeStore(store);
    return record;
  }

  // MAINTENANCE CONTRACTS
  public async getMaintenanceContracts() {
    return this.readStore().maintenanceContracts;
  }

  public async createMaintenanceContract(data: any) {
    const store = this.readStore();
    const contractNumber = `MC-2026-${String(store.maintenanceContracts.length + 1).padStart(3, "0")}`;

    const contract: MaintenanceContract = {
      id: `mc-${crypto.randomUUID()}`,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom Corporate Client",
      contractNumber,
      contractType: data.contractType || "ANNUAL_STANDARD",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || "",
      monthlyFee: Number(data.monthlyFee) || 0,
      servicesIncluded: data.servicesIncluded || "",
      renewalDate: data.renewalDate || "",
      status: "ACTIVE"
    };

    store.maintenanceContracts.push(contract);
    this.writeStore(store);
    return contract;
  }

  // JOB CARDS
  public async getJobCards() {
    return this.readStore().jobCards;
  }

  public async createJobCard(data: any) {
    const store = this.readStore();
    const jobNumber = `JC-2026-${String(store.jobCards.length + 1).padStart(3, "0")}`;

    const card: JobCard = {
      id: `jc-${crypto.randomUUID()}`,
      jobNumber,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom Customer",
      issue: data.issue || "",
      technician: data.technician || "David Mwangi",
      date: data.date || new Date().toISOString().split("T")[0],
      workDone: data.workDone || "",
      materialsUsed: data.materialsUsed || "",
      customerSignature: data.customerSignature || "",
      status: data.status || "OPEN"
    };

    store.jobCards.push(card);
    this.writeStore(store);
    return card;
  }

  public async updateJobCardStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "COMPLETED", updateData: any = {}) {
    const store = this.readStore();
    const idx = store.jobCards.findIndex(j => j.id === id);
    if (idx === -1) return null;
    
    store.jobCards[idx].status = status;
    if (updateData.workDone) store.jobCards[idx].workDone = updateData.workDone;
    if (updateData.materialsUsed) store.jobCards[idx].materialsUsed = updateData.materialsUsed;
    if (updateData.customerSignature) store.jobCards[idx].customerSignature = updateData.customerSignature;

    this.writeStore(store);
    return store.jobCards[idx];
  }

  // COMPLETION CERTIFICATES
  public async getCompletionCertificates() {
    return this.readStore().completionCertificates;
  }

  public async createCompletionCertificate(data: any) {
    const store = this.readStore();
    const project = store.projects.find(p => p.id === data.projectId);

    const certificate: CompletionCertificate = {
      id: `cert-${crypto.randomUUID()}`,
      projectId: data.projectId,
      projectNumber: project ? project.projectNumber : "PRJ-N/A",
      projectName: project ? project.name : "N/A",
      customerName: project ? project.customerName : data.customerName || "Celcom Customer",
      workCompleted: data.workCompleted || "",
      equipmentInstalled: data.equipmentInstalled || "",
      warranty: data.warranty || "12 Months hardware warranty",
      customerApprovalName: data.customerApprovalName || "",
      technicianSignature: data.technicianSignature || "",
      dateSigned: data.dateSigned || new Date().toISOString().split("T")[0]
    };

    store.completionCertificates.push(certificate);
    this.writeStore(store);
    return certificate;
  }

  // TECHNICIANS
  public async getTechnicians() {
    const store = this.readStore();
    // Gather from existing sandbox technicians + add rich metadata
    // Track workload and completion rates based on tasks
    const techs = [
      { name: "Joseph Kariuki", skills: ["Fiber Fusion Splicing", "OTDR Diagnostics", "IP Cameras"], rating: 4.8 },
      { name: "David Mwangi", skills: ["Mikrotik Networking", "Ubiquiti UniFi", "Cabling"], rating: 4.6 },
      { name: "Samuel Ndung'u", skills: ["Conduit Layout", "Electrical Wiring", "DVR Mounts"], rating: 4.5 },
      { name: "Sarah Mwangi", skills: ["Project Coordination", "Fibre Provisioning"], rating: 4.9 }
    ];

    return techs.map(t => {
      const assignedTasks = store.tasks.filter(tsk => tsk.assignedEmployee === t.name);
      const completedTasks = assignedTasks.filter(tsk => tsk.status === "COMPLETED").length;
      const completionRate = assignedTasks.length > 0 ? Math.round((completedTasks / assignedTasks.length) * 100) : 100;
      const activeProjects = Array.from(new Set(assignedTasks.map(tsk => tsk.projectName))).length;

      return {
        ...t,
        assignedProjectsCount: activeProjects,
        workload: assignedTasks.filter(tsk => tsk.status !== "COMPLETED").length,
        completionRate
      };
    });
  }
}
