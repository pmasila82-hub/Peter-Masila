import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";

const CRM_STORE_PATH = path.join(process.cwd(), "src/backend/data/crm_store.json");

// -------------------------------------------------------------
// CRM INTERFACES
// -------------------------------------------------------------

export interface CRMCustomer {
  id: string;
  accountCode: string;
  companyName: string | null;
  kraPin: string | null;
  contactPerson: string;
  email: string;
  phone: string;
  physicalAddress: string;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CRMContact {
  id: string;
  customerId: string;
  fullName: string;
  email: string | null;
  phone: string;
  designation: string | null;
}

export interface CRMLead {
  id: string;
  fullName: string;
  companyName: string | null;
  email: string;
  phone: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "LOST" | "CONVERTED";
  source: "WEBSITE" | "REFERRAL" | "COLD_CALL" | "SOCIAL_MEDIA" | "CAMPAIGN";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMFollowUp {
  id: string;
  leadId: string | null;
  customerId: string | null;
  scheduledDate: string;
  status: "PENDING" | "COMPLETED" | "RESCHEDULED" | "CANCELLED";
  type: "CALL" | "EMAIL" | "MEETING" | "SITE_SURVEY";
  notes: string;
  createdAt: string;
}

export interface CRMDocument {
  id: string;
  customerId: string;
  title: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  createdAt: string;
}

export interface CRMNote {
  id: string;
  customerId: string;
  note: string;
  authorName: string;
  createdAt: string;
}

export interface CRMHistory {
  id: string;
  customerId: string;
  eventType: "INVOICE" | "PAYMENT" | "TICKET" | "NOTE" | "DOC" | "LEAD_CONVERT" | "CAMPAIGN" | "SYSTEM_LOG";
  eventDetails: string;
  performedBy: string;
  createdAt: string;
}

export interface CRMStore {
  customers: CRMCustomer[];
  contacts: CRMContact[];
  leads: CRMLead[];
  followUps: CRMFollowUp[];
  documents: CRMDocument[];
  notes: CRMNote[];
  history: CRMHistory[];
}

export class CRMService {
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
  // SANDBOX PERSISTENCE LAYER
  // -------------------------------------------------------------

  private readStore(): CRMStore {
    try {
      if (fs.existsSync(CRM_STORE_PATH)) {
        const raw = fs.readFileSync(CRM_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("CRM_SERVICE", "Failed to read crm_store.json, using fallback config", e);
    }

    // Default High-Quality Kenyan ISP Sample Data if no store file exists yet
    const fallbackStore: CRMStore = {
      customers: [
        {
          id: "cust-981a-281a",
          accountCode: "CCN-NB-001",
          companyName: "Nairobi County Government ICT Hub",
          kraPin: "P011223344X",
          contactPerson: "Eng. Moses Mwangi",
          email: "ict.support@nairobi.go.ke",
          phone: "+254 711 223 344",
          physicalAddress: "City Hall, Mama Ngina St, Nairobi",
          creditLimit: 500000,
          outstandingBalance: 125000,
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
        },
        {
          id: "cust-092b-312b",
          accountCode: "CCN-NB-002",
          companyName: "Mount Kenya University",
          kraPin: "P051122334A",
          contactPerson: "Prof. Simon Gicharu",
          email: "it.admin@mku.ac.ke",
          phone: "+254 722 556 677",
          physicalAddress: "MKU Towers, Westlands Rd, Nairobi",
          creditLimit: 1200000,
          outstandingBalance: 0,
          isActive: true,
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days ago
        },
        {
          id: "cust-556c-112c",
          accountCode: "CCN-NB-003",
          companyName: "Safaricom Sacco Ltd",
          kraPin: "P031122445B",
          contactPerson: "Clarice Adhiambo",
          email: "info@safaricomsacco.co.ke",
          phone: "+254 701 112 233",
          physicalAddress: "Safaricom Care Centre, Westlands, Nairobi",
          creditLimit: 400000,
          outstandingBalance: 45000,
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      contacts: [
        {
          id: "cont-1",
          customerId: "cust-981a-281a",
          fullName: "Eng. Moses Mwangi",
          email: "mmwangi@nairobi.go.ke",
          phone: "+254 711 223 344",
          designation: "Director of ICT & Networks"
        },
        {
          id: "cont-2",
          customerId: "cust-981a-281a",
          fullName: "Beatrice Wanjiru",
          email: "bwanjiru@nairobi.go.ke",
          phone: "+254 720 334 455",
          designation: "Principal SLA Escalations Engineer"
        },
        {
          id: "cont-3",
          customerId: "cust-092b-312b",
          fullName: "Prof. Simon Gicharu",
          email: "sgicharu@mku.ac.ke",
          phone: "+254 722 556 677",
          designation: "Head of Infrastructure & GPON Nodes"
        }
      ],
      leads: [
        {
          id: "lead-a111",
          fullName: "Dr. Patrick Kimathi",
          companyName: "Meru University Tech Node",
          email: "kimathi@meru.ac.ke",
          phone: "+254 712 990 112",
          status: "QUALIFIED",
          source: "REFERRAL",
          notes: "Requires a redundant multi-gigabit OLT fiber lease and dedicated bandwidth for online campus portals.",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "lead-b222",
          fullName: "Hellen Obonyo",
          companyName: "Lake Basin Development Authority",
          email: "h.obonyo@lbda.go.ke",
          phone: "+254 733 445 566",
          status: "NEW",
          source: "WEBSITE",
          notes: "Inquired via sales landing portal for Kisumu Ring CCTV node attenuation and FTTH packages.",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "lead-c333",
          fullName: "Kennedy Mwangi",
          companyName: "Nyeri Business Park Hub",
          email: "kennedy@nyeribp.co.ke",
          phone: "+254 702 445 112",
          status: "CONTACTED",
          source: "COLD_CALL",
          notes: "Cold call regarding GPON fiber drop expansion in Nyeri town. Scheduled site survey follow-up.",
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      followUps: [
        {
          id: "fup-1",
          leadId: "lead-a111",
          customerId: null,
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future
          status: "PENDING",
          type: "SITE_SURVEY",
          notes: "Conduct signal attenuation site survey at Meru Main Campus Node. Lead technician James Kamau assigned.",
          createdAt: new Date().toISOString()
        },
        {
          id: "fup-2",
          leadId: "lead-c333",
          customerId: null,
          scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          status: "COMPLETED",
          type: "CALL",
          notes: "Presented the premium Celcom 100Mbps dedicated fiber package. Proposal drafted and emailed.",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "fup-3",
          leadId: null,
          customerId: "cust-981a-281a",
          scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "PENDING",
          type: "MEETING",
          notes: "Quarterly corporate SLA review meeting with City Hall ICT board. Verify internet latency dashboard.",
          createdAt: new Date().toISOString()
        }
      ],
      documents: [
        {
          id: "doc-11",
          customerId: "cust-981a-281a",
          title: "SLA Core Service Level Agreement 2026",
          fileName: "Celcom_CityHall_SLA_Signed_2026.pdf",
          fileSize: 1245000,
          fileType: "application/pdf",
          createdAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "doc-22",
          customerId: "cust-092b-312b",
          title: "Optical Link Budget Report & Topology",
          fileName: "MKU_Optical_Budget_Report.docx",
          fileSize: 450000,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          createdAt: new Date(Date.now() - 118 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      notes: [
        {
          id: "note-1",
          customerId: "cust-981a-281a",
          note: "City Hall suffers frequent road works fiber cuts near Parliament Road. Keep redundant microwave backhaul standby active.",
          authorName: "John Doe (Super Admin)",
          createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "note-2",
          customerId: "cust-092b-312b",
          note: "The customer requested a discount on the monthly package subscription fee if they pre-pay for 12 months. Forwarded proposal to Managing Director.",
          authorName: "Clarice Adhiambo (Sales)",
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      history: [
        {
          id: "hist-1",
          customerId: "cust-981a-281a",
          eventType: "LEAD_CONVERT",
          eventDetails: "Lead converted from Nairobi City Hall ICT proposal. Account CCN-NB-001 registered.",
          performedBy: "Clarice Adhiambo",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "hist-2",
          customerId: "cust-981a-281a",
          eventType: "DOC",
          eventDetails: "Uploaded Signed SLA Core Agreement (Celcom_CityHall_SLA_Signed_2026.pdf).",
          performedBy: "John Doe",
          createdAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "hist-3",
          customerId: "cust-092b-312b",
          eventType: "NOTE",
          eventDetails: "Added administrative note: 'Approved 12 months pre-payment SLA rate'.",
          performedBy: "John Doe",
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    this.writeStore(fallbackStore);
    return fallbackStore;
  }

  private writeStore(data: CRMStore) {
    try {
      const dir = path.dirname(CRM_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CRM_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("CRM_SERVICE", "Failed to write crm_store.json to disk", e);
    }
  }

  // -------------------------------------------------------------
  // CUSTOMER APIs
  // -------------------------------------------------------------

  public async listCustomers(): Promise<CRMCustomer[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.customer.findMany({
          orderBy: { createdAt: "desc" }
        });
        return records.map(r => ({
          id: r.id,
          accountCode: r.accountCode,
          companyName: r.companyName,
          kraPin: r.kraPin,
          contactPerson: r.contactPerson,
          email: r.email,
          phone: r.phone,
          physicalAddress: r.physicalAddress,
          creditLimit: Number(r.creditLimit),
          outstandingBalance: Number(r.outstandingBalance),
          isActive: r.isActive,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "DB Query failed in listCustomers, falling back", err);
      }
    }
    const store = this.readStore();
    return store.customers;
  }

  public async getCustomerById(id: string): Promise<CRMCustomer | null> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customer.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            accountCode: r.accountCode,
            companyName: r.companyName,
            kraPin: r.kraPin,
            contactPerson: r.contactPerson,
            email: r.email,
            phone: r.phone,
            physicalAddress: r.physicalAddress,
            creditLimit: Number(r.creditLimit),
            outstandingBalance: Number(r.outstandingBalance),
            isActive: r.isActive,
            createdAt: r.createdAt.toISOString()
          };
        }
      } catch (err) {
        logger.error("CRM_SERVICE", `DB Unique fetch failed for Customer id ${id}, falling back`, err);
      }
    }
    const store = this.readStore();
    return store.customers.find(c => c.id === id) || null;
  }

  public async createCustomer(data: Omit<CRMCustomer, "id" | "createdAt">, performedByEmail = "Staff"): Promise<CRMCustomer> {
    const newId = `cust_${crypto.randomBytes(4).toString("hex")}`;
    const newCustomer: CRMCustomer = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customer.create({
          data: {
            accountCode: data.accountCode,
            companyName: data.companyName,
            kraPin: data.kraPin,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
            physicalAddress: data.physicalAddress,
            creditLimit: data.creditLimit,
            outstandingBalance: data.outstandingBalance,
            isActive: data.isActive
          }
        });
        
        // Log in DB history as well if possible
        await prisma.customerHistory.create({
          data: {
            customerId: r.id,
            eventType: "SYSTEM_LOG",
            eventDetails: `Customer Profile registered in ERP. Code: ${r.accountCode}`,
            performedBy: performedByEmail
          }
        }).catch(() => {});

        return {
          id: r.id,
          accountCode: r.accountCode,
          companyName: r.companyName,
          kraPin: r.kraPin,
          contactPerson: r.contactPerson,
          email: r.email,
          phone: r.phone,
          physicalAddress: r.physicalAddress,
          creditLimit: Number(r.creditLimit),
          outstandingBalance: Number(r.outstandingBalance),
          isActive: r.isActive,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma createCustomer failed, writing to json fallback", err);
      }
    }

    const store = this.readStore();
    store.customers.unshift(newCustomer);

    // Auto-create history
    const histId = `hist_${crypto.randomBytes(4).toString("hex")}`;
    const historyRecord: CRMHistory = {
      id: histId,
      customerId: newId,
      eventType: "SYSTEM_LOG",
      eventDetails: `Customer profile registered in ERP sandbox. Code: ${data.accountCode}`,
      performedBy: performedByEmail,
      createdAt: new Date().toISOString()
    };
    store.history.unshift(historyRecord);

    // Auto-create default contact
    const contId = `cont_${crypto.randomBytes(4).toString("hex")}`;
    const firstContact: CRMContact = {
      id: contId,
      customerId: newId,
      fullName: data.contactPerson,
      email: data.email,
      phone: data.phone,
      designation: "Primary Contact"
    };
    store.contacts.push(firstContact);

    this.writeStore(store);
    return newCustomer;
  }

  public async updateCustomer(id: string, data: Partial<CRMCustomer>, performedByEmail = "Staff"): Promise<CRMCustomer | null> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customer.update({
          where: { id },
          data: {
            accountCode: data.accountCode,
            companyName: data.companyName,
            kraPin: data.kraPin,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
            physicalAddress: data.physicalAddress,
            creditLimit: data.creditLimit,
            outstandingBalance: data.outstandingBalance,
            isActive: data.isActive
          }
        });

        await prisma.customerHistory.create({
          data: {
            customerId: id,
            eventType: "NOTE",
            eventDetails: `Updated Customer configuration: ${Object.keys(data).join(", ")}`,
            performedBy: performedByEmail
          }
        }).catch(() => {});

        return {
          id: r.id,
          accountCode: r.accountCode,
          companyName: r.companyName,
          kraPin: r.kraPin,
          contactPerson: r.contactPerson,
          email: r.email,
          phone: r.phone,
          physicalAddress: r.physicalAddress,
          creditLimit: Number(r.creditLimit),
          outstandingBalance: Number(r.outstandingBalance),
          isActive: r.isActive,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma updateCustomer failed, writing to fallback", err);
      }
    }

    const store = this.readStore();
    const idx = store.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    store.customers[idx] = {
      ...store.customers[idx],
      ...data
    };

    // Log history
    const histId = `hist_${crypto.randomBytes(4).toString("hex")}`;
    store.history.unshift({
      id: histId,
      customerId: id,
      eventType: "NOTE",
      eventDetails: `Updated customer configuration settings.`,
      performedBy: performedByEmail,
      createdAt: new Date().toISOString()
    });

    this.writeStore(store);
    return store.customers[idx];
  }

  // -------------------------------------------------------------
  // LEAD APIs
  // -------------------------------------------------------------

  public async listLeads(): Promise<CRMLead[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
        return records.map(r => ({
          id: r.id,
          fullName: r.fullName,
          companyName: r.companyName,
          email: r.email,
          phone: r.phone,
          status: r.status as any,
          source: r.source as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listLeads failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.leads;
  }

  public async createLead(data: Omit<CRMLead, "id" | "createdAt" | "updatedAt">): Promise<CRMLead> {
    const newId = `lead_${crypto.randomBytes(4).toString("hex")}`;
    const newLead: CRMLead = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.lead.create({
          data: {
            fullName: data.fullName,
            companyName: data.companyName,
            email: data.email,
            phone: data.phone,
            status: data.status,
            source: data.source,
            notes: data.notes
          }
        });
        return {
          id: r.id,
          fullName: r.fullName,
          companyName: r.companyName,
          email: r.email,
          phone: r.phone,
          status: r.status as any,
          source: r.source as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma createLead failed, fallback to JSON writing", err);
      }
    }

    const store = this.readStore();
    store.leads.unshift(newLead);
    this.writeStore(store);
    return newLead;
  }

  public async updateLead(id: string, data: Partial<CRMLead>): Promise<CRMLead | null> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.lead.update({
          where: { id },
          data: {
            fullName: data.fullName,
            companyName: data.companyName,
            email: data.email,
            phone: data.phone,
            status: data.status,
            source: data.source,
            notes: data.notes
          }
        });
        return {
          id: r.id,
          fullName: r.fullName,
          companyName: r.companyName,
          email: r.email,
          phone: r.phone,
          status: r.status as any,
          source: r.source as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma updateLead failed, falling back", err);
      }
    }

    const store = this.readStore();
    const idx = store.leads.findIndex(l => l.id === id);
    if (idx === -1) return null;

    store.leads[idx] = {
      ...store.leads[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.writeStore(store);
    return store.leads[idx];
  }

  public async convertLeadToCustomer(leadId: string, payload: { accountCode: string; contactPerson: string; physicalAddress: string; creditLimit: number }, performedByEmail = "Staff"): Promise<CRMCustomer | null> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return null;

    // Create customer record
    const customerObj = {
      accountCode: payload.accountCode,
      companyName: lead.companyName || lead.fullName,
      kraPin: "",
      contactPerson: payload.contactPerson,
      email: lead.email,
      phone: lead.phone,
      physicalAddress: payload.physicalAddress,
      creditLimit: payload.creditLimit,
      outstandingBalance: 0,
      isActive: true
    };

    const customer = await this.createCustomer(customerObj, performedByEmail);

    // Mark lead as CONVERTED
    await this.updateLead(leadId, { status: "CONVERTED" });

    // Link followups to newly converted customer if possible
    const store = this.readStore();
    store.followUps = store.followUps.map(f => {
      if (f.leadId === leadId) {
        return { ...f, customerId: customer.id };
      }
      return f;
    });

    // Record conversion event in customer history
    const conversionHist: CRMHistory = {
      id: `hist_${crypto.randomBytes(4).toString("hex")}`,
      customerId: customer.id,
      eventType: "LEAD_CONVERT",
      eventDetails: `Lead converted successfully from ${lead.fullName} (${lead.companyName || "Personal"}). Account initialized.`,
      performedBy: performedByEmail,
      createdAt: new Date().toISOString()
    };
    store.history.unshift(conversionHist);
    this.writeStore(store);

    return customer;
  }

  public async getLeadById(id: string): Promise<CRMLead | null> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.lead.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            fullName: r.fullName,
            companyName: r.companyName,
            email: r.email,
            phone: r.phone,
            status: r.status as any,
            source: r.source as any,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
          };
        }
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma getLeadById failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.leads.find(l => l.id === id) || null;
  }

  // -------------------------------------------------------------
  // CONTACTS APIs
  // -------------------------------------------------------------

  public async listContacts(customerId?: string): Promise<CRMContact[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const filter = customerId ? { customerId } : {};
        const records = await prisma.customerContact.findMany({ where: filter });
        return records.map(r => ({
          id: r.id,
          customerId: r.customerId,
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          designation: r.designation
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listContacts failed, falling back", err);
      }
    }
    const store = this.readStore();
    if (customerId) {
      return store.contacts.filter(c => c.customerId === customerId);
    }
    return store.contacts;
  }

  public async createContact(data: Omit<CRMContact, "id">): Promise<CRMContact> {
    const newId = `cont_${crypto.randomBytes(4).toString("hex")}`;
    const newContact: CRMContact = { ...data, id: newId };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customerContact.create({
          data: {
            customerId: data.customerId,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            designation: data.designation
          }
        });
        return {
          id: r.id,
          customerId: r.customerId,
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          designation: r.designation
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma createContact failed, falling back", err);
      }
    }

    const store = this.readStore();
    store.contacts.push(newContact);
    this.writeStore(store);
    return newContact;
  }

  public async deleteContact(id: string): Promise<boolean> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.customerContact.delete({ where: { id } });
        return true;
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma deleteContact failed, falling back", err);
      }
    }

    const store = this.readStore();
    const len = store.contacts.length;
    store.contacts = store.contacts.filter(c => c.id !== id);
    this.writeStore(store);
    return store.contacts.length < len;
  }

  // -------------------------------------------------------------
  // FOLLOW UP APIs
  // -------------------------------------------------------------

  public async listFollowUps(): Promise<CRMFollowUp[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.followUp.findMany({ orderBy: { scheduledDate: "asc" } });
        return records.map(r => ({
          id: r.id,
          leadId: r.leadId,
          customerId: r.customerId,
          scheduledDate: r.scheduledDate.toISOString(),
          status: r.status as any,
          type: r.type as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listFollowUps failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.followUps;
  }

  public async createFollowUp(data: Omit<CRMFollowUp, "id" | "createdAt">): Promise<CRMFollowUp> {
    const newId = `fup_${crypto.randomBytes(4).toString("hex")}`;
    const newFup: CRMFollowUp = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.followUp.create({
          data: {
            leadId: data.leadId,
            customerId: data.customerId,
            scheduledDate: new Date(data.scheduledDate),
            status: data.status,
            type: data.type,
            notes: data.notes
          }
        });
        return {
          id: r.id,
          leadId: r.leadId,
          customerId: r.customerId,
          scheduledDate: r.scheduledDate.toISOString(),
          status: r.status as any,
          type: r.type as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma createFollowUp failed, falling back", err);
      }
    }

    const store = this.readStore();
    store.followUps.push(newFup);
    this.writeStore(store);
    return newFup;
  }

  public async updateFollowUp(id: string, data: Partial<CRMFollowUp>): Promise<CRMFollowUp | null> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const updatePayload: any = {};
        if (data.scheduledDate) updatePayload.scheduledDate = new Date(data.scheduledDate);
        if (data.status) updatePayload.status = data.status;
        if (data.type) updatePayload.type = data.type;
        if (data.notes) updatePayload.notes = data.notes;

        const r = await prisma.followUp.update({
          where: { id },
          data: updatePayload
        });
        return {
          id: r.id,
          leadId: r.leadId,
          customerId: r.customerId,
          scheduledDate: r.scheduledDate.toISOString(),
          status: r.status as any,
          type: r.type as any,
          notes: r.notes,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma updateFollowUp failed, falling back", err);
      }
    }

    const store = this.readStore();
    const idx = store.followUps.findIndex(f => f.id === id);
    if (idx === -1) return null;

    store.followUps[idx] = {
      ...store.followUps[idx],
      ...data
    };
    this.writeStore(store);
    return store.followUps[idx];
  }

  // -------------------------------------------------------------
  // DOCUMENTS APIs
  // -------------------------------------------------------------

  public async listDocuments(customerId: string): Promise<CRMDocument[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.customerDocument.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" }
        });
        return records.map(r => ({
          id: r.id,
          customerId: r.customerId,
          title: r.title,
          fileName: r.fileName,
          fileSize: r.fileSize,
          fileType: r.fileType,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listDocuments failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.documents.filter(d => d.customerId === customerId);
  }

  public async uploadDocument(data: Omit<CRMDocument, "id" | "createdAt">): Promise<CRMDocument> {
    const newId = `doc_${crypto.randomBytes(4).toString("hex")}`;
    const newDoc: CRMDocument = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customerDocument.create({
          data: {
            customerId: data.customerId,
            title: data.title,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType
          }
        });
        return {
          id: r.id,
          customerId: r.customerId,
          title: r.title,
          fileName: r.fileName,
          fileSize: r.fileSize,
          fileType: r.fileType,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma uploadDocument failed, falling back", err);
      }
    }

    const store = this.readStore();
    store.documents.unshift(newDoc);

    // Add History Event
    store.history.unshift({
      id: `hist_${crypto.randomBytes(4).toString("hex")}`,
      customerId: data.customerId,
      eventType: "DOC",
      eventDetails: `Uploaded document: ${data.title} (${data.fileName}, ${(data.fileSize / 1024).toFixed(1)} KB)`,
      performedBy: "Staff Member",
      createdAt: new Date().toISOString()
    });

    this.writeStore(store);
    return newDoc;
  }

  public async deleteDocument(id: string): Promise<boolean> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.customerDocument.delete({ where: { id } });
        return true;
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma deleteDocument failed, falling back", err);
      }
    }

    const store = this.readStore();
    const doc = store.documents.find(d => d.id === id);
    if (!doc) return false;

    store.documents = store.documents.filter(d => d.id !== id);
    
    // Log deletion event
    store.history.unshift({
      id: `hist_${crypto.randomBytes(4).toString("hex")}`,
      customerId: doc.customerId,
      eventType: "DOC",
      eventDetails: `Removed document: ${doc.title}`,
      performedBy: "Staff Member",
      createdAt: new Date().toISOString()
    });

    this.writeStore(store);
    return true;
  }

  // -------------------------------------------------------------
  // NOTES APIs
  // -------------------------------------------------------------

  public async listNotes(customerId: string): Promise<CRMNote[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.customerNote.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" }
        });
        return records.map(r => ({
          id: r.id,
          customerId: r.customerId,
          note: r.note,
          authorName: r.authorName,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listNotes failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.notes.filter(n => n.customerId === customerId);
  }

  public async createNote(customerId: string, note: string, authorName: string): Promise<CRMNote> {
    const newId = `note_${crypto.randomBytes(4).toString("hex")}`;
    const newNote: CRMNote = {
      id: newId,
      customerId,
      note,
      authorName,
      createdAt: new Date().toISOString()
    };

    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const r = await prisma.customerNote.create({
          data: {
            customerId,
            note,
            authorName
          }
        });
        return {
          id: r.id,
          customerId: r.customerId,
          note: r.note,
          authorName: r.authorName,
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma createNote failed, falling back", err);
      }
    }

    const store = this.readStore();
    store.notes.unshift(newNote);

    // Add History Event
    store.history.unshift({
      id: `hist_${crypto.randomBytes(4).toString("hex")}`,
      customerId,
      eventType: "NOTE",
      eventDetails: `Added custom operational log note.`,
      performedBy: authorName,
      createdAt: new Date().toISOString()
    });

    this.writeStore(store);
    return newNote;
  }

  // -------------------------------------------------------------
  // HISTORY APIs
  // -------------------------------------------------------------

  public async listHistory(customerId: string): Promise<CRMHistory[]> {
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const records = await prisma.customerHistory.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" }
        });
        return records.map(r => ({
          id: r.id,
          customerId: r.customerId,
          eventType: r.eventType as any,
          eventDetails: r.eventDetails,
          performedBy: r.performedBy,
          createdAt: r.createdAt.toISOString()
        }));
      } catch (err) {
        logger.error("CRM_SERVICE", "Prisma listHistory failed, falling back", err);
      }
    }
    const store = this.readStore();
    return store.history.filter(h => h.customerId === customerId);
  }

  // -------------------------------------------------------------
  // CRM EXECUTIVE REPORT GENERATOR
  // -------------------------------------------------------------

  public async generateCRMReportSummary() {
    const customers = await this.listCustomers();
    const leads = await this.listLeads();
    const followUps = await this.listFollowUps();

    const activeCustomers = customers.filter(c => c.isActive).length;
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadsBySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === "CONVERTED").length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const upcomingFollowUps = followUps.filter(f => f.status === "PENDING").length;

    // Build timeline of recent CRM history activities
    const store = this.readStore();
    const recentEvents = store.history.slice(0, 5).map(h => {
      const cust = customers.find(c => c.id === h.customerId);
      return {
        ...h,
        customerName: cust ? (cust.companyName || cust.contactPerson) : "Unknown Customer"
      };
    });

    return {
      stats: {
        totalCustomers: customers.length,
        activeCustomers,
        totalOutstanding,
        totalLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        pendingFollowUps: upcomingFollowUps
      },
      charts: {
        leadsStatusDistribution: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
        leadsSourceDistribution: Object.entries(leadsBySource).map(([name, value]) => ({ name, value })),
        outstandingLedger: customers.slice(0, 5).map(c => ({
          name: c.companyName || c.contactPerson,
          balance: c.outstandingBalance,
          credit: c.creditLimit
        }))
      },
      recentEvents
    };
  }
}

export const crmService = new CRMService();
