import { Router, Response } from "express";
import { verifyToken, AuthenticatedRequest } from "../middlewares/auth";
import { crmService } from "../services/crm.service";

const crmRouter = Router();

// -------------------------------------------------------------
// EXECUTIVE CRM REPORT & METRICS SUMMARY
// -------------------------------------------------------------
crmRouter.get("/summary", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await crmService.generateCRMReportSummary();
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate CRM report summary." });
  }
});

// -------------------------------------------------------------
// CUSTOMER PROFILES ENDPOINTS
// -------------------------------------------------------------
crmRouter.get("/customers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await crmService.listCustomers();
    res.json({ success: true, customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch customers directory." });
  }
});

crmRouter.get("/customers/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await crmService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found." });
    }
    res.json({ success: true, customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch customer profile details." });
  }
});

crmRouter.post("/customers", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorEmail = req.user?.email || "Staff Member";
    const newCust = await crmService.createCustomer(req.body, actorEmail);
    res.status(201).json({ success: true, message: "Customer profile created successfully in CRM registry.", customer: newCust });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to provision new customer profile." });
  }
});

crmRouter.put("/customers/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorEmail = req.user?.email || "Staff Member";
    const updated = await crmService.updateCustomer(req.params.id, req.body, actorEmail);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer profile not found to update." });
    }
    res.json({ success: true, message: "Customer profile updated successfully.", customer: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update customer profile." });
  }
});

// -------------------------------------------------------------
// SECONDARY DIRECTORIES: CONTACTS, NOTES, DOCUMENTS, HISTORY
// -------------------------------------------------------------

// Customer Contacts list
crmRouter.get("/customers/:id/contacts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await crmService.listContacts(req.params.id);
    res.json({ success: true, contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch customer contacts." });
  }
});

// Create Customer Contact
crmRouter.post("/contacts", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contact = await crmService.createContact(req.body);
    res.status(201).json({ success: true, message: "Additional customer contact point registered.", contact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create contact." });
  }
});

// Delete Contact
crmRouter.delete("/contacts/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await crmService.deleteContact(req.params.id);
    if (deleted) {
      res.json({ success: true, message: "Customer contact point removed." });
    } else {
      res.status(404).json({ success: false, message: "Contact record not found." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete contact record." });
  }
});

// Customer Notes list
crmRouter.get("/customers/:id/notes", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notes = await crmService.listNotes(req.params.id);
    res.json({ success: true, notes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to retrieve customer notes." });
  }
});

// Add Customer Note
crmRouter.post("/notes", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorName = req.user?.email || "Staff Member";
    const { customerId, note } = req.body;
    if (!customerId || !note) {
      return res.status(400).json({ success: false, message: "Customer identity and note body are required." });
    }
    const newNote = await crmService.createNote(customerId, note, actorName);
    res.status(201).json({ success: true, message: "Custom note appended to client profile file.", note: newNote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to save note." });
  }
});

// Customer Documents list
crmRouter.get("/customers/:id/documents", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documents = await crmService.listDocuments(req.params.id);
    res.json({ success: true, documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to retrieve customer files catalog." });
  }
});

// Upload Customer Document Metadata
crmRouter.post("/documents", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await crmService.uploadDocument(req.body);
    res.status(201).json({ success: true, message: "Document profile filed in client documents binder.", document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to catalog document." });
  }
});

// Delete Document Metadata
crmRouter.delete("/documents/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await crmService.deleteDocument(req.params.id);
    if (deleted) {
      res.json({ success: true, message: "Document file profile purged from client binder." });
    } else {
      res.status(404).json({ success: false, message: "Document entry not found in CRM files directory." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete document entry." });
  }
});

// Customer History Timeline list
crmRouter.get("/customers/:id/history", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await crmService.listHistory(req.params.id);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to compile customer timeline history." });
  }
});

// -------------------------------------------------------------
// LEADS PIPELINE ENDPOINTS
// -------------------------------------------------------------
crmRouter.get("/leads", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leads = await crmService.listLeads();
    res.json({ success: true, leads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch pipeline leads." });
  }
});

crmRouter.post("/leads", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lead = await crmService.createLead(req.body);
    res.status(201).json({ success: true, message: "Prospect lead successfully logged in pipeline.", lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create prospect lead." });
  }
});

crmRouter.put("/leads/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await crmService.updateLead(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Pipeline lead not found to update." });
    }
    res.json({ success: true, message: "Lead updated in sales pipeline.", lead: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update lead." });
  }
});

// Convert Lead to Customer account
crmRouter.post("/leads/:id/convert", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorEmail = req.user?.email || "Staff Member";
    const customer = await crmService.convertLeadToCustomer(req.params.id, req.body, actorEmail);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Lead not found to convert." });
    }
    res.json({ success: true, message: "Pipeline lead successfully converted to active corporate account!", customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to convert pipeline lead." });
  }
});

// -------------------------------------------------------------
// FOLLOW UP SCHEDULER ENDPOINTS
// -------------------------------------------------------------
crmRouter.get("/followups", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followUps = await crmService.listFollowUps();
    res.json({ success: true, followUps });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch follow-ups calendar." });
  }
});

crmRouter.post("/followups", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const fup = await crmService.createFollowUp(req.body);
    res.status(201).json({ success: true, message: "Follow-up schedule recorded.", followUp: fup });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to schedule follow-up." });
  }
});

crmRouter.put("/followups/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await crmService.updateFollowUp(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Follow-up record not found to update." });
    }
    res.json({ success: true, message: "Follow-up event schedule updated.", followUp: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update follow-up event." });
  }
});

export default crmRouter;
