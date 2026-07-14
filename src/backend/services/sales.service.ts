import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";
import { InventoryService } from "./inventory.service";

const SALES_STORE_PATH = path.join(process.cwd(), "src/backend/data/sales_store.json");

// -------------------------------------------------------------
// SALES MODULE INTERFACES
// -------------------------------------------------------------

export interface QuotationItemStore {
  productId: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage e.g. 5 for 5%
}

export interface QuotationStore {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
  validUntil: string;
  createdBy: string;
  salesPerson: string;
  notes?: string;
  termsAndConditions?: string;
  items: QuotationItemStore[];
  createdAt: string;
}

export interface SalesOrderItemStore {
  productId: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrderStore {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  quotationRef?: string;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  deliveryDate?: string;
  assignedSalesPerson: string;
  items: SalesOrderItemStore[];
  createdAt: string;
}

export interface InvoiceItemStore {
  productId: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceStore {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  items: InvoiceItemStore[];
  createdAt: string;
}

export interface PaymentStore {
  id: string;
  paymentCode: string;
  customerId: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  paymentMethod: "CASH" | "BANK" | "MPESA" | "CARD" | "CHEQUE";
  transactionReference: string;
  paymentDate: string;
}

export interface ReceiptStore {
  id: string;
  receiptNumber: string;
  paymentId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  issuedBy: string;
  createdAt: string;
}

export interface CreditNoteStore {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  reason?: string;
  type: "RETURN" | "ADJUSTMENT" | "REFUND";
  createdAt: string;
}

export interface SalesStoreData {
  quotations: QuotationStore[];
  salesOrders: SalesOrderStore[];
  invoices: InvoiceStore[];
  payments: PaymentStore[];
  receipts: ReceiptStore[];
  creditNotes: CreditNoteStore[];
}

export class SalesService {
  private isDbConnected = false;
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
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
  // PERSISTENCE LAYER Fallback (JSON store)
  // -------------------------------------------------------------

  private readStore(): SalesStoreData {
    try {
      if (fs.existsSync(SALES_STORE_PATH)) {
        const raw = fs.readFileSync(SALES_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("SALES_SERVICE", "Failed to read sales_store.json, using seed data", e);
    }

    // Seed Data representing professional ERP sales setup
    const seedStore: SalesStoreData = {
      quotations: [
        {
          id: "quote-1",
          quotationNumber: "QTN-2026-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          customerEmail: "procurement@safaricom.co.ke",
          subTotal: 19000,
          taxAmount: 3040,
          totalAmount: 22040,
          status: "APPROVED",
          validUntil: "2026-08-30",
          createdBy: "admin-user",
          salesPerson: "Peter Masila",
          notes: "Pricing valid for 30 days. Includes free installation.",
          termsAndConditions: "100% Payment on delivery.",
          items: [
            { productId: "prod-1", name: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 2, unitPrice: 9500, discount: 0 }
          ],
          createdAt: "2026-07-01T10:00:00.000Z"
        },
        {
          id: "quote-2",
          quotationNumber: "QTN-2026-002",
          customerId: "cust-2",
          customerName: "Equator ICT Solutions",
          customerEmail: "billing@equatorict.com",
          subTotal: 27000,
          taxAmount: 4320,
          totalAmount: 31320,
          status: "SENT",
          validUntil: "2026-08-15",
          createdBy: "admin-user",
          salesPerson: "Alice Wanjiku",
          notes: "Celcom Networks premium delivery included.",
          termsAndConditions: "50% deposit, balance within 30 days.",
          items: [
            { productId: "prod-2", name: "Ubiquiti UniFi AC Lite Access Point", sku: "UBNT-UAP-AC-LITE", quantity: 2, unitPrice: 13500, discount: 0 }
          ],
          createdAt: "2026-07-10T14:30:00.000Z"
        }
      ],
      salesOrders: [
        {
          id: "so-1",
          orderNumber: "SO-2026-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          quotationRef: "QTN-2026-001",
          status: "PENDING",
          deliveryDate: "2026-07-20",
          assignedSalesPerson: "Peter Masila",
          items: [
            { productId: "prod-1", name: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 2, unitPrice: 9500 }
          ],
          createdAt: "2026-07-05T11:00:00.000Z"
        }
      ],
      invoices: [
        {
          id: "inv-1",
          invoiceNumber: "INV-2026-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          customerEmail: "procurement@safaricom.co.ke",
          subTotal: 19000,
          taxAmount: 3040,
          totalAmount: 22040,
          amountPaid: 22040,
          status: "PAID",
          dueDate: "2026-07-31",
          items: [
            { productId: "prod-1", name: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 2, unitPrice: 9500 }
          ],
          createdAt: "2026-07-06T12:00:00.000Z"
        },
        {
          id: "inv-2",
          invoiceNumber: "INV-2026-002",
          customerId: "cust-2",
          customerName: "Equator ICT Solutions",
          customerEmail: "billing@equatorict.com",
          subTotal: 13500,
          taxAmount: 2160,
          totalAmount: 15660,
          amountPaid: 0,
          status: "SENT",
          dueDate: "2026-08-10",
          items: [
            { productId: "prod-2", name: "Ubiquiti UniFi AC Lite Access Point", sku: "UBNT-UAP-AC-LITE", quantity: 1, unitPrice: 13500 }
          ],
          createdAt: "2026-07-12T09:00:00.000Z"
        }
      ],
      payments: [
        {
          id: "pay-1",
          paymentCode: "PMT-2026-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          invoiceId: "inv-1",
          invoiceNumber: "INV-2026-001",
          amount: 22040,
          paymentMethod: "MPESA",
          transactionReference: "KGA8902HJ1",
          paymentDate: "2026-07-06T14:00:00.000Z"
        }
      ],
      receipts: [
        {
          id: "rcpt-1",
          receiptNumber: "RCPT-2026-001",
          paymentId: "pay-1",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          invoiceNumber: "INV-2026-001",
          amount: 22040,
          paymentMethod: "MPESA",
          transactionReference: "KGA8902HJ1",
          issuedBy: "admin-user",
          createdAt: "2026-07-06T14:05:00.000Z"
        }
      ],
      creditNotes: [
        {
          id: "cn-1",
          creditNoteNumber: "CN-2026-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          invoiceId: "inv-1",
          invoiceNumber: "INV-2026-001",
          amount: 1500,
          reason: "Bulk purchaser loyalty discount adjustment",
          type: "ADJUSTMENT",
          createdAt: "2026-07-08T16:00:00.000Z"
        }
      ]
    };

    this.writeStore(seedStore);
    return seedStore;
  }

  private writeStore(data: SalesStoreData) {
    try {
      const dir = path.dirname(SALES_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SALES_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("SALES_SERVICE", "Failed to write sales_store.json", e);
    }
  }

  // Helper to calculate Kenya VAT (16.0%)
  private calculateTax(subTotal: number, items: Array<{ quantity: number; unitPrice: number; discount?: number }>): { tax: number; total: number } {
    const defaultVatRate = 0.16; // 16% Kenyan VAT
    let currentSub = 0;
    
    items.forEach(item => {
      const discPercent = item.discount || 0;
      const lineTotal = (item.quantity * item.unitPrice) * (1 - discPercent / 100);
      currentSub += lineTotal;
    });

    const tax = Number((currentSub * defaultVatRate).toFixed(2));
    const total = Number((currentSub + tax).toFixed(2));
    return { tax, total };
  }

  // -------------------------------------------------------------
  // 1. QUOTATION MANAGEMENT
  // -------------------------------------------------------------

  public async getQuotations(): Promise<QuotationStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const dbQuotes = await prisma.quotation.findMany({
          include: {
            customer: true,
            quotationItems: {
              include: { product: true }
            }
          }
        });
        return dbQuotes.map(q => ({
          id: q.id,
          quotationNumber: q.quotationNumber,
          customerId: q.customerId,
          customerName: q.customer.companyName || q.customer.contactPerson,
          customerEmail: q.customer.email,
          subTotal: Number(q.subTotal),
          taxAmount: Number(q.taxAmount),
          totalAmount: Number(q.totalAmount),
          status: q.status as any,
          validUntil: q.validUntil.toISOString().split("T")[0],
          createdBy: q.createdBy,
          salesPerson: "Celcom ERP Staff",
          items: q.quotationItems.map(qi => ({
            productId: qi.productId,
            name: qi.product.name,
            sku: qi.product.sku,
            quantity: qi.quantity,
            unitPrice: Number(qi.unitPrice),
            discount: Number(qi.discount)
          })),
          createdAt: q.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Database fetch for quotations failed, fallback to JSON", e);
      }
    }
    return this.readStore().quotations;
  }

  public async getQuotation(id: string): Promise<QuotationStore | null> {
    const list = await this.getQuotations();
    return list.find(q => q.id === id) || null;
  }

  public async createQuotation(data: Omit<QuotationStore, "id" | "quotationNumber" | "createdAt">): Promise<QuotationStore> {
    const id = "q-" + crypto.randomBytes(4).toString("hex");
    const num = "QTN-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();
    
    const { tax, total } = this.calculateTax(data.subTotal, data.items);

    const newQuote: QuotationStore = {
      ...data,
      id,
      quotationNumber: num,
      subTotal: Number(data.subTotal),
      taxAmount: tax,
      totalAmount: total,
      createdAt: new Date().toISOString()
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.quotation.create({
          data: {
            id,
            quotationNumber: num,
            customerId: data.customerId,
            subTotal: newQuote.subTotal,
            taxAmount: tax,
            totalAmount: total,
            status: data.status,
            validUntil: new Date(data.validUntil),
            createdBy: data.createdBy,
            quotationItems: {
              create: data.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discount: it.discount
              }))
            }
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Quotation DB insertion failed, using JSON persistence", e);
      }
    }

    const store = this.readStore();
    store.quotations.push(newQuote);
    this.writeStore(store);

    return newQuote;
  }

  public async updateQuotation(id: string, data: Partial<QuotationStore>): Promise<QuotationStore> {
    const store = this.readStore();
    const idx = store.quotations.findIndex(q => q.id === id);
    if (idx === -1) throw new Error("Quotation not found.");

    const updated = { ...store.quotations[idx], ...data };
    if (data.items) {
      const { tax, total } = this.calculateTax(updated.subTotal, updated.items);
      updated.taxAmount = tax;
      updated.totalAmount = total;
    }

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.quotation.update({
          where: { id },
          data: {
            status: updated.status,
            subTotal: updated.subTotal,
            taxAmount: updated.taxAmount,
            totalAmount: updated.totalAmount,
            validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Quotation DB update failed, fell back to JSON", e);
      }
    }

    store.quotations[idx] = updated;
    this.writeStore(store);
    return updated;
  }

  public async duplicateQuotation(id: string): Promise<QuotationStore> {
    const quote = await this.getQuotation(id);
    if (!quote) throw new Error("Quotation not found.");

    return this.createQuotation({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      subTotal: quote.subTotal,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      status: "DRAFT",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days valid
      createdBy: quote.createdBy,
      salesPerson: quote.salesPerson,
      notes: "Duplicate of " + quote.quotationNumber,
      termsAndConditions: quote.termsAndConditions,
      items: quote.items
    });
  }

  // Convert Quotation directly to Sales Order and Invoice
  public async convertQuotationToInvoice(id: string): Promise<InvoiceStore> {
    const quote = await this.getQuotation(id);
    if (!quote) throw new Error("Quotation not found.");

    // 1. Create Sales Order
    await this.createSalesOrder({
      customerId: quote.customerId,
      customerName: quote.customerName,
      quotationRef: quote.quotationNumber,
      status: "PENDING",
      deliveryDate: quote.validUntil,
      assignedSalesPerson: quote.salesPerson,
      items: quote.items.map(it => ({
        productId: it.productId,
        name: it.name,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      }))
    });

    // 2. Create Invoice
    const inv = await this.createInvoice({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      subTotal: quote.subTotal,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      amountPaid: 0,
      status: "SENT",
      dueDate: quote.validUntil,
      items: quote.items.map(it => ({
        productId: it.productId,
        name: it.name,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      }))
    });

    // 3. Update Quotation Status to APPROVED
    await this.updateQuotation(id, { status: "APPROVED" });

    return inv;
  }

  // -------------------------------------------------------------
  // 2. SALES ORDERS
  // -------------------------------------------------------------

  public async getSalesOrders(): Promise<SalesOrderStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const dbSO = await prisma.salesOrder.findMany({
          include: {
            customer: true,
            orderItems: { include: { product: true } }
          }
        });
        return dbSO.map(so => ({
          id: so.id,
          orderNumber: so.orderNumber,
          customerId: so.customerId,
          customerName: so.customer.companyName || so.customer.contactPerson,
          quotationRef: so.quotationRef || undefined,
          status: so.status as any,
          deliveryDate: so.deliveryDate?.toISOString().split("T")[0],
          assignedSalesPerson: so.assignedSalesPerson || "Sales Executive",
          items: so.orderItems.map(oi => ({
            productId: oi.productId,
            name: oi.product.name,
            sku: oi.product.sku,
            quantity: oi.quantity,
            unitPrice: Number(oi.unitPrice)
          })),
          createdAt: so.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Database fetch for sales orders failed, using JSON", e);
      }
    }
    return this.readStore().salesOrders;
  }

  public async createSalesOrder(data: Omit<SalesOrderStore, "id" | "orderNumber" | "createdAt">): Promise<SalesOrderStore> {
    const id = "so-" + crypto.randomBytes(4).toString("hex");
    const num = "SO-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    const newSO: SalesOrderStore = {
      ...data,
      id,
      orderNumber: num,
      createdAt: new Date().toISOString()
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.salesOrder.create({
          data: {
            id,
            orderNumber: num,
            customerId: data.customerId,
            quotationRef: data.quotationRef,
            status: data.status,
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
            assignedSalesPerson: data.assignedSalesPerson,
            orderItems: {
              create: data.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice
              }))
            }
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Sales Order DB creation failed, fell back to JSON", e);
      }
    }

    const store = this.readStore();
    store.salesOrders.push(newSO);
    this.writeStore(store);

    return newSO;
  }

  public async updateSalesOrder(id: string, status: "PENDING" | "FULFILLED" | "CANCELLED"): Promise<SalesOrderStore> {
    const store = this.readStore();
    const idx = store.salesOrders.findIndex(so => so.id === id);
    if (idx === -1) throw new Error("Sales Order not found.");

    store.salesOrders[idx].status = status;

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.salesOrder.update({
          where: { id },
          data: { status }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Sales Order DB status update failed, JSON stored", e);
      }
    }

    this.writeStore(store);
    return store.salesOrders[idx];
  }

  // -------------------------------------------------------------
  // 3. INVOICE MANAGEMENT
  // -------------------------------------------------------------

  public async getInvoices(): Promise<InvoiceStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const dbInvoices = await prisma.invoice.findMany({
          include: {
            customer: true,
            invoiceItems: { include: { product: true } }
          }
        });
        return dbInvoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerId: inv.customerId,
          customerName: inv.customer.companyName || inv.customer.contactPerson,
          customerEmail: inv.customer.email,
          subTotal: Number(inv.subTotal),
          taxAmount: Number(inv.taxAmount),
          totalAmount: Number(inv.totalAmount),
          amountPaid: Number(inv.amountPaid),
          status: inv.status as any,
          dueDate: inv.dueDate.toISOString().split("T")[0],
          items: inv.invoiceItems.map(ii => ({
            productId: ii.productId,
            name: ii.product.name,
            sku: ii.product.sku,
            quantity: ii.quantity,
            unitPrice: Number(ii.unitPrice)
          })),
          createdAt: inv.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Database fetch for invoices failed, fallback to JSON", e);
      }
    }
    return this.readStore().invoices;
  }

  public async getInvoice(id: string): Promise<InvoiceStore | null> {
    const list = await this.getInvoices();
    return list.find(i => i.id === id) || null;
  }

  public async createInvoice(data: Omit<InvoiceStore, "id" | "invoiceNumber" | "createdAt">): Promise<InvoiceStore> {
    const id = "inv-" + crypto.randomBytes(4).toString("hex");
    const num = "INV-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    const { tax, total } = this.calculateTax(data.subTotal, data.items);

    const newInv: InvoiceStore = {
      ...data,
      id,
      invoiceNumber: num,
      subTotal: Number(data.subTotal),
      taxAmount: tax,
      totalAmount: total,
      createdAt: new Date().toISOString()
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.invoice.create({
          data: {
            id,
            invoiceNumber: num,
            customerId: data.customerId,
            subTotal: newInv.subTotal,
            taxAmount: tax,
            totalAmount: total,
            amountPaid: data.amountPaid,
            status: data.status,
            dueDate: new Date(data.dueDate),
            invoiceItems: {
              create: data.items.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice
              }))
            }
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Invoice DB creation failed, fall back to JSON", e);
      }
    }

    const store = this.readStore();
    store.invoices.push(newInv);
    this.writeStore(store);

    return newInv;
  }

  public async updateInvoiceStatus(id: string, status: InvoiceStore["status"]): Promise<InvoiceStore> {
    const store = this.readStore();
    const idx = store.invoices.findIndex(inv => inv.id === id);
    if (idx === -1) throw new Error("Invoice not found.");

    store.invoices[idx].status = status;

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.invoice.update({
          where: { id },
          data: { status }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Invoice DB status update failed, fallback to JSON", e);
      }
    }

    this.writeStore(store);
    return store.invoices[idx];
  }

  // -------------------------------------------------------------
  // 4. RECEIPTS & PAYMENTS
  // -------------------------------------------------------------

  public async getPayments(): Promise<PaymentStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const payments = await prisma.payment.findMany({
          include: { customer: true, invoice: true }
        });
        return payments.map(p => ({
          id: p.id,
          paymentCode: p.paymentCode,
          customerId: p.customerId,
          customerName: p.customer.companyName || p.customer.contactPerson,
          invoiceId: p.invoiceId || undefined,
          invoiceNumber: p.invoice?.invoiceNumber || undefined,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod as any,
          transactionReference: p.transactionReference,
          paymentDate: p.paymentDate.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Database fetch for payments failed, using JSON", e);
      }
    }
    return this.readStore().payments;
  }

  public async getReceipts(): Promise<ReceiptStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const rcpts = await prisma.receipt.findMany({
          include: {
            payment: {
              include: { customer: true, invoice: true }
            },
            issuer: true
          }
        });
        return rcpts.map(r => ({
          id: r.id,
          receiptNumber: r.receiptNumber,
          paymentId: r.paymentId,
          customerId: r.payment.customerId,
          customerName: r.payment.customer.companyName || r.payment.customer.contactPerson,
          invoiceNumber: r.payment.invoice?.invoiceNumber || undefined,
          amount: Number(r.payment.amount),
          paymentMethod: r.payment.paymentMethod,
          transactionReference: r.payment.transactionReference,
          issuedBy: r.issuer.firstName + " " + r.issuer.lastName,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Database fetch for receipts failed, using JSON", e);
      }
    }
    return this.readStore().receipts;
  }

  // Record a payment, update invoice status, issue receipt, and execute automatic stock deduction if paid
  public async createPaymentAndReceipt(data: Omit<PaymentStore, "id" | "paymentCode" | "paymentDate">): Promise<{ payment: PaymentStore; receipt: ReceiptStore }> {
    const paymentId = "pay-" + crypto.randomBytes(4).toString("hex");
    const paymentCode = "PMT-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();
    const receiptId = "rcpt-" + crypto.randomBytes(4).toString("hex");
    const receiptNumber = "RCPT-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();
    
    const paymentDate = new Date().toISOString();

    const payment: PaymentStore = {
      ...data,
      id: paymentId,
      paymentCode,
      paymentDate
    };

    const receipt: ReceiptStore = {
      id: receiptId,
      receiptNumber,
      paymentId,
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference,
      issuedBy: "Staff Member",
      createdAt: paymentDate
    };

    // Update Invoice matching
    const store = this.readStore();
    if (data.invoiceId) {
      const invIdx = store.invoices.findIndex(i => i.id === data.invoiceId);
      if (invIdx !== -1) {
        const inv = store.invoices[invIdx];
        inv.amountPaid = Number((inv.amountPaid + data.amount).toFixed(2));
        if (inv.amountPaid >= inv.totalAmount) {
          inv.status = "PAID";
        } else if (inv.amountPaid > 0) {
          inv.status = "PARTIALLY_PAID";
        }
        
        // --- 8. INVENTORY INTEGRATION ---
        // If the invoice is fully PAID or completed, trigger automatic stock reduction for all invoice products
        if (inv.status === "PAID") {
          try {
            logger.info("SALES_SERVICE", `Invoice ${inv.invoiceNumber} paid in full. Executing automatic stock reduction.`);
            for (const item of inv.items) {
              await this.inventoryService.executeStockTransaction({
                warehouseId: "wh-1", // default Nairobi HQ warehouse
                productId: item.productId,
                quantity: item.quantity,
                type: "STOCK_OUT",
                refDocument: inv.invoiceNumber,
                referenceId: inv.id,
                reason: `Automatic sales deduction for Invoice ${inv.invoiceNumber}`,
                performedBy: "admin-user" // Default ERP Agent actor
              });
            }
          } catch (invErr) {
            logger.error("SALES_SERVICE", "Failed to auto-reduce inventory during invoice payment", invErr);
          }
        }
      }
    }

    // DB Persistence
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.$transaction(async (tx) => {
          // Add payment
          await tx.payment.create({
            data: {
              id: paymentId,
              paymentCode,
              customerId: data.customerId,
              invoiceId: data.invoiceId || null,
              amount: data.amount,
              paymentMethod: data.paymentMethod,
              transactionReference: data.transactionReference,
              paymentDate: new Date(paymentDate)
            }
          });

          // Add receipt
          await tx.receipt.create({
            data: {
              id: receiptId,
              receiptNumber,
              paymentId,
              issuedBy: "admin-user" // default admin uuid or active user
            }
          });

          // Update invoice state
          if (data.invoiceId) {
            const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
            if (invoice) {
              const newAmountPaid = Number(invoice.amountPaid) + data.amount;
              let nextStatus = invoice.status;
              if (newAmountPaid >= Number(invoice.totalAmount)) {
                nextStatus = "PAID";
              } else if (newAmountPaid > 0) {
                nextStatus = "PARTIALLY_PAID";
              }
              await tx.invoice.update({
                where: { id: data.invoiceId },
                data: {
                  amountPaid: newAmountPaid,
                  status: nextStatus
                }
              });
            }
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Database multi-operation payment and receipt fail, fallback used", e);
      }
    }

    store.payments.push(payment);
    store.receipts.push(receipt);
    this.writeStore(store);

    return { payment, receipt };
  }

  // -------------------------------------------------------------
  // 5. CUSTOMER STATEMENTS
  // -------------------------------------------------------------

  public async getCustomerStatement(customerId: string): Promise<{
    customerName: string;
    outstandingBalance: number;
    paymentHistory: PaymentStore[];
    invoiceHistory: InvoiceStore[];
    creditNotes: CreditNoteStore[];
  }> {
    const store = this.readStore();
    
    // Fallback Customer query
    let customerName = "Unknown Customer";
    const invoices = store.invoices.filter(i => i.customerId === customerId);
    const payments = store.payments.filter(p => p.customerId === customerId);
    const creditNotes = store.creditNotes.filter(cn => cn.customerId === customerId);

    if (invoices.length > 0) {
      customerName = invoices[0].customerName || "Customer LLC";
    }

    // Compute outstanding balance
    let totalBilled = 0;
    let totalPaid = 0;
    let totalCredited = 0;

    invoices.forEach(i => {
      if (i.status !== "CANCELLED") {
        totalBilled += i.totalAmount;
      }
    });

    payments.forEach(p => {
      totalPaid += p.amount;
    });

    creditNotes.forEach(cn => {
      totalCredited += cn.amount;
    });

    const outstandingBalance = Number((totalBilled - totalPaid - totalCredited).toFixed(2));

    return {
      customerName,
      outstandingBalance: outstandingBalance < 0 ? 0 : outstandingBalance,
      paymentHistory: payments,
      invoiceHistory: invoices,
      creditNotes
    };
  }

  // -------------------------------------------------------------
  // 6. CREDIT NOTES
  // -------------------------------------------------------------

  public async getCreditNotes(): Promise<CreditNoteStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const dbCN = await prisma.creditNote.findMany({
          include: { customer: true, invoice: true }
        });
        return dbCN.map(cn => ({
          id: cn.id,
          creditNoteNumber: cn.creditNoteNumber,
          customerId: cn.customerId,
          customerName: cn.customer.companyName || cn.customer.contactPerson,
          invoiceId: cn.invoiceId || undefined,
          invoiceNumber: cn.invoice?.invoiceNumber || undefined,
          amount: Number(cn.amount),
          reason: cn.reason || undefined,
          type: cn.type as any,
          createdAt: cn.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("SALES_SERVICE", "Credit Note DB retrieval failed", e);
      }
    }
    return this.readStore().creditNotes;
  }

  public async createCreditNote(data: Omit<CreditNoteStore, "id" | "creditNoteNumber" | "createdAt">): Promise<CreditNoteStore> {
    const id = "cn-" + crypto.randomBytes(4).toString("hex");
    const num = "CN-2026-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    const newCN: CreditNoteStore = {
      ...data,
      id,
      creditNoteNumber: num,
      createdAt: new Date().toISOString()
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.creditNote.create({
          data: {
            id,
            creditNoteNumber: num,
            customerId: data.customerId,
            invoiceId: data.invoiceId || null,
            amount: data.amount,
            reason: data.reason || null,
            type: data.type
          }
        });
      } catch (e) {
        logger.error("SALES_SERVICE", "Credit Note DB creation failed, fallback to JSON storage", e);
      }
    }

    const store = this.readStore();
    store.creditNotes.push(newCN);
    this.writeStore(store);

    return newCN;
  }

  // -------------------------------------------------------------
  // 9. ISP BILLING PREPARATION & SUBSCRIPTION RECURRING RUN
  // -------------------------------------------------------------

  public async getIspBillingPreps(): Promise<{
    activeSubscribersCount: number;
    pendingBillingAmount: number;
    upcomingRenewals: Array<{
      id: string;
      subscriberName: string;
      packageName: string;
      renewalDate: string;
      monthlyPrice: number;
    }>;
  }> {
    // Structure model for subscriber-based invoicing
    const upcomingRenewals = [
      { id: "sub-1", subscriberName: "Express High school", packageName: "Fibre Business Lite 30Mbps", renewalDate: "2026-08-01", monthlyPrice: 15000 },
      { id: "sub-2", subscriberName: "Mombasa Tech Hub", packageName: "Fibre Business Unlimited 50Mbps", renewalDate: "2026-08-05", monthlyPrice: 25000 },
      { id: "sub-3", subscriberName: "Kileleshwa Residential Complex", packageName: "Fibre Home Extreme 20Mbps", renewalDate: "2026-08-10", monthlyPrice: 7500 }
    ];

    return {
      activeSubscribersCount: 24,
      pendingBillingAmount: 47500,
      upcomingRenewals
    };
  }

  // Executes standard recurring billing generation loop
  public async executeIspRecurringBillingRun(): Promise<{ generatedInvoicesCount: number; billedAmount: number }> {
    const upcoming = (await this.getIspBillingPreps()).upcomingRenewals;
    let count = 0;
    let billed = 0;

    for (const sub of upcoming) {
      // Mocked / Registered customer conversions
      await this.createInvoice({
        customerId: "cust-2", // Equator ICT or general ISP subscriber
        customerName: sub.subscriberName,
        customerEmail: "finance@celcomnetworks.co.ke",
        subTotal: sub.monthlyPrice,
        taxAmount: Number((sub.monthlyPrice * 0.16).toFixed(2)),
        totalAmount: Number((sub.monthlyPrice * 1.16).toFixed(2)),
        amountPaid: 0,
        status: "SENT",
        dueDate: sub.renewalDate,
        items: [
          {
            productId: "prod-5", // ISP Package code
            name: `Celcom ISP Monthly Subscription: ${sub.packageName}`,
            sku: `ISP-SUB-${sub.id.toUpperCase()}`,
            quantity: 1,
            unitPrice: sub.monthlyPrice
          }
        ]
      });

      count++;
      billed += Number((sub.monthlyPrice * 1.16).toFixed(2));
    }

    return {
      generatedInvoicesCount: count,
      billedAmount: billed
    };
  }

  // -------------------------------------------------------------
  // 10. SALES REPORTS
  // -------------------------------------------------------------

  public async getSalesReports(): Promise<{
    dailySales: number;
    monthlySales: number;
    outstandingReceivables: number;
    bySalesperson: Array<{ name: string; totalSales: number; count: number }>;
    byCustomer: Array<{ name: string; totalSales: number; count: number }>;
    byProduct: Array<{ name: string; sku: string; quantity: number; revenue: number }>;
    outstandingInvoices: InvoiceStore[];
  }> {
    const store = this.readStore();
    const activeInvoices = store.invoices.filter(i => i.status !== "CANCELLED");

    // Calculations
    const totalSales = activeInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const outstandingInvoices = activeInvoices.filter(i => i.status !== "PAID");
    const outstandingReceivables = outstandingInvoices.reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

    // Sales person report
    const salespersonMap: Record<string, { total: number; count: number }> = {};
    store.quotations.forEach(q => {
      if (q.status === "APPROVED") {
        const sp = q.salesPerson || "Corporate Desk";
        if (!salespersonMap[sp]) salespersonMap[sp] = { total: 0, count: 0 };
        salespersonMap[sp].total += q.totalAmount;
        salespersonMap[sp].count += 1;
      }
    });

    const bySalesperson = Object.keys(salespersonMap).map(name => ({
      name,
      totalSales: salespersonMap[name].total,
      count: salespersonMap[name].count
    }));

    // Customer report
    const customerMap: Record<string, { total: number; count: number }> = {};
    activeInvoices.forEach(i => {
      const cust = i.customerName || "General Customer";
      if (!customerMap[cust]) customerMap[cust] = { total: 0, count: 0 };
      customerMap[cust].total += i.totalAmount;
      customerMap[cust].count += 1;
    });

    const byCustomer = Object.keys(customerMap).map(name => ({
      name,
      totalSales: customerMap[name].total,
      count: customerMap[name].count
    }));

    // Product sales report
    const productMap: Record<string, { sku: string; qty: number; rev: number }> = {};
    activeInvoices.forEach(i => {
      i.items.forEach(item => {
        const prodName = item.name || "Default Product";
        const sku = item.sku || "N/A";
        if (!productMap[prodName]) productMap[prodName] = { sku, qty: 0, rev: 0 };
        productMap[prodName].qty += item.quantity;
        productMap[prodName].rev += (item.quantity * item.unitPrice);
      });
    });

    const byProduct = Object.keys(productMap).map(name => ({
      name,
      sku: productMap[name].sku,
      quantity: productMap[name].qty,
      revenue: productMap[name].rev
    }));

    return {
      dailySales: Number((totalSales * 0.05).toFixed(2)), // simulated distribution
      monthlySales: Number(totalSales.toFixed(2)),
      outstandingReceivables: Number(outstandingReceivables.toFixed(2)),
      bySalesperson,
      byCustomer,
      byProduct,
      outstandingInvoices
    };
  }
}
