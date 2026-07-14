import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";

const ISP_STORE_PATH = path.join(process.cwd(), "src/backend/data/isp_store.json");
const INVENTORY_STORE_PATH = path.join(process.cwd(), "src/backend/data/inventory_store.json");
const SALES_STORE_PATH = path.join(process.cwd(), "src/backend/data/sales_store.json");

// -------------------------------------------------------------
// ISP MODULE INTERFACES
// -------------------------------------------------------------

export interface InternetPackageStore {
  id: string;
  name: string;
  bandwidth: string; // e.g. "15 Mbps"
  downloadSpeed: string; // e.g. "15 Mbps"
  uploadSpeed: string; // e.g. "15 Mbps"
  monthlyPrice: number; // KES
  installationFee: number; // KES
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ISPSubscriberStore {
  id: string; // Subscriber ID e.g. SUB-001
  customerId: string; // Ref to CRM Customer
  customerName: string;
  accountNumber: string; // CEL-XXXX
  installationAddress: string;
  gpsCoordinates: string; // e.g. "-1.2921, 36.8219"
  phoneNumber: string;
  email: string;
  connectionDate: string;
  packageId: string;
  packageName: string;
  monthlyPrice: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISCONNECTED" | "CANCELLED";
  pppoeUsername?: string;
  pppoePassword?: string;
  ipType: "DYNAMIC" | "STATIC";
  staticIpAddress?: string;
  ontMac?: string;
  oltPort?: string;
  connectionType: "FIBER" | "WIRELESS" | "COPPER";
}

export interface InstallationStore {
  id: string;
  installationNumber: string; // INS-2026-XXX
  subscriberId: string;
  customerName: string;
  technicianName: string;
  installationDate: string;
  location: string;
  equipmentUsed: string[]; // Serial Numbers assigned
  materialsUsed: string; // Cable, brackets, ODF splitters, etc.
  installationCost: number; // KES
  status: "SCHEDULED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface RouterAssignmentStore {
  id: string;
  serialNumber: string;
  macAddress: string;
  deviceModel: string;
  installationDate: string;
  subscriberId: string;
  subscriberName: string;
  warrantyEndDate: string;
  notes?: string;
}

export interface SubscriptionInvoiceStore {
  id: string;
  invoiceNumber: string; // INV-SUB-2026-XXX
  subscriberId: string;
  customerName: string;
  packageName: string;
  amount: number;
  dueDate: string;
  billingPeriod: string; // e.g. "July 2026"
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  createdAt: string;
}

export interface ServiceStatusHistoryStore {
  id: string;
  subscriberId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  date: string;
  approvedBy: string;
}

export interface NetworkDeviceStore {
  id: string;
  name: string;
  deviceType: "MIKROTIK" | "UBIQUITI" | "RADIUS_SERVER";
  ipAddress: string;
  connectionStatus: "ONLINE" | "OFFLINE" | "ERROR";
  apiUsername?: string;
  apiPassword?: string;
  lastSync: string;
  logs: { timestamp: string; type: "INFO" | "WARNING" | "ERROR"; message: string }[];
}

export interface ISPStoreData {
  packages: InternetPackageStore[];
  subscribers: ISPSubscriberStore[];
  installations: InstallationStore[];
  routerAssignments: RouterAssignmentStore[];
  subscriptionInvoices: SubscriptionInvoiceStore[];
  statusHistory: ServiceStatusHistoryStore[];
  networkDevices: NetworkDeviceStore[];
}

export class IspService {
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
  // STORE ACCESS WITH HIGH QUALITY INITIAL DATA
  // -------------------------------------------------------------

  private readStore(): ISPStoreData {
    try {
      if (fs.existsSync(ISP_STORE_PATH)) {
        const raw = fs.readFileSync(ISP_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("ISP_SERVICE", "Failed to read isp_store.json, creating seed data", e);
    }

    // Default seed representing Celcom Networks Kenya Broadband
    const seedStore: ISPStoreData = {
      packages: [
        {
          id: "pkg-1",
          name: "Celcom Home Basic",
          bandwidth: "15 Mbps",
          downloadSpeed: "15 Mbps",
          uploadSpeed: "15 Mbps",
          monthlyPrice: 2499,
          installationFee: 3000,
          description: "Unlimited high-speed home fiber internet. Perfect for streaming HD and remote studies.",
          status: "ACTIVE"
        },
        {
          id: "pkg-2",
          name: "Celcom Home Premium",
          bandwidth: "30 Mbps",
          downloadSpeed: "30 Mbps",
          uploadSpeed: "30 Mbps",
          monthlyPrice: 4499,
          installationFee: 3000,
          description: "High performance home fiber for heavy gaming, UHD streaming, and multi-user remote work.",
          status: "ACTIVE"
        },
        {
          id: "pkg-3",
          name: "Celcom Business Office",
          bandwidth: "50 Mbps",
          downloadSpeed: "50 Mbps",
          uploadSpeed: "50 Mbps",
          monthlyPrice: 9499,
          installationFee: 5000,
          description: "Symmetric fiber connectivity with a static IP and 99.5% uptime SLA for SMEs.",
          status: "ACTIVE"
        },
        {
          id: "pkg-4",
          name: "Celcom Dedicated Lease",
          bandwidth: "100 Mbps",
          downloadSpeed: "100 Mbps",
          uploadSpeed: "100 Mbps",
          monthlyPrice: 34999,
          installationFee: 15000,
          description: "Full duplex 1:1 dedicated lease line, managed router, 24/7 proactive monitoring, and static IP block.",
          status: "ACTIVE"
        }
      ],
      subscribers: [
        {
          id: "SUB-001",
          customerId: "cust-1",
          customerName: "Safaricom PLC",
          accountNumber: "CEL-3801",
          installationAddress: "Safaricom House, Waiyaki Way, Westlands, Nairobi",
          gpsCoordinates: "-1.2618, 36.8041",
          phoneNumber: "+254 711 000000",
          email: "noc@safaricom.co.ke",
          connectionDate: "2026-01-15",
          packageId: "pkg-4",
          packageName: "Celcom Dedicated Lease",
          monthlyPrice: 34999,
          status: "ACTIVE",
          pppoeUsername: "safaricom_westlands_pppoe",
          pppoePassword: "Safaricom99SecurePass",
          ipType: "STATIC",
          staticIpAddress: "197.248.88.10",
          ontMac: "FC:42:03:E1:90:2B",
          oltPort: "OLT-NBO-01 / Slot 2 / Port 4",
          connectionType: "FIBER"
        },
        {
          id: "SUB-002",
          customerId: "cust-2",
          customerName: "Equator ICT Solutions",
          accountNumber: "CEL-1104",
          installationAddress: "Delta Corner Towers, Block B, 4th Floor, Westlands, Nairobi",
          gpsCoordinates: "-1.2642, 36.8068",
          phoneNumber: "+254 722 990112",
          email: "billing@equatorict.com",
          connectionDate: "2026-03-20",
          packageId: "pkg-3",
          packageName: "Celcom Business Office",
          monthlyPrice: 9499,
          status: "ACTIVE",
          pppoeUsername: "equator_ict_biz",
          pppoePassword: "EquatorPasswordPass",
          ipType: "STATIC",
          staticIpAddress: "197.248.88.25",
          ontMac: "AC:8D:12:F1:C0:BB",
          oltPort: "OLT-NBO-01 / Slot 1 / Port 8",
          connectionType: "FIBER"
        },
        {
          id: "SUB-003",
          customerId: "cust-3",
          customerName: "Alpha Telecomm Ltd",
          accountNumber: "CEL-9024",
          installationAddress: "Marsabit Plaza, Ngong Road, Nairobi",
          gpsCoordinates: "-1.3005, 36.7820",
          phoneNumber: "+254 703 100400",
          email: "noc@alphatel.co.ke",
          connectionDate: "2026-04-10",
          packageId: "pkg-2",
          packageName: "Celcom Home Premium",
          monthlyPrice: 4499,
          status: "SUSPENDED",
          pppoeUsername: "alphatel_ngong",
          pppoePassword: "AlphaSecureNgong",
          ipType: "DYNAMIC",
          ontMac: "00:E0:4C:82:11:F2",
          oltPort: "OLT-NBO-02 / Slot 3 / Port 1",
          connectionType: "WIRELESS"
        },
        {
          id: "SUB-004",
          customerId: "cust-4",
          customerName: "Zainab Fatuma",
          accountNumber: "CEL-4411",
          installationAddress: "South C Estate, House 4B, Nairobi",
          gpsCoordinates: "-1.3204, 36.8288",
          phoneNumber: "+254 754 098321",
          email: "zainab.fat@gmail.com",
          connectionDate: "2026-05-15",
          packageId: "pkg-1",
          packageName: "Celcom Home Basic",
          monthlyPrice: 2499,
          status: "PENDING",
          pppoeUsername: "zainab_home_pppoe",
          pppoePassword: "ZainabHomeSecure",
          ipType: "DYNAMIC",
          ontMac: "48:8F:5A:CC:B8:EE",
          oltPort: "OLT-NBO-02 / Slot 1 / Port 12",
          connectionType: "FIBER"
        }
      ],
      installations: [
        {
          id: "ins-1",
          installationNumber: "INS-2026-001",
          subscriberId: "SUB-004",
          customerName: "Zainab Fatuma",
          technicianName: "Brian Omondi",
          installationDate: "2026-07-16",
          location: "South C Estate, House 4B, Nairobi",
          equipmentUsed: ["ONT-HUAWEI-9920", "FIBER-DROP-150M"],
          materialsUsed: "150m fiber drop cable, 4 cable ties, 1 micro-ODF wall box",
          installationCost: 3000,
          status: "SCHEDULED",
          notes: "Customer available after 2:00 PM. Needs neat routing along the ceiling."
        },
        {
          id: "ins-2",
          installationNumber: "INS-2026-002",
          subscriberId: "SUB-001",
          customerName: "Safaricom PLC",
          technicianName: "Esther Wanjiku",
          installationDate: "2026-01-14",
          location: "Safaricom House, Waiyaki Way, Westlands, Nairobi",
          equipmentUsed: ["SFP-10G-LR-CISCO", "FIBER-PATCH-5M"],
          materialsUsed: "5m fiber patch cord, rackmount enclosure",
          installationCost: 15000,
          status: "COMPLETED",
          notes: "Lease line spliced successfully. Attenuation is -18.2dBm at ODF port."
        }
      ],
      routerAssignments: [
        {
          id: "ra-1",
          serialNumber: "SN-MT-HEX-99011",
          macAddress: "FC:42:03:E1:90:2B",
          deviceModel: "MikroTik hEX gr3 Gigabit Router",
          installationDate: "2026-01-15",
          subscriberId: "SUB-001",
          subscriberName: "Safaricom PLC",
          warrantyEndDate: "2027-01-15",
          notes: "Lease line gigabit CPE"
        },
        {
          id: "ra-2",
          serialNumber: "SN-UBNT-AP-11022",
          macAddress: "AC:8D:12:F1:C0:BB",
          deviceModel: "Ubiquiti UniFi AP AC Lite",
          installationDate: "2026-03-20",
          subscriberId: "SUB-002",
          subscriberName: "Equator ICT Solutions",
          warrantyEndDate: "2027-03-20",
          notes: "Office Wi-Fi Hotspot"
        }
      ],
      subscriptionInvoices: [
        {
          id: "sinv-1",
          invoiceNumber: "INV-SUB-2026-001",
          subscriberId: "SUB-001",
          customerName: "Safaricom PLC",
          packageName: "Celcom Dedicated Lease",
          amount: 34999,
          dueDate: "2026-07-05",
          billingPeriod: "June 2026",
          status: "PAID",
          createdAt: "2026-06-25T08:00:00.000Z"
        },
        {
          id: "sinv-2",
          invoiceNumber: "INV-SUB-2026-002",
          subscriberId: "SUB-002",
          customerName: "Equator ICT Solutions",
          packageName: "Celcom Business Office",
          amount: 9499,
          dueDate: "2026-07-05",
          billingPeriod: "June 2026",
          status: "PAID",
          createdAt: "2026-06-25T08:00:00.000Z"
        },
        {
          id: "sinv-3",
          invoiceNumber: "INV-SUB-2026-003",
          subscriberId: "SUB-003",
          customerName: "Alpha Telecomm Ltd",
          packageName: "Celcom Home Premium",
          amount: 4499,
          dueDate: "2026-07-05",
          billingPeriod: "June 2026",
          status: "PENDING",
          createdAt: "2026-06-25T08:00:00.000Z"
        }
      ],
      statusHistory: [
        {
          id: "sh-1",
          subscriberId: "SUB-003",
          oldStatus: "ACTIVE",
          newStatus: "SUSPENDED",
          reason: "Non-payment of June 2026 invoice. Reminder sent on July 3rd.",
          date: "2026-07-10",
          approvedBy: "James Mwangi (Finance)"
        }
      ],
      networkDevices: [
        {
          id: "dev-1",
          name: "Nairobi HQ Core Router (MikroTik CCR2004)",
          deviceType: "MIKROTIK",
          ipAddress: "10.100.1.1",
          connectionStatus: "ONLINE",
          apiUsername: "admin_celcom",
          lastSync: "2026-07-14T07:30:00.000Z",
          logs: [
            { timestamp: "2026-07-14T07:00:00.000Z", type: "INFO", message: "API login verified. Fetching active PPPoE tunnels." },
            { timestamp: "2026-07-14T07:15:00.000Z", type: "INFO", message: "Synchronized 182 active subscriber tunnels with MikroTik RouterOS simple queues." }
          ]
        },
        {
          id: "dev-2",
          name: "NBO Westlands Sector UISP",
          deviceType: "UBIQUITI",
          ipAddress: "10.100.2.1",
          connectionStatus: "ONLINE",
          apiUsername: "uisp_operator",
          lastSync: "2026-07-14T07:28:00.000Z",
          logs: [
            { timestamp: "2026-07-14T06:45:00.000Z", type: "INFO", message: "Sector ping is normal (average latency 4ms)." }
          ]
        },
        {
          id: "dev-3",
          name: "Central RADIUS Authorization Server",
          deviceType: "RADIUS_SERVER",
          ipAddress: "10.100.1.10",
          connectionStatus: "ONLINE",
          apiUsername: "radius_admin",
          lastSync: "2026-07-14T07:32:00.000Z",
          logs: [
            { timestamp: "2026-07-14T07:30:00.000Z", type: "INFO", message: "FreeRADIUS database connection verified." },
            { timestamp: "2026-07-14T07:31:00.000Z", type: "WARNING", message: "Rejected login request for sub_dummy_pppoe from 102.11.12.3: User not found in database." }
          ]
        }
      ]
    };

    this.writeStore(seedStore);
    return seedStore;
  }

  private writeStore(data: ISPStoreData) {
    try {
      const dir = path.dirname(ISP_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ISP_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.error("ISP_SERVICE", "Failed to write isp_store.json", e);
    }
  }

  // -------------------------------------------------------------
  // INTERNET PACKAGES CRUD
  // -------------------------------------------------------------

  public async getPackages(): Promise<InternetPackageStore[]> {
    const store = this.readStore();
    return store.packages;
  }

  public async createPackage(data: Partial<InternetPackageStore>): Promise<InternetPackageStore> {
    const store = this.readStore();
    const newPkg: InternetPackageStore = {
      id: "pkg-" + Math.floor(Math.random() * 10000),
      name: data.name || "Unnamed Package",
      bandwidth: data.bandwidth || "10 Mbps",
      downloadSpeed: data.downloadSpeed || "10 Mbps",
      uploadSpeed: data.uploadSpeed || "10 Mbps",
      monthlyPrice: Number(data.monthlyPrice) || 0,
      installationFee: Number(data.installationFee) || 0,
      description: data.description || "",
      status: data.status || "ACTIVE"
    };
    store.packages.push(newPkg);
    this.writeStore(store);
    return newPkg;
  }

  public async updatePackage(id: string, data: Partial<InternetPackageStore>): Promise<InternetPackageStore> {
    const store = this.readStore();
    const idx = store.packages.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Internet package not found.");
    store.packages[idx] = {
      ...store.packages[idx],
      ...data,
      monthlyPrice: data.monthlyPrice !== undefined ? Number(data.monthlyPrice) : store.packages[idx].monthlyPrice,
      installationFee: data.installationFee !== undefined ? Number(data.installationFee) : store.packages[idx].installationFee,
    };
    this.writeStore(store);
    return store.packages[idx];
  }

  public async deletePackage(id: string): Promise<boolean> {
    const store = this.readStore();
    const filtered = store.packages.filter((p) => p.id !== id);
    if (filtered.length === store.packages.length) return false;
    store.packages = filtered;
    this.writeStore(store);
    return true;
  }

  // -------------------------------------------------------------
  // SUBSCRIBERS (ISP CUSTOMER) MANAGEMENT
  // -------------------------------------------------------------

  public async getSubscribers(): Promise<ISPSubscriberStore[]> {
    const store = this.readStore();
    return store.subscribers;
  }

  public async getSubscriber(id: string): Promise<ISPSubscriberStore | null> {
    const store = this.readStore();
    return store.subscribers.find((s) => s.id === id) || null;
  }

  public async createSubscriber(data: Partial<ISPSubscriberStore>): Promise<ISPSubscriberStore> {
    const store = this.readStore();
    const pkg = store.packages.find((p) => p.id === data.packageId);
    
    const newSub: ISPSubscriberStore = {
      id: "SUB-" + String(store.subscribers.length + 101),
      customerId: data.customerId || "cust-1",
      customerName: data.customerName || "Celcom Client",
      accountNumber: "CEL-" + Math.floor(1000 + Math.random() * 9000),
      installationAddress: data.installationAddress || "",
      gpsCoordinates: data.gpsCoordinates || "0.0, 0.0",
      phoneNumber: data.phoneNumber || "",
      email: data.email || "",
      connectionDate: data.connectionDate || new Date().toISOString().split("T")[0],
      packageId: data.packageId || "pkg-1",
      packageName: pkg ? pkg.name : "Celcom Home Basic",
      monthlyPrice: pkg ? pkg.monthlyPrice : 2499,
      status: "PENDING",
      pppoeUsername: data.pppoeUsername || "",
      pppoePassword: data.pppoePassword || "SecuredPass123",
      ipType: data.ipType || "DYNAMIC",
      staticIpAddress: data.staticIpAddress || undefined,
      ontMac: data.ontMac || "",
      oltPort: data.oltPort || "OLT-NBO-01 / Port 1",
      connectionType: data.connectionType || "FIBER"
    };

    store.subscribers.push(newSub);
    this.writeStore(store);

    // Automatically schedule an installation for a new subscriber
    const newIns: InstallationStore = {
      id: "ins-" + Math.floor(Math.random() * 10000),
      installationNumber: "INS-2026-" + String(store.installations.length + 101),
      subscriberId: newSub.id,
      customerName: newSub.customerName,
      technicianName: "Brian Omondi (Unassigned)",
      installationDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], // 2 days in future
      location: newSub.installationAddress,
      equipmentUsed: [],
      materialsUsed: "Fiber drop cable, ODF drop, standard accessories",
      installationCost: pkg ? pkg.installationFee : 3000,
      status: "SCHEDULED",
      notes: "Auto-generated for pending broadband subscriber."
    };
    store.installations.push(newIns);
    this.writeStore(store);

    return newSub;
  }

  public async updateSubscriber(id: string, data: Partial<ISPSubscriberStore>): Promise<ISPSubscriberStore> {
    const store = this.readStore();
    const idx = store.subscribers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Subscriber not found.");
    
    let updatedPackageDetails = {};
    if (data.packageId && data.packageId !== store.subscribers[idx].packageId) {
      const pkg = store.packages.find((p) => p.id === data.packageId);
      if (pkg) {
        updatedPackageDetails = {
          packageName: pkg.name,
          monthlyPrice: pkg.monthlyPrice
        };
      }
    }

    store.subscribers[idx] = {
      ...store.subscribers[idx],
      ...data,
      ...updatedPackageDetails
    };
    this.writeStore(store);
    return store.subscribers[idx];
  }

  public async changeSubscriberStatus(
    id: string,
    newStatus: "ACTIVE" | "SUSPENDED" | "DISCONNECTED" | "CANCELLED",
    reason: string,
    approvedBy: string
  ): Promise<ISPSubscriberStore> {
    const store = this.readStore();
    const idx = store.subscribers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Subscriber not found.");

    const oldStatus = store.subscribers[idx].status;
    store.subscribers[idx].status = newStatus;

    // Create a history trace entry
    const trace: ServiceStatusHistoryStore = {
      id: "sh-" + Math.floor(Math.random() * 10000),
      subscriberId: id,
      oldStatus,
      newStatus,
      reason,
      date: new Date().toISOString().split("T")[0],
      approvedBy
    };
    store.statusHistory.push(trace);
    this.writeStore(store);
    return store.subscribers[idx];
  }

  // -------------------------------------------------------------
  // INSTALLATION MANAGEMENT
  // -------------------------------------------------------------

  public async getInstallations(): Promise<InstallationStore[]> {
    const store = this.readStore();
    return store.installations;
  }

  public async createInstallation(data: Partial<InstallationStore>): Promise<InstallationStore> {
    const store = this.readStore();
    const newIns: InstallationStore = {
      id: "ins-" + Math.floor(Math.random() * 10000),
      installationNumber: "INS-2026-" + String(store.installations.length + 101),
      subscriberId: data.subscriberId || "SUB-001",
      customerName: data.customerName || "Unknown Client",
      technicianName: data.technicianName || "Brian Omondi",
      installationDate: data.installationDate || new Date().toISOString().split("T")[0],
      location: data.location || "",
      equipmentUsed: data.equipmentUsed || [],
      materialsUsed: data.materialsUsed || "",
      installationCost: Number(data.installationCost) || 3000,
      status: "SCHEDULED",
      notes: data.notes || ""
    };
    store.installations.push(newIns);
    this.writeStore(store);
    return newIns;
  }

  public async updateInstallationStatus(
    id: string,
    status: "SCHEDULED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    technicianName?: string,
    equipmentUsed?: string[],
    materialsUsed?: string,
    installationCost?: number
  ): Promise<InstallationStore> {
    const store = this.readStore();
    const idx = store.installations.findIndex((ins) => ins.id === id);
    if (idx === -1) throw new Error("Installation record not found.");

    store.installations[idx].status = status;
    if (technicianName) store.installations[idx].technicianName = technicianName;
    if (equipmentUsed) store.installations[idx].equipmentUsed = equipmentUsed;
    if (materialsUsed) store.installations[idx].materialsUsed = materialsUsed;
    if (installationCost !== undefined) store.installations[idx].installationCost = Number(installationCost);

    // If completed, automatically flip the subscriber status to ACTIVE and create equipment assignments
    if (status === "COMPLETED") {
      const subId = store.installations[idx].subscriberId;
      const subIdx = store.subscribers.findIndex((s) => s.id === subId);
      if (subIdx !== -1) {
        store.subscribers[subIdx].status = "ACTIVE";
      }

      // Automatically register a router assignment from equipmentUsed
      if (equipmentUsed && equipmentUsed.length > 0) {
        for (const sn of equipmentUsed) {
          const assignment: RouterAssignmentStore = {
            id: "ra-" + Math.floor(Math.random() * 10000),
            serialNumber: sn,
            macAddress: store.subscribers[subIdx]?.ontMac || "FC:42:00:AA:BB:CC",
            deviceModel: sn.includes("ONT") ? "Huawei XPON Dualband ONT Router" : "MikroTik hAP Client AP",
            installationDate: new Date().toISOString().split("T")[0],
            subscriberId: subId,
            subscriberName: store.installations[idx].customerName,
            warrantyEndDate: new Date(Date.now() + 31536000000).toISOString().split("T")[0], // 1 year warranty
            notes: "Assigned via deployment completion form."
          };
          store.routerAssignments.push(assignment);
        }
      }
    }

    this.writeStore(store);
    return store.installations[idx];
  }

  // -------------------------------------------------------------
  // ROUTER & EQUIPMENT ASSIGNMENT
  // -------------------------------------------------------------

  public async getEquipmentAssignments(): Promise<RouterAssignmentStore[]> {
    const store = this.readStore();
    return store.routerAssignments;
  }

  public async createEquipmentAssignment(data: Partial<RouterAssignmentStore>): Promise<RouterAssignmentStore> {
    const store = this.readStore();
    const newRa: RouterAssignmentStore = {
      id: "ra-" + Math.floor(Math.random() * 10000),
      serialNumber: data.serialNumber || "SN-WIFI-" + Math.floor(100000 + Math.random() * 900000),
      macAddress: data.macAddress || "00:AA:BB:CC:DD:EE",
      deviceModel: data.deviceModel || "MikroTik hAP ac2 Dualband",
      installationDate: data.installationDate || new Date().toISOString().split("T")[0],
      subscriberId: data.subscriberId || "SUB-001",
      subscriberName: data.subscriberName || "Unknown Client",
      warrantyEndDate: data.warrantyEndDate || new Date(Date.now() + 31536000000).toISOString().split("T")[0],
      notes: data.notes || ""
    };

    store.routerAssignments.push(newRa);
    this.writeStore(store);

    // Integrate with Inventory Store if exists by marking serial number as ALLOCATED
    try {
      if (fs.existsSync(INVENTORY_STORE_PATH)) {
        const rawInv = fs.readFileSync(INVENTORY_STORE_PATH, "utf-8");
        const invStore = JSON.parse(rawInv);
        if (invStore && invStore.serialTrackers) {
          const sIdx = invStore.serialTrackers.findIndex((st: any) => st.serialNumber === newRa.serialNumber);
          if (sIdx !== -1) {
            invStore.serialTrackers[sIdx].status = "ALLOCATED";
            invStore.serialTrackers[sIdx].transactionRef = newRa.subscriberId;
            fs.writeFileSync(INVENTORY_STORE_PATH, JSON.stringify(invStore, null, 2), "utf-8");
          }
        }
      }
    } catch (e) {
      logger.error("ISP_SERVICE", "Failed to update serial tracker state in inventory", e);
    }

    return newRa;
  }

  // -------------------------------------------------------------
  // MONTHLY BILLING RUN & FINANCE INTEGRATION
  // -------------------------------------------------------------

  public async getBillingInvoices(): Promise<SubscriptionInvoiceStore[]> {
    const store = this.readStore();
    return store.subscriptionInvoices;
  }

  public async executeIspRecurringBillingRun(billingPeriod: string, actorName: string): Promise<SubscriptionInvoiceStore[]> {
    const store = this.readStore();
    const activeSubscribers = store.subscribers.filter((s) => s.status === "ACTIVE");
    const createdInvoices: SubscriptionInvoiceStore[] = [];

    for (const sub of activeSubscribers) {
      // Check if invoice already exists for this subscriber in this period to prevent double-billing
      const exists = store.subscriptionInvoices.some(
        (inv) => inv.subscriberId === sub.id && inv.billingPeriod === billingPeriod
      );

      if (exists) continue;

      const invoiceId = "sinv-" + Math.floor(Math.random() * 10000);
      const invoiceNo = "INV-SUB-2026-" + Math.floor(1000 + Math.random() * 9000);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10); // Due in 10 days

      const newInvoice: SubscriptionInvoiceStore = {
        id: invoiceId,
        invoiceNumber: invoiceNo,
        subscriberId: sub.id,
        customerName: sub.customerName,
        packageName: sub.packageName,
        amount: sub.monthlyPrice,
        dueDate: dueDate.toISOString().split("T")[0],
        billingPeriod,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };

      store.subscriptionInvoices.push(newInvoice);
      createdInvoices.push(newInvoice);

      // -------------------------------------------------------------
      // AUTOMATIC FINANCE INTEGRATION
      // When recurring billing triggers, write double-entry accounting lines:
      // Debit: Accounts Receivable (1200) - asset
      // Credit: ISP Subscriber Revenue (4100) - revenue
      // -------------------------------------------------------------
      try {
        if (fs.existsSync(SALES_STORE_PATH)) {
          const rawSales = fs.readFileSync(SALES_STORE_PATH, "utf-8");
          const salesStore = JSON.parse(rawSales);
          if (salesStore && salesStore.invoices) {
            // Add a customer-facing sales invoice so Customer/Finance is updated
            const salesInvoice = {
              id: "inv-" + Math.floor(Math.random() * 100000),
              invoiceNumber: invoiceNo,
              customerId: sub.customerId,
              customerName: sub.customerName,
              customerEmail: sub.email,
              subTotal: Number((sub.monthlyPrice / 1.16).toFixed(2)), // Net
              taxAmount: Number((sub.monthlyPrice * 0.16 / 1.16).toFixed(2)), // VAT 16% (Kenya)
              totalAmount: sub.monthlyPrice,
              amountPaid: 0,
              status: "SENT",
              dueDate: dueDate.toISOString().split("T")[0],
              items: [
                {
                  productId: "isp-service-ref",
                  name: `ISP Internet Package: ${sub.packageName} (${billingPeriod})`,
                  sku: "ISP-CONN",
                  quantity: 1,
                  unitPrice: sub.monthlyPrice
                }
              ],
              createdAt: new Date().toISOString()
            };
            salesStore.invoices.push(salesInvoice);
            fs.writeFileSync(SALES_STORE_PATH, JSON.stringify(salesStore, null, 2), "utf-8");
          }
        }
      } catch (e) {
        logger.error("ISP_SERVICE", "Failed to bridge subscriber invoice to sales system", e);
      }
    }

    this.writeStore(store);
    return createdInvoices;
  }

  // -------------------------------------------------------------
  // NETWORK DEVICE & API CONFIGS
  // -------------------------------------------------------------

  public async getNetworkDevices(): Promise<NetworkDeviceStore[]> {
    const store = this.readStore();
    return store.networkDevices;
  }

  public async createNetworkDevice(data: Partial<NetworkDeviceStore>): Promise<NetworkDeviceStore> {
    const store = this.readStore();
    const newDev: NetworkDeviceStore = {
      id: "dev-" + Math.floor(Math.random() * 10000),
      name: data.name || "Unnamed Switch",
      deviceType: data.deviceType || "MIKROTIK",
      ipAddress: data.ipAddress || "192.168.1.1",
      connectionStatus: "ONLINE",
      apiUsername: data.apiUsername || "operator",
      apiPassword: data.apiPassword || "password",
      lastSync: new Date().toISOString(),
      logs: [{ timestamp: new Date().toISOString(), type: "INFO", message: "Device registered." }]
    };
    store.networkDevices.push(newDev);
    this.writeStore(store);
    return newDev;
  }

  public async updateNetworkDevice(id: string, data: Partial<NetworkDeviceStore>): Promise<NetworkDeviceStore> {
    const store = this.readStore();
    const idx = store.networkDevices.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Network device not found.");

    store.networkDevices[idx] = {
      ...store.networkDevices[idx],
      ...data,
      lastSync: new Date().toISOString()
    };
    this.writeStore(store);
    return store.networkDevices[idx];
  }

  public async addDeviceLog(deviceId: string, type: "INFO" | "WARNING" | "ERROR", message: string): Promise<boolean> {
    const store = this.readStore();
    const idx = store.networkDevices.findIndex((d) => d.id === deviceId);
    if (idx === -1) return false;

    store.networkDevices[idx].logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message
    });
    // Cap logs to last 20
    if (store.networkDevices[idx].logs.length > 20) {
      store.networkDevices[idx].logs = store.networkDevices[idx].logs.slice(0, 20);
    }
    this.writeStore(store);
    return true;
  }

  // -------------------------------------------------------------
  // CUSTOMER PORTAL PREPARATION
  // -------------------------------------------------------------

  public async getCustomerPortalData(subscriberId: string) {
    const store = this.readStore();
    const sub = store.subscribers.find((s) => s.id === subscriberId);
    if (!sub) return null;

    const invoices = store.subscriptionInvoices.filter((inv) => inv.subscriberId === subscriberId);
    const installation = store.installations.find((ins) => ins.subscriberId === subscriberId);
    const router = store.routerAssignments.find((ra) => ra.subscriberId === subscriberId);

    return {
      subscriber: sub,
      invoices,
      installation,
      router
    };
  }

  // -------------------------------------------------------------
  // ISP ANALYTICS & REPORTS COMTROLLER
  // -------------------------------------------------------------

  public async getISPDashboardStats() {
    const store = this.readStore();
    const subs = store.subscribers;
    const invs = store.subscriptionInvoices;
    const insts = store.installations;

    const totalSubscribers = subs.length;
    const activeSubscribers = subs.filter((s) => s.status === "ACTIVE").length;
    const suspendedSubscribers = subs.filter((s) => s.status === "SUSPENDED").length;
    const pendingSubscribers = subs.filter((s) => s.status === "PENDING").length;

    // Financial totals (monthly price represents monthly recurring billing potential)
    const mrcRevenueKES = subs
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => sum + s.monthlyPrice, 0);

    const outstandingBalanceKES = invs
      .filter((i) => i.status === "PENDING")
      .reduce((sum, i) => sum + i.amount, 0);

    const collectedRevenueKES = invs
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amount, 0);

    // Package-level counts
    const packagePerformance = store.packages.map((pkg) => {
      const count = subs.filter((s) => s.packageId === pkg.id).length;
      return {
        name: pkg.name,
        count,
        price: pkg.monthlyPrice,
        totalValue: count * pkg.monthlyPrice
      };
    });

    // Recent installations
    const recentInstallations = insts.slice(-3);

    // Monthly Growth mock metrics
    const growthChart = [
      { month: "Feb 2026", active: 105, revenue: 450000, installations: 8 },
      { month: "Mar 2026", active: 120, revenue: 512000, installations: 15 },
      { month: "Apr 2026", active: 145, revenue: 640000, installations: 25 },
      { month: "May 2026", active: 180, revenue: 810000, installations: 35 },
      { month: "Jun 2026", active: 220, revenue: 990000, installations: 40 },
      { month: "Jul 2026", active: activeSubscribers, revenue: mrcRevenueKES, installations: insts.length }
    ];

    return {
      totalSubscribers,
      activeSubscribers,
      suspendedSubscribers,
      pendingSubscribers,
      mrcRevenueKES,
      outstandingBalanceKES,
      collectedRevenueKES,
      packagePerformance,
      recentInstallations,
      growthChart,
      devicesCount: store.networkDevices.length,
      onlineDevices: store.networkDevices.filter((d) => d.connectionStatus === "ONLINE").length
    };
  }
}
