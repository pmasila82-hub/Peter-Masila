import { Router, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { InventoryService } from "../services/inventory.service";

const inventoryRouter = Router();
const inventoryService = new InventoryService();

// Helper to extract user ID for transaction logs
const getActorId = (req: AuthenticatedRequest): string => {
  return req.user?.id || "admin-user";
};

// -------------------------------------------------------------
// ALERTS
// -------------------------------------------------------------
inventoryRouter.get("/alerts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await inventoryService.getStockAlerts();
    res.json({ success: true, alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch stock alerts." });
  }
});

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------
inventoryRouter.get("/categories", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await inventoryService.getCategories();
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch categories." });
  }
});

inventoryRouter.post("/categories", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newCat = await inventoryService.createCategory(req.body);
    res.status(201).json({ success: true, message: "Product category created successfully.", category: newCat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create category." });
  }
});

inventoryRouter.put("/categories/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await inventoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, message: "Product category updated.", category: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update category." });
  }
});

inventoryRouter.delete("/categories/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await inventoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deletion complete.", deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete category." });
  }
});

// -------------------------------------------------------------
// BRANDS
// -------------------------------------------------------------
inventoryRouter.get("/brands", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brands = await inventoryService.getBrands();
    res.json({ success: true, brands });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch brands." });
  }
});

inventoryRouter.post("/brands", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newBrand = await inventoryService.createBrand(req.body);
    res.status(201).json({ success: true, message: "Brand created successfully.", brand: newBrand });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create brand." });
  }
});

inventoryRouter.put("/brands/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await inventoryService.updateBrand(req.params.id, req.body);
    res.json({ success: true, message: "Brand updated successfully.", brand: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update brand." });
  }
});

inventoryRouter.delete("/brands/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await inventoryService.deleteBrand(req.params.id);
    res.json({ success: true, message: "Brand deletion complete.", deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete brand." });
  }
});

// -------------------------------------------------------------
// WAREHOUSES
// -------------------------------------------------------------
inventoryRouter.get("/warehouses", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const warehouses = await inventoryService.getWarehouses();
    res.json({ success: true, warehouses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch warehouses." });
  }
});

inventoryRouter.post("/warehouses", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newWh = await inventoryService.createWarehouse(req.body);
    res.status(201).json({ success: true, message: "Warehouse created successfully.", warehouse: newWh });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create warehouse." });
  }
});

inventoryRouter.put("/warehouses/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await inventoryService.updateWarehouse(req.params.id, req.body);
    res.json({ success: true, message: "Warehouse updated successfully.", warehouse: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update warehouse." });
  }
});

inventoryRouter.delete("/warehouses/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await inventoryService.deleteWarehouse(req.params.id);
    res.json({ success: true, message: "Warehouse deletion complete.", deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete warehouse." });
  }
});

// -------------------------------------------------------------
// PRODUCTS
// -------------------------------------------------------------
inventoryRouter.get("/products", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await inventoryService.getProducts();
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch products." });
  }
});

inventoryRouter.post("/products", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newProd = await inventoryService.createProduct(req.body);
    res.status(201).json({ success: true, message: "Product created successfully.", product: newProd });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create product." });
  }
});

inventoryRouter.put("/products/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await inventoryService.updateProduct(req.params.id, req.body);
    res.json({ success: true, message: "Product updated successfully.", product: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update product." });
  }
});

inventoryRouter.delete("/products/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await inventoryService.deleteProduct(req.params.id);
    res.json({ success: true, message: "Product deletion complete.", deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete product." });
  }
});

// -------------------------------------------------------------
// STOCK INVENTORY LEVELS & SERIALS
// -------------------------------------------------------------
inventoryRouter.get("/levels", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const levels = await inventoryService.getInventoryLevels();
    res.json({ success: true, levels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch inventory levels." });
  }
});

inventoryRouter.get("/serials", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const serials = await inventoryService.getSerials();
    res.json({ success: true, serials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch serials." });
  }
});

inventoryRouter.get("/warranties", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const warranties = await inventoryService.getWarranties();
    res.json({ success: true, warranties });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch warranties." });
  }
});

// -------------------------------------------------------------
// STOCK TRANSACTIONS (STOCK MOVEMENT)
// -------------------------------------------------------------
inventoryRouter.get("/transactions", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await inventoryService.getTransactions();
    res.json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch transactions." });
  }
});

inventoryRouter.post("/transactions", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorId = getActorId(req);
    const txn = await inventoryService.executeStockTransaction({
      ...req.body,
      performedBy: actorId
    });
    res.status(201).json({ success: true, message: "Inventory stock transaction completed successfully.", transaction: txn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to execute stock transaction." });
  }
});

// -------------------------------------------------------------
// REPORTS ENGINE
// -------------------------------------------------------------
inventoryRouter.get("/reports/valuation", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const valuation = await inventoryService.getStockValuationReport();
    res.json({ success: true, valuation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate valuation report." });
  }
});

inventoryRouter.get("/reports/movement", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const movement = await inventoryService.getStockMovementReport();
    res.json({ success: true, movement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate movement report." });
  }
});

inventoryRouter.get("/reports/low-stock", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lowStock = await inventoryService.getLowStockReport();
    res.json({ success: true, lowStock });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate low stock report." });
  }
});

export default inventoryRouter;
