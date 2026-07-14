import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "./logger.service";

const SUPPORT_STORE_PATH = path.join(process.cwd(), "src/backend/data/support_store.json");
const INVENTORY_STORE_PATH = path.join(process.cwd(), "src/backend/data/inventory_store.json");
const CRM_STORE_PATH = path.join(process.cwd(), "src/backend/data/crm_store.json");

// -------------------------------------------------------------
// TYPES & INTERFACES
// -------------------------------------------------------------

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: "CUSTOMER" | "TECHNICIAN" | "SYSTEM" | "SUPPORT_AGENT";
  senderName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: "INTERNET_PROBLEM" | "FIBRE_FAULT" | "ROUTER_PROBLEM" | "CCTV_PROBLEM" | "NETWORK_PROBLEM" | "BILLING_ISSUE" | "INSTALLATION_REQUEST" | "GENERAL_INQUIRY";
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
  assignedTechnician?: string;
  createdDate: string;
  dueDate: string;
  resolvedDate?: string;
  slaResponseHoursLimit: number;
  slaResolutionHoursLimit: number;
  slaResponseMet?: boolean;
  slaResolutionMet?: boolean;
  messages: TicketMessage[];
  feedbackRating?: number; // 1-5
  feedbackComments?: string;
  csatScore?: number; // 0-100
}

export interface SupportJobCard {
  id: string;
  jobNumber: string;
  ticketId: string;
  ticketNumber: string;
  customerName: string;
  location: string;
  problemDescription: string;
  technician: string;
  toolsRequired: string;
  materialsRequired: { productId: string; name: string; qty: number; cost: number }[];
  workDone: string;
  customerSignature?: string;
  status: "OPEN" | "COMPLETED";
  completedAt?: string;
}

export interface MaintenanceSchedule {
  id: string;
  scheduleNumber: string;
  customerId: string;
  customerName: string;
  equipment: string;
  serviceDate: string;
  technician: string;
  nextMaintenanceDate: string;
  notes: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  problem: string;
  solution: string;
  steps: string[];
  views: number;
  helpfulCount: number;
}

export interface SLARule {
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  responseHours: number;
  resolutionHours: number;
}

export interface SupportStoreData {
  tickets: SupportTicket[];
  jobCards: SupportJobCard[];
  maintenanceSchedules: MaintenanceSchedule[];
  knowledgeBase: KnowledgeArticle[];
  slaRules: SLARule[];
}

export class SupportService {
  private defaultSlaRules: SLARule[] = [
    { priority: "CRITICAL", responseHours: 1, resolutionHours: 4 },
    { priority: "HIGH", responseHours: 4, resolutionHours: 12 },
    { priority: "MEDIUM", responseHours: 12, resolutionHours: 24 },
    { priority: "LOW", responseHours: 24, resolutionHours: 48 }
  ];

  // -------------------------------------------------------------
  // STORE ACCESS
  // -------------------------------------------------------------

  private readStore(): SupportStoreData {
    try {
      if (fs.existsSync(SUPPORT_STORE_PATH)) {
        const raw = fs.readFileSync(SUPPORT_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("SUPPORT_SERVICE", "Failed to read support_store.json", e);
    }

    // High quality mock data to seed the sandbox if missing
    const seed: SupportStoreData = {
      tickets: [
        {
          id: "tkt-1",
          ticketNumber: "TKT-2026-001",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          contactPerson: "John Wambua",
          phone: "+254 711 000111",
          email: "ops@westlandsmall.co.ke",
          category: "FIBRE_FAULT",
          description: "Major packets dropped across the core optical riser trunk. Ping latency has exceeded 120ms with occasional packet timeouts.",
          priority: "CRITICAL",
          status: "IN_PROGRESS",
          assignedTechnician: "Joseph Kariuki",
          createdDate: "2026-07-14T00:30:00Z",
          dueDate: "2026-07-14T04:30:00Z",
          slaResponseHoursLimit: 1,
          slaResolutionHoursLimit: 4,
          slaResponseMet: true,
          messages: [
            {
              id: "msg-1",
              ticketId: "tkt-1",
              sender: "SYSTEM",
              senderName: "Celcom SLA Engine",
              message: "Ticket registered automatically via Email Gateway. SLA rules assigned: Critical Priority SLA (1h Response / 4h Resolution).",
              timestamp: "2026-07-14T00:31:00Z"
            },
            {
              id: "msg-2",
              ticketId: "tkt-1",
              sender: "TECHNICIAN",
              senderName: "Joseph Kariuki",
              message: "Acknowledged the incident. Dispatched with OTDR fiber diagnostic equipment to perform localized reflection sweeps at the main riser room.",
              timestamp: "2026-07-14T00:45:00Z"
            }
          ]
        },
        {
          id: "tkt-2",
          ticketNumber: "TKT-2026-002",
          customerId: "cust-2",
          customerName: "Kilimani Heights Apartments",
          contactPerson: "Grace Mutua",
          phone: "+254 722 555444",
          email: "care@kilimaniheights.ke",
          category: "CCTV_PROBLEM",
          description: "Backyard Dome Camera #3 video stream is entirely blank with active IP error codes on DVR console.",
          priority: "MEDIUM",
          status: "RESOLVED",
          assignedTechnician: "David Mwangi",
          createdDate: "2026-07-13T10:00:00Z",
          dueDate: "2026-07-14T10:00:00Z",
          resolvedDate: "2026-07-13T15:30:00Z",
          slaResponseHoursLimit: 12,
          slaResolutionHoursLimit: 24,
          slaResponseMet: true,
          slaResolutionMet: true,
          messages: [
            {
              id: "msg-3",
              ticketId: "tkt-2",
              sender: "SUPPORT_AGENT",
              senderName: "Celcom Support Central",
              message: "Assigned technician David Mwangi. Checked power over Ethernet (PoE) terminal codes.",
              timestamp: "2026-07-13T10:15:00Z"
            }
          ],
          feedbackRating: 5,
          feedbackComments: "David fixed the camera power regulator block quickly. Great help!",
          csatScore: 100
        }
      ],
      jobCards: [
        {
          id: "jc-tkt-2",
          jobNumber: "JC-SUP-001",
          ticketId: "tkt-2",
          ticketNumber: "TKT-2026-002",
          customerName: "Kilimani Heights Apartments",
          location: "Kilimani Road, Block B Backyard",
          problemDescription: "Dome Camera #3 stream blank, IP connection failed.",
          technician: "David Mwangi",
          toolsRequired: "Stepladder, RJ45 crimper, PoE Tester",
          materialsRequired: [
            { productId: "prod-3", name: "Hikvision 5MP Dome Camera", qty: 1, cost: 4200 }
          ],
          workDone: "Replaced faulty camera regulator block, replaced 1x RJ45 connector segment, tested IP camera stream via internal video test console.",
          customerSignature: "Grace Mutua",
          status: "COMPLETED",
          completedAt: "2026-07-13T15:30:00Z"
        }
      ],
      maintenanceSchedules: [
        {
          id: "maint-1",
          scheduleNumber: "PM-2026-001",
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          equipment: "Core OLT Splicing Backplane & UPS Batteries",
          serviceDate: "2026-07-20",
          technician: "David Mwangi",
          nextMaintenanceDate: "2026-10-20",
          notes: "Scheduled preventive dust extraction, lithium cell voltage checking on the principal backup battery racks.",
          status: "SCHEDULED"
        }
      ],
      knowledgeBase: [
        {
          id: "kb-1",
          title: "GPON ONT Loss of Signal (Red LOS Light)",
          category: "Broadband Fibre",
          problem: "The fiber ONT modem has an blinking red 'LOS' indicator light and internet connectivity has dropped.",
          solution: "A red flashing LOS indicates an optical signal loss. Perform structured physical troubleshooting.",
          steps: [
            "Check the thin green/blue optical patch cable connecting your wall terminal block to the ONT modem. Ensure it isn't sharply bent, crimped, or pulled tight.",
            "Gently disconnect the fiber plug (holding the hard plastic collar only, never the glass core) and verify no visible dust. Re-seat it firmly until you hear a secure click.",
            "Power-cycle the ONT by disconnecting the power cord for 30 seconds.",
            "If the red LOS remains active, contact Celcom Service Desk. This usually implies external backbone splicing breaks."
          ],
          views: 142,
          helpfulCount: 48
        },
        {
          id: "kb-2",
          title: "Camera IP Timeout on Hikvision DVR Console",
          category: "CCTV Systems",
          problem: "Camera feeds displaying 'No Video' or 'IP Address Timeout' on central DVR/NVR dashboard monitor.",
          solution: "Troubleshoot system power lines and switches.",
          steps: [
            "Inspect the PoE Switch ports to confirm LED indicators are actively flashing green. If dark, check the switch fuse.",
            "Confirm the NVR ethernet connection segment to the primary core switch has not been unplugged.",
            "Reset the IP dome module using the DVR administrative search utility."
          ],
          views: 89,
          helpfulCount: 31
        }
      ],
      slaRules: this.defaultSlaRules
    };

    this.writeStore(seed);
    return seed;
  }

  private writeStore(data: SupportStoreData) {
    try {
      const dir = path.dirname(SUPPORT_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SUPPORT_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("SUPPORT_SERVICE", "Failed to write support_store.json", e);
    }
  }

  private getInventoryProducts(): any[] {
    try {
      if (fs.existsSync(INVENTORY_STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(INVENTORY_STORE_PATH, "utf-8"));
        return data.products || [];
      }
    } catch (e) {
      logger.error("SUPPORT_SERVICE", "Failed to load inventory products", e);
    }
    return [
      { id: "prod-1", sku: "MT-HEX-GR3", name: "Mikrotik hEX gr3 Gigabit Router", costPrice: 6500 },
      { id: "prod-2", sku: "UBNT-UAP-AC-LITE", name: "Ubiquiti UniFi AC Lite AP", costPrice: 9000 },
      { id: "prod-3", sku: "HK-DOME-5MP", name: "Hikvision 5MP Dome Camera", costPrice: 4200 }
    ];
  }

  // -------------------------------------------------------------
  // ANALYTICS & STATS
  // -------------------------------------------------------------

  public async getDashboardStats() {
    const store = this.readStore();
    const tkts = store.tickets;

    const total = tkts.length;
    const open = tkts.filter(t => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(t.status)).length;
    const resolved = tkts.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
    
    // SLA calculations
    const responseEvaluated = tkts.filter(t => t.slaResponseMet !== undefined);
    const responseMet = responseEvaluated.filter(t => t.slaResponseMet === true).length;
    const responseSlaRate = responseEvaluated.length > 0 ? (responseMet / responseEvaluated.length) * 100 : 100;

    const resolutionEvaluated = tkts.filter(t => t.slaResolutionMet !== undefined);
    const resolutionMet = resolutionEvaluated.filter(t => t.slaResolutionMet === true).length;
    const resolutionSlaRate = resolutionEvaluated.length > 0 ? (resolutionMet / resolutionEvaluated.length) * 100 : 100;

    // CSAT Score
    const rated = tkts.filter(t => t.feedbackRating !== undefined);
    const averageRating = rated.length > 0 ? Number((rated.reduce((sum, t) => sum + (t.feedbackRating || 0), 0) / rated.length).toFixed(1)) : 5.0;
    const csatAverage = rated.length > 0 ? Math.round(rated.reduce((sum, t) => sum + (t.csatScore || 0), 0) / rated.length) : 100;

    // Category distribution
    const categoryCount: Record<string, number> = {};
    tkts.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    return {
      totalTickets: total,
      openTickets: open,
      resolvedTickets: resolved,
      slaResponseSuccessRate: responseSlaRate,
      slaResolutionSuccessRate: resolutionSlaRate,
      averageRating,
      csatAverage,
      categoryStats: Object.entries(categoryCount).map(([key, value]) => ({ category: key, count: value })),
      jobCardsCount: store.jobCards.length,
      schedulesCount: store.maintenanceSchedules.length,
      knowledgeCount: store.knowledgeBase.length
    };
  }

  // -------------------------------------------------------------
  // TICKET ACTIONS
  // -------------------------------------------------------------

  public async getTickets() {
    return this.readStore().tickets;
  }

  public async getTicketById(id: string) {
    return this.readStore().tickets.find(t => t.id === id);
  }

  public async createTicket(data: any) {
    const store = this.readStore();
    const ticketNumber = `TKT-2026-${String(store.tickets.length + 1).padStart(3, "0")}`;

    // Look up SLA rules for Priority
    const rule = store.slaRules.find(r => r.priority === data.priority) || { priority: data.priority, responseHours: 4, resolutionHours: 12 };
    
    const createdDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + rule.resolutionHours * 60 * 60 * 1000).toISOString();

    const newTicket: SupportTicket = {
      id: `tkt-${crypto.randomUUID()}`,
      ticketNumber,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom ERP Customer",
      contactPerson: data.contactPerson || "Customer Admin",
      phone: data.phone || "+254 711 000000",
      email: data.email || "support@client.co.ke",
      category: data.category || "GENERAL_INQUIRY",
      description: data.description || "",
      priority: data.priority || "MEDIUM",
      status: data.status || "OPEN",
      assignedTechnician: data.assignedTechnician,
      createdDate,
      dueDate,
      slaResponseHoursLimit: rule.responseHours,
      slaResolutionHoursLimit: rule.resolutionHours,
      messages: [
        {
          id: `msg-${crypto.randomUUID()}`,
          ticketId: ticketNumber,
          sender: "SYSTEM",
          senderName: "Celcom Support Gateway",
          message: `Ticket successfully instantiated via ${data.channel || "Manual entry"}. Description mapped.`,
          timestamp: createdDate
        }
      ]
    };

    if (newTicket.assignedTechnician) {
      newTicket.status = "ASSIGNED";
      newTicket.slaResponseMet = true; // immediately responded
      newTicket.messages.push({
        id: `msg-${crypto.randomUUID()}`,
        ticketId: newTicket.id,
        sender: "SYSTEM",
        senderName: "Celcom SLA Engine",
        message: `Field technician ${newTicket.assignedTechnician} automatically dispatched under priority SLA constraints.`,
        timestamp: createdDate
      });
    }

    store.tickets.unshift(newTicket);
    this.writeStore(store);

    // CRM Integration Logging
    this.triggerCrmLog(newTicket.customerId, `Support Ticket ${ticketNumber} raised: Category ${newTicket.category}, Priority ${newTicket.priority}.`);

    return newTicket;
  }

  public async updateTicket(id: string, data: any) {
    const store = this.readStore();
    const idx = store.tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const ticket = store.tickets[idx];

    if (data.assignedTechnician && !ticket.assignedTechnician) {
      ticket.assignedTechnician = data.assignedTechnician;
      ticket.status = "ASSIGNED";
      ticket.slaResponseMet = true;
      ticket.messages.push({
        id: `msg-${crypto.randomUUID()}`,
        ticketId: ticket.id,
        sender: "SYSTEM",
        senderName: "SLA Dispatch Engine",
        message: `Technician assigned: ${data.assignedTechnician}. SLA Response verified as MET.`,
        timestamp: new Date().toISOString()
      });
    }

    if (data.status !== undefined) {
      const oldStatus = ticket.status;
      ticket.status = data.status;

      if (ticket.status === "RESOLVED" && oldStatus !== "RESOLVED") {
        ticket.resolvedDate = new Date().toISOString();
        // evaluate SLA Resolution
        const elapsedMs = new Date(ticket.resolvedDate).getTime() - new Date(ticket.createdDate).getTime();
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        ticket.slaResolutionMet = elapsedHours <= ticket.slaResolutionHoursLimit;

        ticket.messages.push({
          id: `msg-${crypto.randomUUID()}`,
          ticketId: ticket.id,
          sender: "SYSTEM",
          senderName: "SLA Auditing Engine",
          message: `Technical intervention resolved. Resolution SLA audit completed: ${ticket.slaResolutionMet ? "MET" : "BREACHED"}.`,
          timestamp: ticket.resolvedDate
        });
      }
    }

    if (data.description !== undefined) ticket.description = data.description;
    if (data.priority !== undefined) ticket.priority = data.priority;

    store.tickets[idx] = ticket;
    this.writeStore(store);
    return ticket;
  }

  public async addTicketMessage(ticketId: string, messageData: any) {
    const store = this.readStore();
    const idx = store.tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error("Ticket not found.");

    const ticket = store.tickets[idx];
    const newMessage: TicketMessage = {
      id: `msg-${crypto.randomUUID()}`,
      ticketId,
      sender: messageData.sender || "SUPPORT_AGENT",
      senderName: messageData.senderName || "Celcom Specialist",
      message: messageData.message,
      timestamp: new Date().toISOString(),
      attachmentUrl: messageData.attachmentUrl
    };

    ticket.messages.push(newMessage);

    // If customer replies, maybe swap status to open or in progress
    if (newMessage.sender === "CUSTOMER" && ticket.status === "WAITING_CUSTOMER") {
      ticket.status = "IN_PROGRESS";
    }

    store.tickets[idx] = ticket;
    this.writeStore(store);
    return newMessage;
  }

  // -------------------------------------------------------------
  // JOB CARDS & INVENTORY STOCK-OUT
  // -------------------------------------------------------------

  public async getJobCards() {
    return this.readStore().jobCards;
  }

  public async createJobCardFromTicket(ticketId: string, data: any) {
    const store = this.readStore();
    const ticket = store.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket reference not found.");

    const jobNumber = `JC-SUP-${String(store.jobCards.length + 1).padStart(3, "0")}`;
    const newJob: SupportJobCard = {
      id: `jc-${crypto.randomUUID()}`,
      jobNumber,
      ticketId,
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      location: data.location || "Nairobi Client HQ",
      problemDescription: ticket.description,
      technician: ticket.assignedTechnician || data.technician || "Joseph Kariuki",
      toolsRequired: data.toolsRequired || "Standard termination & diagnostic toolkit",
      materialsRequired: data.materialsRequired || [],
      workDone: "",
      status: "OPEN"
    };

    store.jobCards.unshift(newJob);
    this.writeStore(store);
    return newJob;
  }

  public async completeJobCard(id: string, data: any) {
    const store = this.readStore();
    const idx = store.jobCards.findIndex(j => j.id === id);
    if (idx === -1) return null;

    const job = store.jobCards[idx];
    job.workDone = data.workDone || "No logs input.";
    job.customerSignature = data.customerSignature || "Unsigned / Digitally Authorized";
    job.status = "COMPLETED";
    job.completedAt = new Date().toISOString();

    // INVENTORY INTEGRATION: Stock out any materials used during this technical service
    const materials = job.materialsRequired || [];
    for (const mat of materials) {
      if (mat.qty > 0) {
        this.triggerInventoryTransaction(mat.productId, -mat.qty, `Field service dispatch for Job ${job.jobNumber}`);
      }
    }

    // Auto-resolve associated Ticket
    const ticketIdx = store.tickets.findIndex(t => t.id === job.ticketId);
    if (ticketIdx !== -1) {
      store.tickets[ticketIdx].status = "RESOLVED";
      store.tickets[ticketIdx].resolvedDate = new Date().toISOString();
      const elapsedMs = new Date(store.tickets[ticketIdx].resolvedDate).getTime() - new Date(store.tickets[ticketIdx].createdDate).getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      store.tickets[ticketIdx].slaResolutionMet = elapsedHours <= store.tickets[ticketIdx].slaResolutionHoursLimit;
      store.tickets[ticketIdx].messages.push({
        id: `msg-${crypto.randomUUID()}`,
        ticketId: job.ticketId,
        sender: "SYSTEM",
        senderName: "Service Desk Agent",
        message: `Support Job Card ${job.jobNumber} successfully completed. Ticket auto-resolved.`,
        timestamp: new Date().toISOString()
      });
    }

    store.jobCards[idx] = job;
    this.writeStore(store);
    return job;
  }

  // -------------------------------------------------------------
  // PREVENTIVE MAINTENANCE SCHEDULING
  // -------------------------------------------------------------

  public async getSchedules() {
    return this.readStore().maintenanceSchedules;
  }

  public async createSchedule(data: any) {
    const store = this.readStore();
    const scheduleNumber = `PM-${String(store.maintenanceSchedules.length + 1).padStart(3, "0")}`;

    const newSchedule: MaintenanceSchedule = {
      id: `maint-${crypto.randomUUID()}`,
      scheduleNumber,
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom Corporate Customer",
      equipment: data.equipment || "Central Distribution Backbone Unit",
      serviceDate: data.serviceDate || new Date().toISOString().split("T")[0],
      technician: data.technician || "Joseph Kariuki",
      nextMaintenanceDate: data.nextMaintenanceDate || "",
      notes: data.notes || "Periodic preventative sweeping.",
      status: "SCHEDULED"
    };

    store.maintenanceSchedules.unshift(newSchedule);
    this.writeStore(store);
    return newSchedule;
  }

  public async completeSchedule(id: string) {
    const store = this.readStore();
    const idx = store.maintenanceSchedules.findIndex(s => s.id === id);
    if (idx === -1) return null;

    store.maintenanceSchedules[idx].status = "COMPLETED";
    this.writeStore(store);
    return store.maintenanceSchedules[idx];
  }

  // -------------------------------------------------------------
  // FEEDBACKS & CSAT
  // -------------------------------------------------------------

  public async submitFeedback(ticketId: string, rating: number, comments: string) {
    const store = this.readStore();
    const idx = store.tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error("Ticket not found.");

    const ticket = store.tickets[idx];
    ticket.feedbackRating = Math.max(1, Math.min(5, Number(rating)));
    ticket.feedbackComments = comments;
    ticket.csatScore = Math.round((ticket.feedbackRating / 5) * 100);

    store.tickets[idx] = ticket;
    this.writeStore(store);

    // Record in CRM customer feed
    this.triggerCrmLog(ticket.customerId, `Customer satisfaction feedback recorded for Ticket ${ticket.ticketNumber}: Rating ${ticket.feedbackRating}/5 stars. CSAT: ${ticket.csatScore}%`);

    return ticket;
  }

  // -------------------------------------------------------------
  // KNOWLEDGE BASE (COMMON CODES)
  // -------------------------------------------------------------

  public async getKnowledgeBase() {
    return this.readStore().knowledgeBase;
  }

  public async incrementHelpfulCount(id: string) {
    const store = this.readStore();
    const idx = store.knowledgeBase.findIndex(kb => kb.id === id);
    if (idx === -1) return null;
    store.knowledgeBase[idx].helpfulCount += 1;
    store.knowledgeBase[idx].views += 1;
    this.writeStore(store);
    return store.knowledgeBase[idx];
  }

  // -------------------------------------------------------------
  // INTERNAL SYSTEM PROPAGATIONS & LOGGERS
  // -------------------------------------------------------------

  private triggerInventoryTransaction(productId: string, quantity: number, reason: string) {
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
            type: quantity > 0 ? "STOCK_IN" : "STOCK_OUT",
            referenceId: null,
            refDocument: "Support Job Card",
            reason,
            performedBy: "support_agent_service",
            createdAt: new Date().toISOString()
          });
          fs.writeFileSync(INVENTORY_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
          logger.info("SUPPORT_SERVICE", `Inventory adjustment triggered: ${productId} by ${quantity} due to: ${reason}`);
        }
      }
    } catch (e) {
      logger.error("SUPPORT_SERVICE", "Failed to propagate stock transactions", e);
    }
  }

  private triggerCrmLog(customerId: string, logDetails: string) {
    try {
      if (fs.existsSync(CRM_STORE_PATH)) {
        const crmData = JSON.parse(fs.readFileSync(CRM_STORE_PATH, "utf-8"));
        if (!crmData.history) crmData.history = [];
        crmData.history.push({
          id: `hist-${crypto.randomUUID()}`,
          customerId,
          eventType: "SYSTEM_LOG",
          eventDetails: logDetails,
          performedBy: "Celcom Support Central",
          createdAt: new Date().toISOString()
        });
        fs.writeFileSync(CRM_STORE_PATH, JSON.stringify(crmData, null, 2), "utf-8");
        logger.info("SUPPORT_SERVICE", `CRM customer log injected: ${customerId}`);
      }
    } catch (e) {
      logger.error("SUPPORT_SERVICE", "Failed to log CRM customer history", e);
    }
  }
}
