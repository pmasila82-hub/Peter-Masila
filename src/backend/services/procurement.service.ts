import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";
import { InventoryService } from "./inventory.service";

const PROCUREMENT_STORE_PATH = path.join(process.cwd(), "src/backend/data/procurement_store.json");

// -------------------------------------------------------------
// PROCUREMENT INTERFACES
// -------------------------------------------------------------

export interface SupplierDocumentStore {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface SupplierHistoryStore {
  id: string;
  eventType: string; // "CREATED" | "LPO" | "INVOICE" | "PAYMENT" | "RATING"
  details: string;
  performedBy: string;
  createdAt: string;
}

export interface SupplierStore {
  id: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  physicalAddress: string;
  kraPin: string;
  vatNumber: string;
  bankDetails: string;
  paymentTermsDays: number;
  supplierCategory: string;
  status: "ACTIVE" | "INACTIVE";
  rating: number; // 1-5
  documents: SupplierDocumentStore[];
  history: SupplierHistoryStore[];
  createdAt: string;
}

export interface PurchaseRequestItemStore {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  estimatedUnitCost: number;
}

export interface ApprovalWorkflowStore {
  id: string;
  role: "EMPLOYEE" | "DEPARTMENT_MANAGER" | "PROCUREMENT_OFFICER" | "MANAGEMENT";
  approverName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: string;
  actionedAt?: string;
  createdAt: string;
}

export interface PurchaseRequestStore {
  id: string;
  requestNo: string;
  department: string;
  requestedBy: string;
  date: string;
  requiredDate: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED";
  items: PurchaseRequestItemStore[];
  approvals: ApprovalWorkflowStore[];
  createdAt: string;
}

export interface LPOItemStore {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface LPOStore {
  id: string;
  lpoNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseRequestId?: string;
  date: string;
  items: LPOItemStore[];
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  totalAmount: number;
  deliveryLocation: string;
  terms: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONVERTED_TO_PO";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface POItemStore {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderStore {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  referenceLpoId?: string;
  referenceLpoNo?: string;
  items: POItemStore[];
  totalAmount: number;
  expectedDeliveryDate: string;
  status: "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  createdAt: string;
}

export interface GRNItemStore {
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  serialNumbers?: string[];
}

export interface GoodsReceivedNoteStore {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderNo: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  receivedBy: string;
  condition: "EXCELLENT" | "GOOD" | "DAMAGED" | "REJECTED";
  items: GRNItemStore[];
  status: "COMPLETED";
  createdAt: string;
}

export interface SupplierInvoiceStore {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  grnReference: string;
  date: string;
  dueDate: string;
  amount: number;
  vat: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  amountPaid: number;
  createdAt: string;
}

export interface SupplierPaymentStore {
  id: string;
  paymentNo: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceId: string;
  supplierInvoiceNo: string;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK" | "MPESA" | "CHEQUE";
  createdAt: string;
}

export interface ProcurementStoreData {
  suppliers: SupplierStore[];
  purchaseRequests: PurchaseRequestStore[];
  lpos: LPOStore[];
  purchaseOrders: PurchaseOrderStore[];
  grns: GoodsReceivedNoteStore[];
  invoices: SupplierInvoiceStore[];
  payments: SupplierPaymentStore[];
}

export class ProcurementService {
  private isDbConnected = false;
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
    this.checkDatabaseLoop();
  }

  private async checkDatabaseLoop() {
    try {
      const prisma: any = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      this.isDbConnected = true;
    } catch (err) {
      this.isDbConnected = false;
    }
  }

  // -------------------------------------------------------------
  // PERSISTENCE Fallback (JSON Store)
  // -------------------------------------------------------------

  private readStore(): ProcurementStoreData {
    try {
      if (fs.existsSync(PROCUREMENT_STORE_PATH)) {
        const raw = fs.readFileSync(PROCUREMENT_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("PROCUREMENT_SERVICE", "Failed to read procurement_store.json", e);
    }

    // Initialize with professional seed data matching Celcom ERP setup
    const seedStore: ProcurementStoreData = {
      suppliers: [
        {
          id: "sup-1",
          vendorCode: "SUP-CEL-001",
          companyName: "Cisco Systems East Africa",
          contactPerson: "Stephen Omondi",
          phone: "+254 722 000111",
          email: "somondi@cisco.com",
          physicalAddress: "14 Riverside, Block A, Nairobi",
          kraPin: "P051122334A",
          vatNumber: "VAT-05112233",
          bankDetails: "KCB Bank, University Way Branch, Acc: 1102233445",
          paymentTermsDays: 30,
          supplierCategory: "Networking Equipment",
          status: "ACTIVE",
          rating: 5,
          documents: [
            { id: "doc-1", title: "Tax Compliance Certificate", fileName: "tax_compliance_cisco_2026.pdf", fileSize: 1048576, fileType: "application/pdf", createdAt: "2026-01-10T08:00:00.000Z" }
          ],
          history: [
            { id: "hist-1", eventType: "CREATED", details: "Supplier registered successfully under networking category.", performedBy: "Peter Masila", createdAt: "2026-01-01T09:00:00.000Z" }
          ],
          createdAt: "2026-01-01T09:00:00.000Z"
        },
        {
          id: "sup-2",
          vendorCode: "SUP-CEL-002",
          companyName: "Liquid Intelligent Technologies",
          contactPerson: "Amara Karanja",
          phone: "+254 733 999888",
          email: "amara.karanja@liquid.tech",
          physicalAddress: "Liquid Tower, Sameer Business Park, Mombasa Road, Nairobi",
          kraPin: "P051188990Z",
          vatNumber: "VAT-05118899",
          bankDetails: "Standard Chartered Bank, Chiromo Acc: 0100998877",
          paymentTermsDays: 15,
          supplierCategory: "Fibre Infrastructure",
          status: "ACTIVE",
          rating: 4,
          documents: [],
          history: [
            { id: "hist-2", eventType: "CREATED", details: "Fibre wholesale supplier registered.", performedBy: "Alice Wanjiku", createdAt: "2026-02-15T11:00:00.000Z" }
          ],
          createdAt: "2026-02-15T11:00:00.000Z"
        }
      ],
      purchaseRequests: [
        {
          id: "pr-1",
          requestNo: "PR-2026-001",
          department: "Technical Operations",
          requestedBy: "Eng. Joseph Kamau",
          date: "2026-07-01",
          requiredDate: "2026-07-15",
          reason: "Critical stock replenishment for active client fibre rollouts in Syokimau.",
          priority: "HIGH",
          status: "COMPLETED",
          items: [
            { productId: "prod-1", productName: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 15, estimatedUnitCost: 6500 },
            { productId: "prod-2", productName: "Ubiquiti UniFi AC Lite Access Point", sku: "UBNT-UAP-AC-LITE", quantity: 10, estimatedUnitCost: 9000 }
          ],
          approvals: [
            { id: "app-1", role: "EMPLOYEE", approverName: "Eng. Joseph Kamau", status: "APPROVED", comments: "Required for Syokimau client connections.", createdAt: "2026-07-01T08:30:00.000Z", actionedAt: "2026-07-01T08:31:00.000Z" },
            { id: "app-2", role: "DEPARTMENT_MANAGER", approverName: "Director Tech Ops", status: "APPROVED", comments: "Validated. Reorder levels reached.", createdAt: "2026-07-01T09:00:00.000Z", actionedAt: "2026-07-01T09:15:00.000Z" },
            { id: "app-3", role: "PROCUREMENT_OFFICER", approverName: "Peter Masila", status: "APPROVED", comments: "Pricing verified with Cisco East Africa.", createdAt: "2026-07-01T10:00:00.000Z", actionedAt: "2026-07-01T10:45:00.000Z" },
            { id: "app-4", role: "MANAGEMENT", approverName: "Chief Executive Officer", status: "APPROVED", comments: "Approved for immediate LPO dispatch.", createdAt: "2026-07-01T14:00:00.000Z", actionedAt: "2026-07-01T15:30:00.000Z" }
          ],
          createdAt: "2026-07-01T08:30:00.000Z"
        },
        {
          id: "pr-2",
          requestNo: "PR-2026-002",
          department: "IT Infrastructure",
          requestedBy: "Grace Nekesa",
          date: "2026-07-12",
          requiredDate: "2026-07-28",
          reason: "Replacement laptop for new Finance Controller joining next month.",
          priority: "MEDIUM",
          status: "SUBMITTED",
          items: [
            { productId: "prod-5", productName: "Dell Latitude 5440 Core i7 Laptop", sku: "DELL-LAT-5440", quantity: 1, estimatedUnitCost: 110000 }
          ],
          approvals: [
            { id: "app-5", role: "EMPLOYEE", approverName: "Grace Nekesa", status: "APPROVED", comments: "Requested per hiring specifications.", createdAt: "2026-07-12T10:00:00.000Z", actionedAt: "2026-07-12T10:05:00.000Z" },
            { id: "app-6", role: "DEPARTMENT_MANAGER", approverName: "IT Manager", status: "APPROVED", comments: "Standard model approved.", createdAt: "2026-07-12T11:00:00.000Z", actionedAt: "2026-07-12T11:45:00.000Z" },
            { id: "app-7", role: "PROCUREMENT_OFFICER", approverName: "Peter Masila", status: "PENDING", comments: "", createdAt: "2026-07-12T12:00:00.000Z" }
          ],
          createdAt: "2026-07-12T10:00:00.000Z"
        }
      ],
      lpos: [
        {
          id: "lpo-1",
          lpoNumber: "LPO-2026-001",
          supplierId: "sup-1",
          supplierName: "Cisco Systems East Africa",
          purchaseRequestId: "pr-1",
          date: "2026-07-02",
          subTotal: 187500,
          vatTotal: 30000,
          discountTotal: 5000,
          totalAmount: 212500,
          deliveryLocation: "Mombasa Road HQ Warehouse, Gateway Park",
          terms: "30 Days Credit terms from invoice date.",
          status: "APPROVED",
          approvedBy: "Chief Operating Officer",
          approvedAt: "2026-07-02T16:00:00.000Z",
          items: [
            { productId: "prod-1", productName: "Mikrotik hEX gr3 Router", sku: "MT-HEX-GR3", quantity: 15, unitCost: 6500, vatAmount: 15600, discountAmount: 3000, totalAmount: 110100 },
            { productId: "prod-2", productName: "Ubiquiti UniFi AP AC Lite", sku: "UBNT-UAP-AC-LITE", quantity: 10, unitCost: 9000, vatAmount: 14400, discountAmount: 2000, totalAmount: 102400 }
          ],
          createdAt: "2026-07-02T10:00:00.000Z"
        }
      ],
      purchaseOrders: [
        {
          id: "po-1",
          poNumber: "PO-2026-001",
          supplierId: "sup-1",
          supplierName: "Cisco Systems East Africa",
          referenceLpoId: "lpo-1",
          referenceLpoNo: "LPO-2026-001",
          totalAmount: 212500,
          expectedDeliveryDate: "2026-07-10",
          status: "CONFIRMED",
          items: [
            { productId: "prod-1", productName: "Mikrotik hEX gr3 Router", sku: "MT-HEX-GR3", quantity: 15, unitPrice: 6500, totalPrice: 97500 },
            { productId: "prod-2", productName: "Ubiquiti UniFi AP AC Lite", sku: "UBNT-UAP-AC-LITE", quantity: 10, unitPrice: 9000, totalPrice: 90000 }
          ],
          createdAt: "2026-07-03T09:00:00.000Z"
        }
      ],
      grns: [],
      invoices: [],
      payments: []
    };

    fs.mkdirSync(path.dirname(PROCUREMENT_STORE_PATH), { recursive: true });
    fs.writeFileSync(PROCUREMENT_STORE_PATH, JSON.stringify(seedStore, null, 2), "utf-8");
    return seedStore;
  }

  private writeStore(data: ProcurementStoreData): void {
    try {
      fs.writeFileSync(PROCUREMENT_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("PROCUREMENT_SERVICE", "Failed to write procurement_store.json", e);
    }
  }

  // -------------------------------------------------------------
  // 1. SUPPLIER MANAGEMENT
  // -------------------------------------------------------------

  public async getSuppliers(): Promise<SupplierStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        const dbSuppliers = await prisma.supplier.findMany({
          include: { documents: true }
        });
        // Map DB schemas into store objects
        return dbSuppliers.map(s => ({
          id: s.id,
          vendorCode: s.vendorCode,
          companyName: s.companyName,
          contactPerson: s.contactPerson,
          phone: s.phone,
          email: s.email,
          physicalAddress: s.physicalAddress || "",
          kraPin: s.kraPin || "",
          vatNumber: (s as any).vatNumber || "",
          bankDetails: (s as any).bankDetails || "",
          paymentTermsDays: s.paymentTermsDays,
          supplierCategory: (s as any).supplierCategory || "General",
          status: ((s as any).status || "ACTIVE") as "ACTIVE" | "INACTIVE",
          rating: (s as any).rating || 5,
          documents: (s as any).documents || [],
          history: [],
          createdAt: s.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB fetch suppliers failed, using local store", err);
      }
    }

    const store = this.readStore();
    return store.suppliers;
  }

  public async createSupplier(data: Omit<SupplierStore, "id" | "createdAt" | "documents" | "history">): Promise<SupplierStore> {
    const id = "sup-" + crypto.randomBytes(4).toString("hex");
    const timestamp = new Date().toISOString();

    const newSupplier: SupplierStore = {
      ...data,
      id,
      documents: [],
      history: [
        { id: "hist-" + crypto.randomBytes(3).toString("hex"), eventType: "CREATED", details: "Supplier registered successfully.", performedBy: "Procurement Officer", createdAt: timestamp }
      ],
      createdAt: timestamp
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.supplier.create({
          data: {
            id: newSupplier.id,
            vendorCode: newSupplier.vendorCode,
            companyName: newSupplier.companyName,
            contactPerson: newSupplier.contactPerson,
            phone: newSupplier.phone,
            email: newSupplier.email,
            physicalAddress: newSupplier.physicalAddress,
            kraPin: newSupplier.kraPin,
            paymentTermsDays: newSupplier.paymentTermsDays,
            vatNumber: newSupplier.vatNumber,
            bankDetails: newSupplier.bankDetails,
            supplierCategory: newSupplier.supplierCategory,
            status: newSupplier.status,
            rating: newSupplier.rating
          } as any
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB create supplier failed, using local store", err);
      }
    }

    const store = this.readStore();
    store.suppliers.push(newSupplier);
    this.writeStore(store);

    return newSupplier;
  }

  public async uploadSupplierDocument(supplierId: string, title: string, fileName: string, fileSize: number, fileType: string): Promise<SupplierDocumentStore> {
    const docId = "doc-" + crypto.randomBytes(4).toString("hex");
    const timestamp = new Date().toISOString();

    const newDoc: SupplierDocumentStore = {
      id: docId,
      title,
      fileName,
      fileSize,
      fileType,
      createdAt: timestamp
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.supplierDocument.create({
          data: {
            id: docId,
            supplierId,
            title,
            fileName,
            fileSize,
            fileType,
            createdAt: new Date(timestamp)
          }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB upload doc failed, writing to local store", err);
      }
    }

    const store = this.readStore();
    const sup = store.suppliers.find(s => s.id === supplierId);
    if (sup) {
      sup.documents.push(newDoc);
      sup.history.push({
        id: "hist-" + crypto.randomBytes(3).toString("hex"),
        eventType: "DOC",
        details: `Uploaded document: ${title} (${fileName})`,
        performedBy: "Procurement Officer",
        createdAt: timestamp
      });
      this.writeStore(store);
    }

    return newDoc;
  }

  public async updateSupplierRating(supplierId: string, rating: number, details: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.supplier.update({
          where: { id: supplierId },
          data: { rating } as any
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB update rating failed", err);
      }
    }

    const store = this.readStore();
    const sup = store.suppliers.find(s => s.id === supplierId);
    if (sup) {
      sup.rating = rating;
      sup.history.push({
        id: "hist-" + crypto.randomBytes(3).toString("hex"),
        eventType: "RATING",
        details: `Supplier rating updated to ${rating}/5. Reason: ${details}`,
        performedBy: "Management",
        createdAt: timestamp
      });
      this.writeStore(store);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // 2. PURCHASE REQUEST
  // -------------------------------------------------------------

  public async getPurchaseRequests(): Promise<PurchaseRequestStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        const dbPRs = await prisma.purchaseRequest.findMany({
          include: {
            items: { include: { product: true } },
            approvals: true
          }
        });
        return dbPRs.map(pr => ({
          id: pr.id,
          requestNo: pr.requestNo,
          department: pr.department,
          requestedBy: pr.requestedBy,
          date: pr.date.toISOString().split("T")[0],
          requiredDate: pr.requiredDate.toISOString().split("T")[0],
          reason: pr.reason || "",
          priority: pr.priority as any,
          status: pr.status as any,
          createdAt: pr.createdAt.toISOString(),
          items: pr.items.map(i => ({
            productId: i.productId,
            productName: i.product.name,
            sku: i.product.sku,
            quantity: i.quantity,
            estimatedUnitCost: Number(i.estimatedUnitCost)
          })),
          approvals: pr.approvals.map(a => ({
            id: a.id,
            role: a.role as any,
            approverName: a.approverName || "",
            status: a.status as any,
            comments: a.comments || "",
            actionedAt: a.actionedAt?.toISOString(),
            createdAt: a.createdAt.toISOString()
          }))
        }));
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB fetch PRs failed, using local store", err);
      }
    }

    return this.readStore().purchaseRequests;
  }

  public async createPurchaseRequest(data: Omit<PurchaseRequestStore, "id" | "createdAt" | "requestNo" | "status" | "approvals">): Promise<PurchaseRequestStore> {
    const id = "pr-" + crypto.randomBytes(4).toString("hex");
    const reqNo = "PR-2026-" + Math.floor(100 + Math.random() * 900);
    const timestamp = new Date().toISOString();

    const newPR: PurchaseRequestStore = {
      ...data,
      id,
      requestNo: reqNo,
      status: "DRAFT",
      approvals: [
        {
          id: "app-" + crypto.randomBytes(3).toString("hex"),
          role: "EMPLOYEE",
          approverName: data.requestedBy,
          status: "APPROVED",
          comments: "Initiated internal purchase request.",
          actionedAt: timestamp,
          createdAt: timestamp
        },
        {
          id: "app-" + crypto.randomBytes(3).toString("hex"),
          role: "DEPARTMENT_MANAGER",
          approverName: "",
          status: "PENDING",
          comments: "",
          createdAt: timestamp
        }
      ],
      createdAt: timestamp
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.purchaseRequest.create({
          data: {
            id,
            requestNo: reqNo,
            department: data.department,
            requestedBy: data.requestedBy,
            date: new Date(data.date),
            requiredDate: new Date(data.requiredDate),
            reason: data.reason,
            priority: data.priority,
            status: "DRAFT",
            items: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                estimatedUnitCost: item.estimatedUnitCost
              }))
            },
            approvals: {
              create: newPR.approvals.map(a => ({
                id: a.id,
                role: a.role,
                approverName: a.approverName,
                status: a.status,
                comments: a.comments,
                actionedAt: a.actionedAt ? new Date(a.actionedAt) : null,
                createdAt: new Date(a.createdAt)
              }))
            }
          }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB create purchase request failed, using local store", err);
      }
    }

    const store = this.readStore();
    store.purchaseRequests.push(newPR);
    this.writeStore(store);

    return newPR;
  }

  public async submitPurchaseRequest(id: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.purchaseRequest.update({
          where: { id },
          data: { status: "SUBMITTED" }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB submit PR failed", err);
      }
    }

    const store = this.readStore();
    const pr = store.purchaseRequests.find(p => p.id === id);
    if (pr) {
      pr.status = "SUBMITTED";
      const pendingMgr = pr.approvals.find(a => a.role === "DEPARTMENT_MANAGER");
      if (pendingMgr) {
        pendingMgr.status = "PENDING";
      }
      this.writeStore(store);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // 3. APPROVAL WORKFLOW ENGINE
  // -------------------------------------------------------------

  public async approvePurchaseRequest(
    prId: string,
    role: "DEPARTMENT_MANAGER" | "PROCUREMENT_OFFICER" | "MANAGEMENT",
    approverName: string,
    decision: "APPROVED" | "REJECTED",
    comments: string
  ): Promise<PurchaseRequestStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();
    const pr = store.purchaseRequests.find(p => p.id === prId);
    if (!pr) return null;

    // Perform approval transition
    const currentApprovalIndex = pr.approvals.findIndex(a => a.role === role);
    if (currentApprovalIndex === -1) return null;

    pr.approvals[currentApprovalIndex].status = decision;
    pr.approvals[currentApprovalIndex].approverName = approverName;
    pr.approvals[currentApprovalIndex].comments = comments;
    pr.approvals[currentApprovalIndex].actionedAt = timestamp;

    if (decision === "REJECTED") {
      pr.status = "REJECTED";
    } else {
      // Determine next approval tier
      if (role === "DEPARTMENT_MANAGER") {
        // Queue Procurement Officer
        pr.approvals.push({
          id: "app-" + crypto.randomBytes(3).toString("hex"),
          role: "PROCUREMENT_OFFICER",
          approverName: "",
          status: "PENDING",
          comments: "",
          createdAt: timestamp
        });
        pr.status = "SUBMITTED";
      } else if (role === "PROCUREMENT_OFFICER") {
        // Queue Management Level
        pr.approvals.push({
          id: "app-" + crypto.randomBytes(3).toString("hex"),
          role: "MANAGEMENT",
          approverName: "",
          status: "PENDING",
          comments: "",
          createdAt: timestamp
        });
        pr.status = "SUBMITTED";
      } else if (role === "MANAGEMENT") {
        // Management approved => Entire request is approved! Ready for LPO.
        pr.status = "APPROVED";
      }
    }

    // Database syncing
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        // Clear old approvals and recreate, or update
        await prisma.approvalWorkflow.update({
          where: { id: pr.approvals[currentApprovalIndex].id },
          data: {
            status: decision,
            approverName,
            comments,
            actionedAt: new Date(timestamp)
          }
        });
        await prisma.purchaseRequest.update({
          where: { id: prId },
          data: { status: pr.status }
        });
        // If approved and next exists, create it
        if (decision === "APPROVED" && role !== "MANAGEMENT") {
          const nextRole = role === "DEPARTMENT_MANAGER" ? "PROCUREMENT_OFFICER" : "MANAGEMENT";
          const nextApproval = pr.approvals[pr.approvals.length - 1];
          await prisma.approvalWorkflow.create({
            data: {
              id: nextApproval.id,
              purchaseRequestId: prId,
              role: nextRole,
              status: "PENDING",
              createdAt: new Date(timestamp)
            }
          });
        }
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB approval update failed", err);
      }
    }

    this.writeStore(store);
    return pr;
  }

  // -------------------------------------------------------------
  // 4. LPO MANAGEMENT (Local Purchase Order)
  // -------------------------------------------------------------

  public async getLPOs(): Promise<LPOStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        const dbLPOs = await prisma.localPurchaseOrder.findMany({
          include: { customer: true }
        });
        // Map as needed. However, since LPO here maps to Client Purchase Orders, we return local store for custom Supplier LPO.
      } catch (err) {}
    }
    return this.readStore().lpos;
  }

  public async generateLPO(
    purchaseRequestId: string,
    supplierId: string,
    terms: string,
    deliveryLocation: string
  ): Promise<LPOStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();

    const pr = store.purchaseRequests.find(p => p.id === purchaseRequestId);
    if (!pr || pr.status !== "APPROVED") return null;

    const supplier = store.suppliers.find(s => s.id === supplierId);
    if (!supplier) return null;

    const lpoNumber = "LPO-2026-" + Math.floor(1000 + Math.random() * 9000);

    // Map items from PR
    let subTotal = 0;
    const lpoItems: LPOItemStore[] = pr.items.map(item => {
      const quantity = item.quantity;
      const unitCost = item.estimatedUnitCost;
      const discountAmount = 0;
      const baseVal = quantity * unitCost;
      const vatAmount = Number((baseVal * 0.16).toFixed(2));
      const totalAmount = baseVal + vatAmount - discountAmount;

      subTotal += baseVal;

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity,
        unitCost,
        vatAmount,
        discountAmount,
        totalAmount
      };
    });

    const vatTotal = Number((subTotal * 0.16).toFixed(2));
    const discountTotal = 0;
    const totalAmount = subTotal + vatTotal - discountTotal;

    const newLPO: LPOStore = {
      id: "lpo-" + crypto.randomBytes(4).toString("hex"),
      lpoNumber,
      supplierId,
      supplierName: supplier.companyName,
      purchaseRequestId,
      date: timestamp.split("T")[0],
      items: lpoItems,
      subTotal,
      vatTotal,
      discountTotal,
      totalAmount,
      deliveryLocation,
      terms,
      status: "APPROVED", // Auto-approved because the linked Purchase Request was fully approved!
      approvedBy: "Procurement Officer",
      approvedAt: timestamp,
      createdAt: timestamp
    };

    store.lpos.push(newLPO);
    // Mark purchase request as completed
    pr.status = "COMPLETED";

    // Add event log to supplier history
    supplier.history.push({
      id: "hist-" + crypto.randomBytes(3).toString("hex"),
      eventType: "LPO",
      details: `Dispatched ${lpoNumber} with total value Kes ${totalAmount.toLocaleString()}`,
      performedBy: "Procurement System",
      createdAt: timestamp
    });

    this.writeStore(store);

    return newLPO;
  }

  // -------------------------------------------------------------
  // 5. PURCHASE ORDER (PO)
  // -------------------------------------------------------------

  public async getPurchaseOrders(): Promise<PurchaseOrderStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        const dbPOs = await prisma.purchaseOrder.findMany({
          include: {
            supplier: true,
            purchaseOrderItems: { include: { product: true } }
          }
        });
        return dbPOs.map(po => ({
          id: po.id,
          poNumber: po.poNumber,
          supplierId: po.supplierId,
          supplierName: po.supplier.companyName,
          totalAmount: Number(po.totalAmount),
          expectedDeliveryDate: "2026-07-20", // Default placeholder
          status: po.status as any,
          createdAt: po.createdAt.toISOString(),
          items: po.purchaseOrderItems.map(i => ({
            productId: i.productId,
            productName: i.product.name,
            sku: i.product.sku,
            quantity: i.quantityOrdered,
            unitPrice: Number(i.unitCost),
            totalPrice: i.quantityOrdered * Number(i.unitCost)
          }))
        }));
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB fetch POs failed, using local store", err);
      }
    }
    return this.readStore().purchaseOrders;
  }

  public async createPOFromLPO(lpoId: string, expectedDeliveryDate: string): Promise<PurchaseOrderStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();

    const lpo = store.lpos.find(l => l.id === lpoId);
    if (!lpo) return null;

    const poNumber = "PO-2026-" + lpo.lpoNumber.split("-")[2];

    const poItems: POItemStore[] = lpo.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitCost,
      totalPrice: item.quantity * item.unitCost
    }));

    const newPO: PurchaseOrderStore = {
      id: "po-" + crypto.randomBytes(4).toString("hex"),
      poNumber,
      supplierId: lpo.supplierId,
      supplierName: lpo.supplierName,
      referenceLpoId: lpo.id,
      referenceLpoNo: lpo.lpoNumber,
      items: poItems,
      totalAmount: lpo.totalAmount,
      expectedDeliveryDate,
      status: "SENT",
      createdAt: timestamp
    };

    lpo.status = "CONVERTED_TO_PO";
    store.purchaseOrders.push(newPO);

    // Database Syncing
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.purchaseOrder.create({
          data: {
            id: newPO.id,
            poNumber: newPO.poNumber,
            supplierId: newPO.supplierId,
            status: "APPROVED",
            totalAmount: newPO.totalAmount,
            createdAt: new Date(timestamp),
            purchaseOrderItems: {
              create: poItems.map(item => ({
                productId: item.productId,
                quantityOrdered: item.quantity,
                unitCost: item.unitPrice
              }))
            }
          }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB create PO failed", err);
      }
    }

    this.writeStore(store);
    return newPO;
  }

  // -------------------------------------------------------------
  // 6. GOODS RECEIVED NOTE (GRN) & INVENTORY INTEGRATION
  // -------------------------------------------------------------

  public async getGRNs(): Promise<GoodsReceivedNoteStore[]> {
    return this.readStore().grns;
  }

  public async createGRN(data: {
    purchaseOrderId: string;
    warehouseId: string;
    warehouseName: string;
    receivedBy: string;
    condition: "EXCELLENT" | "GOOD" | "DAMAGED" | "REJECTED";
    items: {
      productId: string;
      productName: string;
      sku: string;
      quantityOrdered: number;
      quantityReceived: number;
      quantityAccepted: number;
      quantityRejected: number;
      serialNumbers?: string[];
    }[];
  }): Promise<GoodsReceivedNoteStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();

    const po = store.purchaseOrders.find(p => p.id === data.purchaseOrderId);
    if (!po) return null;

    const grnNumber = "GRN-2026-" + Math.floor(1000 + Math.random() * 9000);

    const newGRN: GoodsReceivedNoteStore = {
      id: "grn-" + crypto.randomBytes(4).toString("hex"),
      grnNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      purchaseOrderId: po.id,
      purchaseOrderNo: po.poNumber,
      warehouseId: data.warehouseId,
      warehouseName: data.warehouseName,
      date: timestamp.split("T")[0],
      receivedBy: data.receivedBy,
      condition: data.condition,
      items: data.items,
      status: "COMPLETED",
      createdAt: timestamp
    };

    store.grns.push(newGRN);

    // Update PO status to RECEIVED
    po.status = "RECEIVED";

    // -------------------------------------------------------
    // INVENTORY INTEGRATION: Automatically update stock & serials
    // -------------------------------------------------------
    for (const item of data.items) {
      if (item.quantityAccepted > 0) {
        try {
          // Call the pre-existing executeStockTransaction from InventoryService
          await this.inventoryService.executeStockTransaction({
            warehouseId: data.warehouseId,
            productId: item.productId,
            quantity: item.quantityAccepted,
            type: "STOCK_IN",
            refDocument: grnNumber,
            referenceId: newGRN.id,
            reason: `Procured goods delivery via ${po.poNumber}.`,
            performedBy: data.receivedBy,
            serials: item.serialNumbers || []
          });
          logger.info("PROCUREMENT_SERVICE", `Successfully stocked IN ${item.quantityAccepted} units of SKU ${item.sku}`);
        } catch (e) {
          logger.error("PROCUREMENT_SERVICE", `Failed to complete inventory integration for SKU ${item.sku}`, e);
        }
      }
    }

    // Database Syncing
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        // Create GRN on DB
        await prisma.goodsReceivedNote.create({
          data: {
            id: newGRN.id,
            grnNumber: newGRN.grnNumber,
            purchaseOrderId: po.id,
            warehouseId: data.warehouseId,
            receivedBy: "admin-user", // map to default user or user ID
            receivedAt: new Date(timestamp),
            grnItems: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantityReceived: item.quantityReceived,
                quantityAccepted: item.quantityAccepted,
                quantityRejected: item.quantityRejected
              }))
            }
          }
        });
        // Update PO status in DB
        await prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "RECEIVED" }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB Syncing of GRN failed", err);
      }
    }

    this.writeStore(store);
    return newGRN;
  }

  // -------------------------------------------------------------
  // 7. SUPPLIER INVOICES (Accounts Payable Ledger Integration)
  // -------------------------------------------------------------

  public async getSupplierInvoices(): Promise<SupplierInvoiceStore[]> {
    return this.readStore().invoices;
  }

  public async createSupplierInvoice(data: {
    invoiceNo: string;
    supplierId: string;
    grnReference: string;
    date: string;
    dueDate: string;
    amount: number;
    vat: number;
  }): Promise<SupplierInvoiceStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();

    const supplier = store.suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return null;

    const newInvoice: SupplierInvoiceStore = {
      id: "sinv-" + crypto.randomBytes(4).toString("hex"),
      invoiceNo: data.invoiceNo,
      supplierId: data.supplierId,
      supplierName: supplier.companyName,
      grnReference: data.grnReference,
      date: data.date,
      dueDate: data.dueDate,
      amount: data.amount,
      vat: data.vat,
      status: "UNPAID",
      amountPaid: 0,
      createdAt: timestamp
    };

    store.invoices.push(newInvoice);

    // Track Supplier Account History
    supplier.history.push({
      id: "hist-" + crypto.randomBytes(3).toString("hex"),
      eventType: "INVOICE",
      details: `Received supplier bill/invoice ${data.invoiceNo} for Kes ${data.amount.toLocaleString()}`,
      performedBy: "Accounts Payable",
      createdAt: timestamp
    });

    // Database Syncing
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.supplierInvoice.create({
          data: {
            id: newInvoice.id,
            invoiceNo: newInvoice.invoiceNo,
            supplierId: newInvoice.supplierId,
            grnReference: newInvoice.grnReference,
            date: new Date(newInvoice.date),
            dueDate: new Date(newInvoice.dueDate),
            amount: newInvoice.amount,
            vat: newInvoice.vat,
            status: "UNPAID"
          }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB Sync for SupplierInvoice failed", err);
      }
    }

    this.writeStore(store);
    return newInvoice;
  }

  // -------------------------------------------------------------
  // 8. SUPPLIER PAYMENTS
  // -------------------------------------------------------------

  public async getSupplierPayments(): Promise<SupplierPaymentStore[]> {
    return this.readStore().payments;
  }

  public async recordSupplierPayment(data: {
    supplierId: string;
    supplierInvoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMethod: "CASH" | "BANK" | "MPESA" | "CHEQUE";
  }): Promise<SupplierPaymentStore | null> {
    const timestamp = new Date().toISOString();
    const store = this.readStore();

    const supplier = store.suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return null;

    const invoice = store.invoices.find(i => i.id === data.supplierInvoiceId);
    if (!invoice) return null;

    const paymentNo = "PAY-SUP-" + Math.floor(1000 + Math.random() * 9000);

    const newPayment: SupplierPaymentStore = {
      id: "spay-" + crypto.randomBytes(4).toString("hex"),
      paymentNo,
      supplierId: data.supplierId,
      supplierName: supplier.companyName,
      supplierInvoiceId: data.supplierInvoiceId,
      supplierInvoiceNo: invoice.invoiceNo,
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      createdAt: timestamp
    };

    store.payments.push(newPayment);

    // Apply paid amount to invoice
    invoice.amountPaid += data.amount;
    if (invoice.amountPaid >= invoice.amount) {
      invoice.status = "PAID";
    } else if (invoice.amountPaid > 0) {
      invoice.status = "PARTIALLY_PAID";
    }

    // Add event log to supplier history
    supplier.history.push({
      id: "hist-" + crypto.randomBytes(3).toString("hex"),
      eventType: "PAYMENT",
      details: `Paid supplier Kes ${data.amount.toLocaleString()} via ${data.paymentMethod}. Acc Payment Ref: ${paymentNo}`,
      performedBy: "Finance Officer",
      createdAt: timestamp
    });

    // Database Syncing
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma: any = getPrismaClient();
        await prisma.supplierPayment.create({
          data: {
            id: newPayment.id,
            paymentNo: newPayment.paymentNo,
            supplierId: newPayment.supplierId,
            supplierInvoiceId: newPayment.supplierInvoiceId,
            paymentDate: new Date(newPayment.paymentDate),
            amount: newPayment.amount,
            paymentMethod: newPayment.paymentMethod
          }
        });
        // Update Invoice status on database
        await prisma.supplierInvoice.update({
          where: { id: invoice.id },
          data: { status: invoice.status }
        });
      } catch (err) {
        logger.error("PROCUREMENT_SERVICE", "DB Sync for SupplierPayment failed", err);
      }
    }

    this.writeStore(store);
    return newPayment;
  }

  // -------------------------------------------------------------
  // 9. PROCUREMENT REPORTS & FINANCE PREPARATION
  // -------------------------------------------------------------

  public async getProcurementReports(): Promise<any> {
    const store = this.readStore();

    // 1. Purchase Totals
    const totalPurchased = store.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = store.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalOutstanding = totalPurchased - totalPaid;

    // 2. Monthly analysis
    // Group invoices by Month
    const monthlyAnalysis: Record<string, number> = {};
    store.invoices.forEach(inv => {
      const monthStr = inv.date.substring(0, 7); // YYYY-MM
      monthlyAnalysis[monthStr] = (monthlyAnalysis[monthStr] || 0) + inv.amount;
    });

    const monthlyData = Object.keys(monthlyAnalysis).map(key => ({
      month: key,
      amount: monthlyAnalysis[key]
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 3. Supplier Performance & Outstanding AP
    const supplierAnalysis = store.suppliers.map(sup => {
      const supInvoices = store.invoices.filter(i => i.supplierId === sup.id);
      const invoiceTotal = supInvoices.reduce((sum, i) => sum + i.amount, 0);
      const paidTotal = store.payments.filter(p => p.supplierId === sup.id).reduce((sum, p) => sum + p.amount, 0);
      const outstanding = invoiceTotal - paidTotal;

      return {
        id: sup.id,
        supplierName: sup.companyName,
        category: sup.supplierCategory,
        rating: sup.rating,
        totalBilled: invoiceTotal,
        totalPaid: paidTotal,
        outstandingBalance: outstanding
      };
    });

    // 4. LPO & PO Status counts
    const lpoStatusCounts = {
      DRAFT: store.lpos.filter(l => l.status === "DRAFT").length,
      APPROVED: store.lpos.filter(l => l.status === "APPROVED").length,
      REJECTED: store.lpos.filter(l => l.status === "REJECTED").length,
      CONVERTED_TO_PO: store.lpos.filter(l => l.status === "CONVERTED_TO_PO").length,
    };

    const poStatusCounts = {
      DRAFT: store.purchaseOrders.filter(p => p.status === "DRAFT").length,
      SENT: store.purchaseOrders.filter(p => p.status === "SENT").length,
      CONFIRMED: store.purchaseOrders.filter(p => p.status === "CONFIRMED").length,
      RECEIVED: store.purchaseOrders.filter(p => p.status === "RECEIVED").length,
      CANCELLED: store.purchaseOrders.filter(p => p.status === "CANCELLED").length,
    };

    return {
      overview: {
        totalPurchased,
        totalPaid,
        totalOutstanding,
        activeSuppliers: store.suppliers.filter(s => s.status === "ACTIVE").length,
        pendingRequests: store.purchaseRequests.filter(pr => pr.status === "SUBMITTED").length,
      },
      monthlyData,
      supplierAnalysis,
      lpoStatusCounts,
      poStatusCounts,
      recentGRNs: store.grns.slice(-5),
      recentPayments: store.payments.slice(-5)
    };
  }
}
