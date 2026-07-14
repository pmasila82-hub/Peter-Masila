import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPrismaClient } from "./prisma.service";
import { logger } from "./logger.service";

const INVENTORY_STORE_PATH = path.join(process.cwd(), "src/backend/data/inventory_store.json");

// -------------------------------------------------------------
// INVENTORY INTERFACES
// -------------------------------------------------------------

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface InventoryBrand {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface InventoryProduct {
  id: string;
  sku: string;
  productCode: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  supplierId: string | null;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  vat: number; // e.g. 16.00
  warrantyPeriod: number; // in months
  isSerialized: boolean;
  imagePath: string | null;
  reorderLevel: number;
  maxStockLevel: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface InventoryWarehouse {
  id: string;
  name: string;
  location: string | null;
  stockAreas: string | null;
  managerId: string | null;
}

export interface InventoryItemStore {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
}

export interface SerialTrackerStore {
  id: string;
  inventoryItemId: string;
  serialNumber: string;
  status: "AVAILABLE" | "ALLOCATED" | "SOLD" | "DEFECTIVE";
  transactionRef: string | null;
  deviceType: string | null; // ROUTER, MIKROTIK, UBIQUITI, CAMERA, LAPTOP, ETC
  brandName: string | null;
  modelName: string | null;
  createdAt: string;
}

export interface WarrantyStore {
  id: string;
  serialTrackerId: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "VOIDED";
  notes: string | null;
  createdAt: string;
}

export interface InventoryTransactionStore {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number; // Positive for IN, Negative for OUT/TRANSFER_OUT
  type: "STOCK_IN" | "STOCK_OUT" | "STOCK_TRANSFER" | "STOCK_ADJUSTMENT" | "PURCHASE" | "SALE";
  referenceId: string | null;
  refDocument: string | null;
  reason: string | null;
  performedBy: string; // User ID
  createdAt: string;
}

export interface InventoryStore {
  categories: InventoryCategory[];
  brands: InventoryBrand[];
  products: InventoryProduct[];
  warehouses: InventoryWarehouse[];
  inventoryItems: InventoryItemStore[];
  serialTrackers: SerialTrackerStore[];
  warranties: WarrantyStore[];
  transactions: InventoryTransactionStore[];
}

export class InventoryService {
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
  // PERSISTENCE LAYER Fallback (JSON store)
  // -------------------------------------------------------------

  private readStore(): InventoryStore {
    try {
      if (fs.existsSync(INVENTORY_STORE_PATH)) {
        const raw = fs.readFileSync(INVENTORY_STORE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error("INVENTORY_SERVICE", "Failed to read inventory_store.json, using seed data", e);
    }

    // Seed Data representing professional ICT/Telecom setup
    const seedStore: InventoryStore = {
      categories: [
        { id: "cat-1", name: "Fibre Equipment", description: "Optical splitters, SFP modules, splice trays, drop cables" },
        { id: "cat-2", name: "Networking Equipment", description: "Routers, Switches, PoE injectors, APs, Gateways" },
        { id: "cat-3", name: "CCTV Equipment", description: "Dome IP cameras, bullet cameras, NVRs, bracket mounts" },
        { id: "cat-4", name: "Computer Hardware", description: "Staff laptops, workstations, rackmount servers" },
        { id: "cat-5", name: "Software & Licences", description: "Mikrotik RouterOS licenses, antivirus keys, VM software" },
        { id: "cat-6", name: "Accessories", description: "Cat6 Ethernet patch cords, RJ45 connectors, cable ties" },
        { id: "cat-7", name: "Tools & Safety Gear", description: "Fiber fusion splicers, OTDR meters, crimping tools" }
      ],
      brands: [
        { id: "brand-1", name: "Mikrotik", description: "Latvian network hardware manufacturer", status: "ACTIVE" },
        { id: "brand-2", name: "Ubiquiti", description: "Enterprise Wi-Fi and wireless link solutions", status: "ACTIVE" },
        { id: "brand-3", name: "Cisco Systems", description: "Corporate grade routing and switching hardware", status: "ACTIVE" },
        { id: "brand-4", name: "Dahua", description: "High-definition security surveillance systems", status: "ACTIVE" },
        { id: "brand-5", name: "Hikvision", description: "Surveillance camera and recording equipment", status: "ACTIVE" },
        { id: "brand-6", name: "Dell Technologies", description: "Premium servers, laptops, and client computing", status: "ACTIVE" },
        { id: "brand-7", name: "Corning", description: "Premium optic fiber cabling and accessories", status: "ACTIVE" }
      ],
      products: [
        {
          id: "prod-1",
          sku: "MT-HEX-GR3",
          productCode: "PROD-MT-001",
          barcode: "2000000001",
          name: "Mikrotik hEX gr3 Gigabit Router",
          description: "5x Gigabit Ethernet, Dual Core 880MHz CPU, 256MB RAM, USB, microSD",
          categoryId: "cat-2",
          brandId: "brand-1",
          supplierId: null,
          unitOfMeasure: "PCS",
          costPrice: 6500,
          sellingPrice: 9500,
          vat: 16.0,
          warrantyPeriod: 12,
          isSerialized: true,
          imagePath: null,
          reorderLevel: 10,
          maxStockLevel: 100,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-2",
          sku: "UBNT-UAP-AC-LITE",
          productCode: "PROD-UBNT-002",
          barcode: "2000000002",
          name: "Ubiquiti UniFi AC Lite Access Point",
          description: "802.11ac Dual-Radio Gigabit Indoor Access Point, 867Mbps",
          categoryId: "cat-2",
          brandId: "brand-2",
          supplierId: null,
          unitOfMeasure: "PCS",
          costPrice: 9000,
          sellingPrice: 13500,
          vat: 16.0,
          warrantyPeriod: 24,
          isSerialized: true,
          imagePath: null,
          reorderLevel: 5,
          maxStockLevel: 50,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-3",
          sku: "HK-DOME-5MP",
          productCode: "PROD-HK-003",
          barcode: "2000000003",
          name: "Hikvision 5MP Outdoor Dome IP Camera",
          description: "Exir 2.0 night vision, H.265+, IP67 weatherproof, PoE",
          categoryId: "cat-3",
          brandId: "brand-5",
          supplierId: null,
          unitOfMeasure: "PCS",
          costPrice: 4200,
          sellingPrice: 6800,
          vat: 16.0,
          warrantyPeriod: 12,
          isSerialized: true,
          imagePath: null,
          reorderLevel: 8,
          maxStockLevel: 80,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-4",
          sku: "FIB-SFP-10G-10KM",
          productCode: "PROD-FIB-004",
          barcode: "2000000004",
          name: "10G SFP+ Single-Mode Transceiver 1310nm 10km",
          description: "Duplex LC connector, hot-pluggable, DDMI support",
          categoryId: "cat-1",
          brandId: "brand-7",
          supplierId: null,
          unitOfMeasure: "PAIR",
          costPrice: 2500,
          sellingPrice: 4500,
          vat: 16.0,
          warrantyPeriod: 6,
          isSerialized: false,
          imagePath: null,
          reorderLevel: 20,
          maxStockLevel: 200,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-5",
          sku: "DELL-LAT-5440",
          productCode: "PROD-DELL-005",
          barcode: "2000000005",
          name: "Dell Latitude 5440 Core i7 Laptop",
          description: "Intel Core i7-1355U, 16GB DDR5, 512GB NVMe SSD, 14\" FHD, Windows 11 Pro",
          categoryId: "cat-4",
          brandId: "brand-6",
          supplierId: null,
          unitOfMeasure: "PCS",
          costPrice: 110000,
          sellingPrice: 145000,
          vat: 16.0,
          warrantyPeriod: 36,
          isSerialized: true,
          imagePath: null,
          reorderLevel: 2,
          maxStockLevel: 15,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      warehouses: [
        { id: "wh-1", name: "Mombasa Road HQ Warehouse", location: "Gateway Park, Block B, Mombasa Road, Nairobi", stockAreas: "Aisle A1-A4 (Core Network), Shelf B1 (Surveillance)", managerId: "admin-user" },
        { id: "wh-2", name: "Westlands Transit Hub", location: "Delta Corner Towers, Woodvale Grove, Westlands", stockAreas: "Floor 3 Rack Area, Transit lockers", managerId: null },
        { id: "wh-3", name: "Kisumu Regional Depot", location: "Mega Plaza, Oginga Odinga St, Kisumu", stockAreas: "Storage Room C, Tech Shelving", managerId: null }
      ],
      inventoryItems: [
        { id: "item-1", warehouseId: "wh-1", productId: "prod-1", quantity: 35 },
        { id: "item-2", warehouseId: "wh-1", productId: "prod-2", quantity: 20 },
        { id: "item-3", warehouseId: "wh-1", productId: "prod-3", quantity: 15 },
        { id: "item-4", warehouseId: "wh-1", productId: "prod-4", quantity: 60 },
        { id: "item-5", warehouseId: "wh-2", productId: "prod-1", quantity: 12 },
        { id: "item-6", warehouseId: "wh-2", productId: "prod-2", quantity: 4 }, // Low Stock! (min is 5)
        { id: "item-7", warehouseId: "wh-3", productId: "prod-5", quantity: 1 }  // Low Stock! (min is 2)
      ],
      serialTrackers: [
        { id: "sn-1", inventoryItemId: "item-1", serialNumber: "MT-HEX-GR3-SN001", status: "AVAILABLE", transactionRef: "GRN-2026-001", deviceType: "ROUTER", brandName: "Mikrotik", modelName: "hEX gr3", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "sn-2", inventoryItemId: "item-1", serialNumber: "MT-HEX-GR3-SN002", status: "AVAILABLE", transactionRef: "GRN-2026-001", deviceType: "ROUTER", brandName: "Mikrotik", modelName: "hEX gr3", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "sn-3", inventoryItemId: "item-2", serialNumber: "UBNT-UAP-SN9988", status: "AVAILABLE", transactionRef: "GRN-2026-001", deviceType: "ACCESS_POINT", brandName: "Ubiquiti", modelName: "UniFi AC Lite", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "sn-4", inventoryItemId: "item-3", serialNumber: "HK-DOME-5M-SN4422", status: "AVAILABLE", transactionRef: "GRN-2026-002", deviceType: "CAMERA", brandName: "Hikvision", modelName: "Outdoor Dome 5MP", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "sn-5", inventoryItemId: "item-7", serialNumber: "DELL-LAT-5440-SN1234", status: "AVAILABLE", transactionRef: "GRN-2026-003", deviceType: "LAPTOP", brandName: "Dell Technologies", modelName: "Latitude 5440", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      warranties: [
        { id: "war-1", serialTrackerId: "sn-1", startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString(), status: "ACTIVE", notes: "Standard 1 Year Brand Warranty", createdAt: new Date().toISOString() },
        { id: "war-2", serialTrackerId: "sn-2", startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString(), status: "ACTIVE", notes: "Standard 1 Year Brand Warranty", createdAt: new Date().toISOString() },
        { id: "war-3", serialTrackerId: "sn-3", startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 715 * 24 * 60 * 60 * 1000).toISOString(), status: "ACTIVE", notes: "Premium 2 Year Ubiquiti Warranty", createdAt: new Date().toISOString() },
        { id: "war-4", serialTrackerId: "sn-4", startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000).toISOString(), status: "ACTIVE", notes: "Standard Hikvision Kenya Warranty", createdAt: new Date().toISOString() },
        { id: "war-5", serialTrackerId: "sn-5", startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "EXPIRED", notes: "Warranty expired testing alert", createdAt: new Date().toISOString() } // Expired warranty for testing alerts
      ],
      transactions: [
        { id: "txn-1", warehouseId: "wh-1", productId: "prod-1", quantity: 35, type: "STOCK_IN", referenceId: "GRN-2026-001", refDocument: "DELIVERY-NOTE-110", reason: "Procurement of fresh routers from Safaricom wholesalers", performedBy: "admin-user", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-2", warehouseId: "wh-1", productId: "prod-2", quantity: 20, type: "STOCK_IN", referenceId: "GRN-2026-001", refDocument: "DELIVERY-NOTE-110", reason: "Procurement of high-capacity indoor APs", performedBy: "admin-user", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-3", warehouseId: "wh-1", productId: "prod-3", quantity: 15, type: "STOCK_IN", referenceId: "GRN-2026-002", refDocument: "DELIVERY-NOTE-112", reason: "Procurement of Hikvision dome cameras for site installations", performedBy: "admin-user", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-4", warehouseId: "wh-1", productId: "prod-4", quantity: 60, type: "STOCK_IN", referenceId: "GRN-2026-002", refDocument: "DELIVERY-NOTE-112", reason: "Optical transceivers for GPON OLT trunk fiber loops", performedBy: "admin-user", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-5", warehouseId: "wh-3", productId: "prod-5", quantity: 1, type: "STOCK_IN", referenceId: "GRN-2026-003", refDocument: "DELIVERY-NOTE-115", reason: "Dell client laptop for regional office manager", performedBy: "admin-user", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-6", warehouseId: "wh-2", productId: "prod-1", quantity: 12, type: "STOCK_TRANSFER", referenceId: "ST-2026-001", refDocument: "GATE-PASS-221", reason: "Transfer from HQ to Westlands Hub to feed installation vans", performedBy: "admin-user", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "txn-7", warehouseId: "wh-2", productId: "prod-2", quantity: 4, type: "STOCK_TRANSFER", referenceId: "ST-2026-002", refDocument: "GATE-PASS-222", reason: "Transfer for Westlands corporate building deployment", performedBy: "admin-user", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    };

    // Ensure directory exists
    const dir = path.dirname(INVENTORY_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INVENTORY_STORE_PATH, JSON.stringify(seedStore, null, 2), "utf-8");
    return seedStore;
  }

  private writeStore(store: InventoryStore) {
    try {
      const dir = path.dirname(INVENTORY_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(INVENTORY_STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
    } catch (e) {
      logger.error("INVENTORY_SERVICE", "Failed to write inventory_store.json", e);
    }
  }

  // -------------------------------------------------------------
  // CATEGORIES MANAGEMENT
  // -------------------------------------------------------------

  public async getCategories(): Promise<InventoryCategory[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const cats = await prisma.productCategory.findMany();
        return cats.map(c => ({ id: c.id, name: c.name, description: c.description }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getCategories failed, falling back", e);
      }
    }
    return this.readStore().categories;
  }

  public async createCategory(data: { name: string; description: string | null }): Promise<InventoryCategory> {
    const id = "cat-" + crypto.randomBytes(4).toString("hex");
    const newCat: InventoryCategory = { id, name: data.name, description: data.description };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const created = await prisma.productCategory.create({
          data: { name: data.name, description: data.description }
        });
        return { id: created.id, name: created.name, description: created.description };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma createCategory failed, falling back", e);
      }
    }

    const store = this.readStore();
    store.categories.push(newCat);
    this.writeStore(store);
    return newCat;
  }

  public async updateCategory(id: string, data: { name: string; description: string | null }): Promise<InventoryCategory> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const updated = await prisma.productCategory.update({
          where: { id },
          data: { name: data.name, description: data.description }
        });
        return { id: updated.id, name: updated.name, description: updated.description };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma updateCategory failed, falling back", e);
      }
    }

    const store = this.readStore();
    const idx = store.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      store.categories[idx] = { ...store.categories[idx], ...data };
      this.writeStore(store);
      return store.categories[idx];
    }
    throw new Error(`Category ${id} not found`);
  }

  public async deleteCategory(id: string): Promise<boolean> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.productCategory.delete({ where: { id } });
        return true;
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma deleteCategory failed, falling back", e);
      }
    }

    const store = this.readStore();
    const len = store.categories.length;
    store.categories = store.categories.filter(c => c.id !== id);
    this.writeStore(store);
    return store.categories.length < len;
  }

  // -------------------------------------------------------------
  // BRANDS MANAGEMENT
  // -------------------------------------------------------------

  public async getBrands(): Promise<InventoryBrand[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const brands = await prisma.brand.findMany();
        return brands.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          status: b.status as "ACTIVE" | "INACTIVE"
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getBrands failed, falling back", e);
      }
    }
    return this.readStore().brands;
  }

  public async createBrand(data: { name: string; description: string | null; status?: "ACTIVE" | "INACTIVE" }): Promise<InventoryBrand> {
    const id = "brand-" + crypto.randomBytes(4).toString("hex");
    const newBrand: InventoryBrand = {
      id,
      name: data.name,
      description: data.description,
      status: data.status || "ACTIVE"
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const created = await prisma.brand.create({
          data: { name: data.name, description: data.description, status: data.status || "ACTIVE" }
        });
        return {
          id: created.id,
          name: created.name,
          description: created.description,
          status: created.status as "ACTIVE" | "INACTIVE"
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma createBrand failed, falling back", e);
      }
    }

    const store = this.readStore();
    store.brands.push(newBrand);
    this.writeStore(store);
    return newBrand;
  }

  public async updateBrand(id: string, data: { name: string; description: string | null; status: "ACTIVE" | "INACTIVE" }): Promise<InventoryBrand> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const updated = await prisma.brand.update({
          where: { id },
          data: { name: data.name, description: data.description, status: data.status }
        });
        return {
          id: updated.id,
          name: updated.name,
          description: updated.description,
          status: updated.status as "ACTIVE" | "INACTIVE"
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma updateBrand failed, falling back", e);
      }
    }

    const store = this.readStore();
    const idx = store.brands.findIndex(b => b.id === id);
    if (idx !== -1) {
      store.brands[idx] = { ...store.brands[idx], ...data };
      this.writeStore(store);
      return store.brands[idx];
    }
    throw new Error(`Brand ${id} not found`);
  }

  public async deleteBrand(id: string): Promise<boolean> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.brand.delete({ where: { id } });
        return true;
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma deleteBrand failed, falling back", e);
      }
    }

    const store = this.readStore();
    const len = store.brands.length;
    store.brands = store.brands.filter(b => b.id !== id);
    this.writeStore(store);
    return store.brands.length < len;
  }

  // -------------------------------------------------------------
  // WAREHOUSES MANAGEMENT
  // -------------------------------------------------------------

  public async getWarehouses(): Promise<InventoryWarehouse[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const whs = await prisma.warehouse.findMany();
        return whs.map(w => ({
          id: w.id,
          name: w.name,
          location: w.location,
          stockAreas: w.stockAreas,
          managerId: w.managerId
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getWarehouses failed, falling back", e);
      }
    }
    return this.readStore().warehouses;
  }

  public async createWarehouse(data: { name: string; location: string | null; stockAreas: string | null; managerId: string | null }): Promise<InventoryWarehouse> {
    const id = "wh-" + crypto.randomBytes(4).toString("hex");
    const newWh: InventoryWarehouse = { id, ...data };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const created = await prisma.warehouse.create({
          data: {
            name: data.name,
            location: data.location,
            stockAreas: data.stockAreas,
            managerId: data.managerId || undefined
          }
        });
        return {
          id: created.id,
          name: created.name,
          location: created.location,
          stockAreas: created.stockAreas,
          managerId: created.managerId
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma createWarehouse failed, falling back", e);
      }
    }

    const store = this.readStore();
    store.warehouses.push(newWh);
    this.writeStore(store);
    return newWh;
  }

  public async updateWarehouse(id: string, data: { name: string; location: string | null; stockAreas: string | null; managerId: string | null }): Promise<InventoryWarehouse> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const updated = await prisma.warehouse.update({
          where: { id },
          data: {
            name: data.name,
            location: data.location,
            stockAreas: data.stockAreas,
            managerId: data.managerId || null
          }
        });
        return {
          id: updated.id,
          name: updated.name,
          location: updated.location,
          stockAreas: updated.stockAreas,
          managerId: updated.managerId
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma updateWarehouse failed, falling back", e);
      }
    }

    const store = this.readStore();
    const idx = store.warehouses.findIndex(w => w.id === id);
    if (idx !== -1) {
      store.warehouses[idx] = { ...store.warehouses[idx], ...data };
      this.writeStore(store);
      return store.warehouses[idx];
    }
    throw new Error(`Warehouse ${id} not found`);
  }

  public async deleteWarehouse(id: string): Promise<boolean> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.warehouse.delete({ where: { id } });
        return true;
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma deleteWarehouse failed, falling back", e);
      }
    }

    const store = this.readStore();
    const len = store.warehouses.length;
    store.warehouses = store.warehouses.filter(w => w.id !== id);
    this.writeStore(store);
    return store.warehouses.length < len;
  }

  // -------------------------------------------------------------
  // PRODUCTS MANAGEMENT
  // -------------------------------------------------------------

  public async getProducts(): Promise<InventoryProduct[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const prods = await prisma.product.findMany();
        return prods.map(p => ({
          id: p.id,
          sku: p.sku,
          productCode: p.productCode,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          brandId: p.brandId,
          supplierId: p.supplierId,
          unitOfMeasure: p.unitOfMeasure,
          costPrice: Number(p.costPrice),
          sellingPrice: Number(p.sellingPrice),
          vat: Number(p.vat),
          warrantyPeriod: p.warrantyPeriod,
          isSerialized: p.isSerialized,
          imagePath: p.imagePath,
          reorderLevel: p.reorderLevel,
          maxStockLevel: p.maxStockLevel,
          status: p.status as "ACTIVE" | "INACTIVE",
          createdAt: p.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getProducts failed, falling back", e);
      }
    }
    return this.readStore().products;
  }

  public async createProduct(data: Omit<InventoryProduct, "id" | "createdAt">): Promise<InventoryProduct> {
    const id = "prod-" + crypto.randomBytes(4).toString("hex");
    const newProd: InventoryProduct = {
      id,
      createdAt: new Date().toISOString(),
      ...data
    };

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const created = await prisma.product.create({
          data: {
            sku: data.sku,
            productCode: data.productCode,
            barcode: data.barcode,
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            brandId: data.brandId || undefined,
            supplierId: data.supplierId || undefined,
            unitOfMeasure: data.unitOfMeasure,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            vat: data.vat,
            warrantyPeriod: data.warrantyPeriod,
            isSerialized: data.isSerialized,
            imagePath: data.imagePath,
            reorderLevel: data.reorderLevel,
            maxStockLevel: data.maxStockLevel,
            status: data.status
          }
        });
        return {
          ...newProd,
          id: created.id,
          createdAt: created.createdAt.toISOString()
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma createProduct failed, falling back", e);
      }
    }

    const store = this.readStore();
    store.products.push(newProd);
    this.writeStore(store);
    return newProd;
  }

  public async updateProduct(id: string, data: Partial<Omit<InventoryProduct, "id" | "createdAt">>): Promise<InventoryProduct> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const updated = await prisma.product.update({
          where: { id },
          data: {
            sku: data.sku,
            productCode: data.productCode,
            barcode: data.barcode,
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            brandId: data.brandId || null,
            supplierId: data.supplierId || null,
            unitOfMeasure: data.unitOfMeasure,
            costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
            sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
            vat: data.vat !== undefined ? data.vat : undefined,
            warrantyPeriod: data.warrantyPeriod,
            isSerialized: data.isSerialized,
            imagePath: data.imagePath,
            reorderLevel: data.reorderLevel,
            maxStockLevel: data.maxStockLevel,
            status: data.status as any
          }
        });
        return {
          id: updated.id,
          sku: updated.sku,
          productCode: updated.productCode,
          barcode: updated.barcode,
          name: updated.name,
          description: updated.description,
          categoryId: updated.categoryId,
          brandId: updated.brandId,
          supplierId: updated.supplierId,
          unitOfMeasure: updated.unitOfMeasure,
          costPrice: Number(updated.costPrice),
          sellingPrice: Number(updated.sellingPrice),
          vat: Number(updated.vat),
          warrantyPeriod: updated.warrantyPeriod,
          isSerialized: updated.isSerialized,
          imagePath: updated.imagePath,
          reorderLevel: updated.reorderLevel,
          maxStockLevel: updated.maxStockLevel,
          status: updated.status as "ACTIVE" | "INACTIVE",
          createdAt: updated.createdAt.toISOString()
        };
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma updateProduct failed, falling back", e);
      }
    }

    const store = this.readStore();
    const idx = store.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      store.products[idx] = { ...store.products[idx], ...data } as InventoryProduct;
      this.writeStore(store);
      return store.products[idx];
    }
    throw new Error(`Product ${id} not found`);
  }

  public async deleteProduct(id: string): Promise<boolean> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        await prisma.product.delete({ where: { id } });
        return true;
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma deleteProduct failed, falling back", e);
      }
    }

    const store = this.readStore();
    const len = store.products.length;
    store.products = store.products.filter(p => p.id !== id);
    this.writeStore(store);
    return store.products.length < len;
  }

  // -------------------------------------------------------------
  // STOCK TRANSACTIONS / INVENTORY UTILITIES
  // -------------------------------------------------------------

  public async getInventoryLevels(): Promise<InventoryItemStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const items = await prisma.inventoryItem.findMany();
        return items.map(i => ({
          id: i.id,
          warehouseId: i.warehouseId,
          productId: i.productId,
          quantity: i.quantity
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getInventoryLevels failed, falling back", e);
      }
    }
    return this.readStore().inventoryItems;
  }

  public async getTransactions(): Promise<InventoryTransactionStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const txs = await prisma.inventoryTransaction.findMany({
          orderBy: { createdAt: "desc" }
        });
        return txs.map(t => ({
          id: t.id,
          warehouseId: t.warehouseId,
          productId: t.productId,
          quantity: t.quantity,
          type: t.type as any,
          referenceId: t.referenceId,
          refDocument: t.refDocument,
          reason: t.reason,
          performedBy: t.performedBy,
          createdAt: t.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getTransactions failed, falling back", e);
      }
    }
    return this.readStore().transactions;
  }

  public async getSerials(): Promise<SerialTrackerStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const sn = await prisma.serialTracker.findMany({
          include: { warranties: true }
        });
        return sn.map(s => ({
          id: s.id,
          inventoryItemId: s.inventoryItemId,
          serialNumber: s.serialNumber,
          status: s.status as any,
          transactionRef: s.transactionRef,
          deviceType: s.deviceType,
          brandName: s.brandName,
          modelName: s.modelName,
          createdAt: s.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getSerials failed, falling back", e);
      }
    }
    return this.readStore().serialTrackers;
  }

  public async getWarranties(): Promise<WarrantyStore[]> {
    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        const wars = await prisma.warranty.findMany();
        return wars.map(w => ({
          id: w.id,
          serialTrackerId: w.serialTrackerId,
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
          status: w.status as any,
          notes: w.notes,
          createdAt: w.createdAt.toISOString()
        }));
      } catch (e) {
        logger.error("INVENTORY_SERVICE", "Prisma getWarranties failed, falling back", e);
      }
    }
    return this.readStore().warranties;
  }

  /**
   * Main Stock Transaction executor
   */
  public async executeStockTransaction(data: {
    warehouseId: string;
    productId: string;
    quantity: number; // always positive in parameters, we resolve positive/negative based on type
    type: "STOCK_IN" | "STOCK_OUT" | "STOCK_TRANSFER" | "STOCK_ADJUSTMENT";
    toWarehouseId?: string; // required if STOCK_TRANSFER
    refDocument?: string;
    referenceId?: string;
    reason?: string;
    performedBy: string;
    serials?: string[]; // list of serial numbers to add or allocate
  }): Promise<InventoryTransactionStore> {
    const transactionId = "txn-" + crypto.randomBytes(4).toString("hex");
    const timestamp = new Date().toISOString();

    const finalQuantity = (data.type === "STOCK_OUT" || data.type === "STOCK_TRANSFER") ? -data.quantity : data.quantity;

    await this.checkDatabaseLoop();
    if (this.isDbConnected) {
      try {
        const prisma = getPrismaClient();
        // Database transactional setup
        const result = await prisma.$transaction(async (tx) => {
          // Find or create InventoryItem for source warehouse
          let invItem = await tx.inventoryItem.findUnique({
            where: { warehouseId_productId: { warehouseId: data.warehouseId, productId: data.productId } }
          });

          if (!invItem) {
            invItem = await tx.inventoryItem.create({
              data: { warehouseId: data.warehouseId, productId: data.productId, quantity: 0 }
            });
          }

          const newQty = invItem.quantity + finalQuantity;
          if (newQty < 0 && (data.type === "STOCK_OUT" || data.type === "STOCK_TRANSFER")) {
            throw new Error("Insufficient inventory for this operation.");
          }

          // Update source inventory
          const updatedSource = await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { quantity: newQty }
          });

          // If transfer, increase destination warehouse inventory
          if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
            let destItem = await tx.inventoryItem.findUnique({
              where: { warehouseId_productId: { warehouseId: data.toWarehouseId, productId: data.productId } }
            });

            if (!destItem) {
              destItem = await tx.inventoryItem.create({
                data: { warehouseId: data.toWarehouseId, productId: data.productId, quantity: 0 }
              });
            }

            await tx.inventoryItem.update({
              where: { id: destItem.id },
              data: { quantity: destItem.quantity + data.quantity }
            });
          }

          // Handle Serials & Warranties
          if (data.serials && data.serials.length > 0) {
            if (data.type === "STOCK_IN" || data.type === "STOCK_ADJUSTMENT" && finalQuantity > 0) {
              // Create serial trackers
              for (const sn of data.serials) {
                const createdSn = await tx.serialTracker.create({
                  data: {
                    inventoryItemId: updatedSource.id,
                    serialNumber: sn,
                    status: "AVAILABLE",
                    transactionRef: data.referenceId || transactionId,
                    deviceType: "NETWORK_DEVICE",
                    brandName: "Seeded",
                    modelName: "Seeded Model"
                  }
                });

                // Add standard warranty
                await tx.warranty.create({
                  data: {
                    serialTrackerId: createdSn.id,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 months
                    status: "ACTIVE",
                    notes: "Automated warranty generated on stock entry"
                  }
                });
              }
            } else if (data.type === "STOCK_OUT" || data.type === "STOCK_TRANSFER") {
              // Move or allocate serials
              for (const sn of data.serials) {
                const snRecord = await tx.serialTracker.findUnique({ where: { serialNumber: sn } });
                if (snRecord) {
                  if (data.type === "STOCK_OUT") {
                    await tx.serialTracker.update({
                      where: { id: snRecord.id },
                      data: { status: "SOLD", transactionRef: data.referenceId || transactionId }
                    });
                  } else if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
                    // Find destination inventory item
                    const destItem = await tx.inventoryItem.findUnique({
                      where: { warehouseId_productId: { warehouseId: data.toWarehouseId, productId: data.productId } }
                    });
                    if (destItem) {
                      await tx.serialTracker.update({
                        where: { id: snRecord.id },
                        data: { inventoryItemId: destItem.id, transactionRef: data.referenceId || transactionId }
                      });
                    }
                  }
                }
              }
            }
          }

          // Record main transaction
          const createdTx = await tx.inventoryTransaction.create({
            data: {
              warehouseId: data.warehouseId,
              productId: data.productId,
              quantity: finalQuantity,
              type: data.type,
              referenceId: data.referenceId || transactionId,
              refDocument: data.refDocument,
              reason: data.reason,
              performedBy: data.performedBy
            }
          });

          // If transfer, record matching TRANSFER_IN transaction for recipient
          if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
            await tx.inventoryTransaction.create({
              data: {
                warehouseId: data.toWarehouseId,
                productId: data.productId,
                quantity: data.quantity,
                type: "STOCK_IN",
                referenceId: data.referenceId || transactionId,
                refDocument: data.refDocument,
                reason: `Transfer received from warehouse: ${data.warehouseId}. ${data.reason || ""}`,
                performedBy: data.performedBy
              }
            });
          }

          return createdTx;
        });

        return {
          id: result.id,
          warehouseId: result.warehouseId,
          productId: result.productId,
          quantity: result.quantity,
          type: result.type as any,
          referenceId: result.referenceId,
          refDocument: result.refDocument,
          reason: result.reason,
          performedBy: result.performedBy,
          createdAt: result.createdAt.toISOString()
        };
      } catch (err) {
        logger.error("INVENTORY_SERVICE", "Prisma executeStockTransaction transaction failed, falling back to local storage", err);
      }
    }

    // Local JSON Store execution
    const store = this.readStore();

    // 1. Resolve source inventory item
    let sourceItem = store.inventoryItems.find(
      i => i.warehouseId === data.warehouseId && i.productId === data.productId
    );

    if (!sourceItem) {
      sourceItem = {
        id: "item-" + crypto.randomBytes(4).toString("hex"),
        warehouseId: data.warehouseId,
        productId: data.productId,
        quantity: 0
      };
      store.inventoryItems.push(sourceItem);
    }

    if (sourceItem.quantity + finalQuantity < 0 && (data.type === "STOCK_OUT" || data.type === "STOCK_TRANSFER")) {
      throw new Error("Insufficient inventory for this operation.");
    }

    sourceItem.quantity += finalQuantity;

    // 2. If Transfer, resolve destination inventory item
    if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
      let destItem = store.inventoryItems.find(
        i => i.warehouseId === data.toWarehouseId && i.productId === data.productId
      );
      if (!destItem) {
        destItem = {
          id: "item-" + crypto.randomBytes(4).toString("hex"),
          warehouseId: data.toWarehouseId!,
          productId: data.productId,
          quantity: 0
        };
        store.inventoryItems.push(destItem);
      }
      destItem.quantity += data.quantity;
    }

    // 3. Handle Serials
    if (data.serials && data.serials.length > 0) {
      const productObj = store.products.find(p => p.id === data.productId);
      const devType = productObj ? this.guessDeviceType(productObj.name) : "NETWORK_DEVICE";
      const bName = productObj ? (store.brands.find(b => b.id === productObj.brandId)?.name || "Seeded") : "Seeded";

      if (data.type === "STOCK_IN" || (data.type === "STOCK_ADJUSTMENT" && finalQuantity > 0)) {
        for (const sn of data.serials) {
          const sId = "sn-" + crypto.randomBytes(4).toString("hex");
          const tracker: SerialTrackerStore = {
            id: sId,
            inventoryItemId: sourceItem.id,
            serialNumber: sn,
            status: "AVAILABLE",
            transactionRef: data.referenceId || transactionId,
            deviceType: devType,
            brandName: bName,
            modelName: productObj ? productObj.sku : "Model Name",
            createdAt: timestamp
          };
          store.serialTrackers.push(tracker);

          // Add warranty
          const warId = "war-" + crypto.randomBytes(4).toString("hex");
          store.warranties.push({
            id: warId,
            serialTrackerId: sId,
            startDate: timestamp,
            endDate: new Date(Date.now() + (productObj?.warrantyPeriod || 12) * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "ACTIVE",
            notes: "Automated local warranty created",
            createdAt: timestamp
          });
        }
      } else if (data.type === "STOCK_OUT" || data.type === "STOCK_TRANSFER") {
        for (const sn of data.serials) {
          const snIdx = store.serialTrackers.findIndex(s => s.serialNumber === sn);
          if (snIdx !== -1) {
            if (data.type === "STOCK_OUT") {
              store.serialTrackers[snIdx].status = "SOLD";
              store.serialTrackers[snIdx].transactionRef = data.referenceId || transactionId;
            } else if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
              const destItem = store.inventoryItems.find(
                i => i.warehouseId === data.toWarehouseId && i.productId === data.productId
              );
              if (destItem) {
                store.serialTrackers[snIdx].inventoryItemId = destItem.id;
                store.serialTrackers[snIdx].transactionRef = data.referenceId || transactionId;
              }
            }
          }
        }
      }
    }

    // 4. Create primary transaction record
    const newTx: InventoryTransactionStore = {
      id: transactionId,
      warehouseId: data.warehouseId,
      productId: data.productId,
      quantity: finalQuantity,
      type: data.type,
      referenceId: data.referenceId || transactionId,
      refDocument: data.refDocument || null,
      reason: data.reason || null,
      performedBy: data.performedBy,
      createdAt: timestamp
    };
    store.transactions.push(newTx);

    // 5. If transfer, record matching receive transaction
    if (data.type === "STOCK_TRANSFER" && data.toWarehouseId) {
      const rxTx: InventoryTransactionStore = {
        id: "txn-" + crypto.randomBytes(4).toString("hex"),
        warehouseId: data.toWarehouseId,
        productId: data.productId,
        quantity: data.quantity,
        type: "STOCK_IN",
        referenceId: data.referenceId || transactionId,
        refDocument: data.refDocument || null,
        reason: `Transfer received from warehouse: ${data.warehouseId}. ${data.reason || ""}`,
        performedBy: data.performedBy,
        createdAt: timestamp
      };
      store.transactions.push(rxTx);
    }

    this.writeStore(store);
    return newTx;
  }

  private guessDeviceType(name: string): string {
    const lowercase = name.toLowerCase();
    if (lowercase.includes("router")) return "ROUTER";
    if (lowercase.includes("switch")) return "SWITCH";
    if (lowercase.includes("ap") || lowercase.includes("access point")) return "ACCESS_POINT";
    if (lowercase.includes("camera") || lowercase.includes("cctv")) return "CAMERA";
    if (lowercase.includes("laptop")) return "LAPTOP";
    if (lowercase.includes("fiber") || lowercase.includes("fibre") || lowercase.includes("sfp")) return "FIBRE_TERMINAL";
    return "ICT_EQUIPMENT";
  }

  // -------------------------------------------------------------
  // STOCK ALERTS GENERATION
  // -------------------------------------------------------------

  public async getStockAlerts(): Promise<{
    id: string;
    type: "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRED_WARRANTY";
    title: string;
    description: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    createdAt: string;
  }[]> {
    const products = await this.getProducts();
    const invLevels = await this.getInventoryLevels();
    const warehouses = await this.getWarehouses();
    const serials = await this.getSerials();
    const warranties = await this.getWarranties();

    const alerts: any[] = [];

    // Group current quantity by product
    const qtyByProduct: Record<string, number> = {};
    for (const item of invLevels) {
      qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity;
    }

    // 1. Check Low Stock & Out of Stock
    for (const p of products) {
      const currentQty = qtyByProduct[p.id] || 0;
      if (currentQty === 0) {
        alerts.push({
          id: `alert-out-${p.id}`,
          type: "OUT_OF_STOCK",
          title: "Out of Stock Warning",
          description: `Product "${p.name}" (SKU: ${p.sku}) is completely out of stock company-wide.`,
          severity: "CRITICAL",
          createdAt: new Date().toISOString()
        });
      } else if (currentQty <= p.reorderLevel) {
        alerts.push({
          id: `alert-low-${p.id}`,
          type: "LOW_STOCK",
          title: "Low Stock Alert",
          description: `Product "${p.name}" (SKU: ${p.sku}) has reached ${currentQty} units, which is at or below the reorder level of ${p.reorderLevel}.`,
          severity: "WARNING",
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Check Expired Warranties
    for (const w of warranties) {
      const endDate = new Date(w.endDate);
      const now = new Date();
      if (endDate < now && w.status === "ACTIVE") {
        const serialObj = serials.find(s => s.id === w.serialTrackerId);
        if (serialObj) {
          alerts.push({
            id: `alert-warranty-${w.id}`,
            type: "EXPIRED_WARRANTY",
            title: "Warranty Expired",
            description: `Serial "${serialObj.serialNumber}" (${serialObj.brandName} ${serialObj.modelName}) warranty has expired as of ${endDate.toLocaleDateString()}.`,
            severity: "INFO",
            createdAt: w.createdAt
          });
        }
      }
    }

    return alerts;
  }

  // -------------------------------------------------------------
  // INVENTORY REPORTS ENGINE
  // -------------------------------------------------------------

  public async getStockValuationReport(): Promise<{
    productId: string;
    sku: string;
    name: string;
    totalQuantity: number;
    costPrice: number;
    sellingPrice: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialMargin: number;
  }[]> {
    const products = await this.getProducts();
    const invLevels = await this.getInventoryLevels();

    const qtyByProduct: Record<string, number> = {};
    for (const item of invLevels) {
      qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity;
    }

    return products.map(p => {
      const qty = qtyByProduct[p.id] || 0;
      const costVal = qty * p.costPrice;
      const retailVal = qty * p.sellingPrice;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        totalQuantity: qty,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        totalCostValue: costVal,
        totalRetailValue: retailVal,
        potentialMargin: retailVal - costVal
      };
    });
  }

  public async getStockMovementReport(): Promise<{
    date: string;
    transactionId: string;
    productName: string;
    sku: string;
    warehouseName: string;
    type: string;
    quantity: number;
    reference: string;
    performedBy: string;
  }[]> {
    const txs = await this.getTransactions();
    const products = await this.getProducts();
    const warehouses = await this.getWarehouses();

    return txs.map(t => {
      const p = products.find(prod => prod.id === t.productId);
      const w = warehouses.find(wh => wh.id === t.warehouseId);
      return {
        date: t.createdAt,
        transactionId: t.id,
        productName: p ? p.name : "Unknown Product",
        sku: p ? p.sku : "N/A",
        warehouseName: w ? w.name : "Unknown Warehouse",
        type: t.type,
        quantity: t.quantity,
        reference: t.refDocument || t.referenceId || "N/A",
        performedBy: t.performedBy
      };
    });
  }

  public async getLowStockReport(): Promise<{
    sku: string;
    name: string;
    categoryName: string;
    reorderLevel: number;
    currentQuantity: number;
    status: "CRITICAL" | "WARNING";
  }[]> {
    const products = await this.getProducts();
    const invLevels = await this.getInventoryLevels();
    const categories = await this.getCategories();

    const qtyByProduct: Record<string, number> = {};
    for (const item of invLevels) {
      qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity;
    }

    return products
      .map(p => {
        const qty = qtyByProduct[p.id] || 0;
        const cat = categories.find(c => c.id === p.categoryId);
        return {
          sku: p.sku,
          name: p.name,
          categoryName: cat ? cat.name : "General",
          reorderLevel: p.reorderLevel,
          currentQuantity: qty,
          status: (qty === 0 ? "CRITICAL" : "WARNING") as "CRITICAL" | "WARNING"
        };
      })
      .filter(item => item.currentQuantity <= item.reorderLevel);
  }
}

export default InventoryService;
