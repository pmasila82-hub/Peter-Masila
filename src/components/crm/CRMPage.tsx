import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  Coins, 
  Percent, 
  MapPin, 
  Mail, 
  Phone, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Check, 
  X, 
  Edit, 
  Clock, 
  FileDown, 
  Briefcase, 
  ArrowRight, 
  UserPlus, 
  Calendar, 
  UploadCloud, 
  Trash2, 
  MoreVertical, 
  RefreshCw,
  Building2,
  Info,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck2,
  ChevronRight,
  ClipboardList,
  Filter,
  Download
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Checkbox } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { EmptyState } from "../ui/EmptyState";
import { Charts } from "../ui/Charts";

// -------------------------------------------------------------
// TS INTERFACES MATCHING BACKEND DATA CONTRACTS
// -------------------------------------------------------------

interface CRMCustomer {
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

interface CRMContact {
  id: string;
  customerId: string;
  fullName: string;
  email: string | null;
  phone: string;
  designation: string | null;
}

interface CRMLead {
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

interface CRMFollowUp {
  id: string;
  leadId: string | null;
  customerId: string | null;
  scheduledDate: string;
  status: "PENDING" | "COMPLETED" | "RESCHEDULED" | "CANCELLED";
  type: "CALL" | "EMAIL" | "MEETING" | "SITE_SURVEY";
  notes: string;
  createdAt: string;
}

interface CRMDocument {
  id: string;
  customerId: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface CRMNote {
  id: string;
  customerId: string;
  note: string;
  authorName: string;
  createdAt: string;
}

interface CRMHistory {
  id: string;
  customerId: string;
  eventType: string;
  eventDetails: string;
  performedBy: string;
  createdAt: string;
}

interface SummaryData {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    totalOutstanding: number;
    totalLeads: number;
    conversionRate: number;
    pendingFollowUps: number;
  };
  charts: {
    leadsStatusDistribution: { name: string; value: number }[];
    leadsSourceDistribution: { name: string; value: number }[];
    outstandingLedger: { name: string; balance: number; credit: number }[];
  };
  recentEvents: any[];
}

export function CRMPage() {
  const { accessToken, user } = useAuth();
  const { showNotification } = useNotifications();

  // Active View Tab Controllers
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "leads" | "followups">("overview");
  
  // Selected Customer Detail Focus
  const [focusedCustomer, setFocusedCustomer] = useState<CRMCustomer | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState<"contacts" | "documents" | "notes" | "history">("notes");

  // Loading flags
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Data rosters
  const [summary, setSummary] = useState<SummaryData>({
    stats: { totalCustomers: 0, activeCustomers: 0, totalOutstanding: 0, totalLeads: 0, conversionRate: 0, pendingFollowUps: 0 },
    charts: { leadsStatusDistribution: [], leadsSourceDistribution: [], outstandingLedger: [] },
    recentEvents: []
  });
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [followUps, setFollowUps] = useState<CRMFollowUp[]>([]);

  // Selected Customer directories
  const [focusedContacts, setFocusedContacts] = useState<CRMContact[]>([]);
  const [focusedDocuments, setFocusedDocuments] = useState<CRMDocument[]>([]);
  const [focusedNotes, setFocusedNotes] = useState<CRMNote[]>([]);
  const [focusedHistory, setFocusedHistory] = useState<CRMHistory[]>([]);

  // Customer List Filters & Pagination
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("ALL");
  const [customerBalanceFilter, setCustomerBalanceFilter] = useState("ALL");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerRowsPerPage, setCustomerRowsPerPage] = useState(10);

  // Leads List Filters & Pagination
  const [leadQuery, setLeadQuery] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [leadSourceFilter, setLeadSourceFilter] = useState("ALL");
  const [leadPage, setLeadPage] = useState(1);
  const [leadRowsPerPage, setLeadRowsPerPage] = useState(10);

  // Follow Ups list states
  const [fupQuery, setFupQuery] = useState("");
  const [fupStatusFilter, setFupStatusFilter] = useState("ALL");

  // Drag and drop attachment simulation state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // MODAL FORM STATE BUNDLES
  // -------------------------------------------------------------
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CRMCustomer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    accountCode: "",
    companyName: "",
    kraPin: "",
    contactPerson: "",
    email: "",
    phone: "",
    physicalAddress: "",
    creditLimit: 250000,
    outstandingBalance: 0,
    isActive: true
  });

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    status: "NEW" as any,
    source: "WEBSITE" as any,
    notes: ""
  });

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<CRMLead | null>(null);
  const [convertForm, setConvertForm] = useState({
    accountCode: "",
    contactPerson: "",
    physicalAddress: "",
    creditLimit: 300000
  });

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    designation: ""
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    note: ""
  });

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    leadId: "" as string,
    customerId: "" as string,
    scheduledDate: "",
    status: "PENDING" as any,
    type: "CALL" as any,
    notes: ""
  });

  // -------------------------------------------------------------
  // FULL STACK API CONNECTIONS
  // -------------------------------------------------------------

  const fetchCRMReportSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/v1/crm/summary", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (e) {
      showNotification("Report Sync Error", "Failed to retrieve live CRM executive overview diagnostics.", "error");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await fetch("/api/v1/crm/customers", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (e) {
      showNotification("Sync Failed", "Could not connect to customers endpoint.", "error");
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/v1/crm/leads", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (e) {
      showNotification("Sync Failed", "Could not connect to leads pipeline.", "error");
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    setFollowupsLoading(true);
    try {
      const res = await fetch("/api/v1/crm/followups", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setFollowUps(data.followUps);
      }
    } catch (e) {
      showNotification("Sync Failed", "Could not connect to follow-ups planner calendar.", "error");
    } finally {
      setFollowupsLoading(false);
    }
  };

  // Fetch Focused Customer Extra Folders
  const fetchCustomerDetails = async (customerId: string) => {
    setDetailsLoading(true);
    try {
      const [contactsRes, notesRes, docsRes, histRes] = await Promise.all([
        fetch(`/api/v1/crm/customers/${customerId}/contacts`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`/api/v1/crm/customers/${customerId}/notes`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`/api/v1/crm/customers/${customerId}/documents`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`/api/v1/crm/customers/${customerId}/history`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);

      const [contacts, notes, docs, hist] = await Promise.all([
        contactsRes.json(),
        notesRes.json(),
        docsRes.json(),
        histRes.json()
      ]);

      if (contacts.success) setFocusedContacts(contacts.contacts);
      if (notes.success) setFocusedNotes(notes.notes);
      if (docs.success) setFocusedDocuments(docs.documents);
      if (hist.success) setFocusedHistory(hist.history);

    } catch (e) {
      showNotification("Roster Fetch Error", "Failed to compile customer folder timeline records.", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Trigger loading based on active context
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === "overview") {
      fetchCRMReportSummary();
    } else if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "leads") {
      fetchLeads();
    } else if (activeTab === "followups") {
      fetchFollowUps();
      // Pre-populate dropdown selections
      fetchCustomers();
      fetchLeads();
    }
  }, [activeTab, accessToken]);

  // Handle Detail Card selection
  const handleSelectCustomer = (cust: CRMCustomer) => {
    setFocusedCustomer(cust);
    fetchCustomerDetails(cust.id);
  };

  // -------------------------------------------------------------
  // CUSTOMER MUTATIONS
  // -------------------------------------------------------------

  const handleOpenCustomerModal = (cust: CRMCustomer | null = null) => {
    setEditingCustomer(cust);
    if (cust) {
      setCustomerForm({
        accountCode: cust.accountCode,
        companyName: cust.companyName || "",
        kraPin: cust.kraPin || "",
        contactPerson: cust.contactPerson,
        email: cust.email,
        phone: cust.phone,
        physicalAddress: cust.physicalAddress,
        creditLimit: cust.creditLimit,
        outstandingBalance: cust.outstandingBalance,
        isActive: cust.isActive
      });
    } else {
      setCustomerForm({
        accountCode: `CCN-${Math.floor(100 + Math.random() * 900)}`,
        companyName: "",
        kraPin: "",
        contactPerson: "",
        email: "",
        phone: "",
        physicalAddress: "",
        creditLimit: 300000,
        outstandingBalance: 0,
        isActive: true
      });
    }
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.contactPerson || !customerForm.email || !customerForm.phone) {
      showNotification("Validation Incomplete", "Please specify the key primary contact person details.", "error");
      return;
    }

    try {
      const url = editingCustomer ? `/api/v1/crm/customers/${editingCustomer.id}` : "/api/v1/crm/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          editingCustomer ? "Profile Configured" : "Customer Filed",
          data.message,
          "success"
        );
        setIsCustomerModalOpen(false);
        fetchCustomers();
        if (editingCustomer && focusedCustomer?.id === editingCustomer.id) {
          // Refresh open view
          setFocusedCustomer({ ...focusedCustomer, ...customerForm });
          fetchCustomerDetails(editingCustomer.id);
        }
      } else {
        showNotification("Writing failed", data.message, "error");
      }
    } catch (e) {
      showNotification("Gateway Timeout", "Database backend is unreachable.", "error");
    }
  };

  // -------------------------------------------------------------
  // LEAD PIPELINE MUTATIONS
  // -------------------------------------------------------------

  const handleOpenLeadModal = (lead: CRMLead | null = null) => {
    setEditingLead(lead);
    if (lead) {
      setLeadForm({
        fullName: lead.fullName,
        companyName: lead.companyName || "",
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
        notes: lead.notes || ""
      });
    } else {
      setLeadForm({
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        status: "NEW",
        source: "WEBSITE",
        notes: ""
      });
    }
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName || !leadForm.phone || !leadForm.email) {
      showNotification("Form Invalid", "Prospect name, email, and telephone are required.", "error");
      return;
    }

    try {
      const url = editingLead ? `/api/v1/crm/leads/${editingLead.id}` : "/api/v1/crm/leads";
      const method = editingLead ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(leadForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          editingLead ? "Pipeline Prospect updated" : "Prospect Filed",
          data.message,
          "success"
        );
        setIsLeadModalOpen(false);
        fetchLeads();
      }
    } catch (e) {
      showNotification("Gateway Timeout", "Failed to connect to pipeline servers.", "error");
    }
  };

  // Conversion Workflow
  const handleOpenConvertModal = (lead: CRMLead) => {
    setConvertingLead(lead);
    setConvertForm({
      accountCode: `CCN-NB-${Math.floor(100 + Math.random() * 900)}`,
      contactPerson: lead.fullName,
      physicalAddress: "",
      creditLimit: 250000
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    try {
      const res = await fetch(`/api/v1/crm/leads/${convertingLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(convertForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Lead Converted", data.message, "success");
        setIsConvertModalOpen(false);
        fetchLeads();
        setActiveTab("customers");
        if (data.customer) {
          handleSelectCustomer(data.customer);
        }
      }
    } catch (e) {
      showNotification("Conversion Error", "Gateway error while updating CRM directory.", "error");
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC OPERATIONS: NOTES, CONTACTS, ATTACHMENTS
  // -------------------------------------------------------------

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedCustomer || !noteForm.note.trim()) return;

    try {
      const res = await fetch("/api/v1/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customerId: focusedCustomer.id,
          note: noteForm.note
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Note Logged", data.message, "success");
        setNoteForm({ note: "" });
        setIsNoteModalOpen(false);
        fetchCustomerDetails(focusedCustomer.id);
      }
    } catch (e) {
      showNotification("Post Failed", "Could not file note.", "error");
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedCustomer) return;

    try {
      const res = await fetch("/api/v1/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customerId: focusedCustomer.id,
          ...contactForm
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Contact point added", data.message, "success");
        setContactForm({ fullName: "", email: "", phone: "", designation: "" });
        setIsContactModalOpen(false);
        fetchCustomerDetails(focusedCustomer.id);
      }
    } catch (e) {
      showNotification("Post Failed", "Could not append contact profile.", "error");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm("Remove this secondary contact details?")) return;
    try {
      const res = await fetch(`/api/v1/crm/contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Contact Point Purged", data.message, "success");
        if (focusedCustomer) fetchCustomerDetails(focusedCustomer.id);
      }
    } catch (e) {
      showNotification("Deletion Failed", "Failed to delete contact record.", "error");
    }
  };

  // Simulating drag & drop attachment upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!focusedCustomer) return;

    // Simulated file attachment save
    const docPayload = {
      customerId: focusedCustomer.id,
      title: file.name.replace(/\.[^/.]+$/, "").split("_").join(" "),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream"
    };

    try {
      const res = await fetch("/api/v1/crm/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(docPayload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("File Attachment Filed", data.message, "success");
        fetchCustomerDetails(focusedCustomer.id);
      }
    } catch (e) {
      showNotification("Upload Failed", "Could not log file profile.", "error");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Purge document attachment from client folder? This action is irreversible.")) return;

    try {
      const res = await fetch(`/api/v1/crm/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Attachment purged", data.message, "success");
        if (focusedCustomer) fetchCustomerDetails(focusedCustomer.id);
      }
    } catch (e) {
      showNotification("Gateway Error", "Failed to request attachment deletion.", "error");
    }
  };

  // -------------------------------------------------------------
  // FOLLOW-UPS PLANNERS MUTATIONS
  // -------------------------------------------------------------

  const handleOpenFollowUpModal = () => {
    setFollowUpForm({
      leadId: "",
      customerId: "",
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow default
      status: "PENDING",
      type: "CALL",
      notes: ""
    });
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpForm.notes.trim() || !followUpForm.scheduledDate) {
      showNotification("Validation Incomplete", "Please fill in scheduled time and meeting brief details.", "error");
      return;
    }

    const payload = { ...followUpForm };
    if (!payload.leadId) payload.leadId = null as any;
    if (!payload.customerId) payload.customerId = null as any;

    try {
      const res = await fetch("/api/v1/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Agenda scheduled", data.message, "success");
        setIsFollowUpModalOpen(false);
        fetchFollowUps();
      }
    } catch (e) {
      showNotification("Gateway Error", "Could not save calendar event.", "error");
    }
  };

  const handleUpdateFollowUpStatus = async (id: string, nextStatus: "COMPLETED" | "CANCELLED" | "RESCHEDULED") => {
    try {
      const res = await fetch(`/api/v1/crm/followups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Calendar schedule updated", `Event marked as ${nextStatus}.`, "success");
        fetchFollowUps();
      }
    } catch (e) {
      showNotification("Sync Failed", "Could not modify schedule item status.", "error");
    }
  };

  // -------------------------------------------------------------
  // MEMOIZED SEARCH, FILTERS & PAGINATIONS
  // -------------------------------------------------------------

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchQuery = customerQuery.toLowerCase();
      const matchesSearch = 
        (c.companyName && c.companyName.toLowerCase().includes(matchQuery)) ||
        c.contactPerson.toLowerCase().includes(matchQuery) ||
        c.email.toLowerCase().includes(matchQuery) ||
        c.phone.toLowerCase().includes(matchQuery) ||
        c.accountCode.toLowerCase().includes(matchQuery);

      const matchesStatus = 
        customerStatusFilter === "ALL" || 
        (customerStatusFilter === "ACTIVE" && c.isActive) ||
        (customerStatusFilter === "DISABLED" && !c.isActive);

      const matchesBalance = 
        customerBalanceFilter === "ALL" ||
        (customerBalanceFilter === "DEBT" && c.outstandingBalance > 0) ||
        (customerBalanceFilter === "CLEAN" && c.outstandingBalance === 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });
  }, [customers, customerQuery, customerStatusFilter, customerBalanceFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerRowsPerPage;
    return filteredCustomers.slice(start, start + customerRowsPerPage);
  }, [filteredCustomers, customerPage, customerRowsPerPage]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchQuery = leadQuery.toLowerCase();
      const matchesSearch = 
        l.fullName.toLowerCase().includes(matchQuery) ||
        (l.companyName && l.companyName.toLowerCase().includes(matchQuery)) ||
        l.email.toLowerCase().includes(matchQuery) ||
        l.phone.toLowerCase().includes(matchQuery);

      const matchesStatus = leadStatusFilter === "ALL" || l.status === leadStatusFilter;
      const matchesSource = leadSourceFilter === "ALL" || l.source === leadSourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, leadQuery, leadStatusFilter, leadSourceFilter]);

  const paginatedLeads = useMemo(() => {
    const start = (leadPage - 1) * leadRowsPerPage;
    return filteredLeads.slice(start, start + leadRowsPerPage);
  }, [filteredLeads, leadPage, leadRowsPerPage]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter(f => {
      const matchQuery = fupQuery.toLowerCase();
      const matchesSearch = f.notes.toLowerCase().includes(matchQuery);
      const matchesStatus = fupStatusFilter === "ALL" || f.status === fupStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [followUps, fupQuery, fupStatusFilter]);

  // -------------------------------------------------------------
  // EXPORTER TOOLS: NATIVE PRINTER LAYOUT + CSV BINDERS
  // -------------------------------------------------------------

  const handlePrintPDF = () => {
    // Elegant client-side printing layout targeting a formatted window compilation
    const printContent = document.getElementById("crm-printable-summary");
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Celcom ERP Pro - CRM Corporate Summary Report</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background-color: #fff; }
              .header { border-b: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .logo { font-size: 24px; font-weight: 900; color: #0284c7; }
              .title { font-size: 20px; font-weight: 700; margin-top: 5px; }
              .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
              .meta-card { display: flex; flex-col; gap: 4px; }
              .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: bold; }
              .meta-value { font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a; }
              .section-title { font-size: 14px; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; color: #0f172a; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .table th { background-color: #f8fafc; padding: 10px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #475569; border-bottom: 2px solid #cbd5e1; text-align: left; }
              .table td { padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
              .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">CELCOM NETWORKS</div>
                <div class="title">ERP Pro Customer Relationship Management Report</div>
              </div>
              <div style="text-align: right; font-size: 11px; color: #64748b;">
                System Date: ${new Date().toLocaleDateString()}<br/>
                Operator ID: ${user?.email || "N/A"}
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-label">Total Corporate Accounts</div>
                <div class="meta-value">${summary.stats.totalCustomers}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Active ISP Subscribers</div>
                <div class="meta-value">${summary.stats.activeCustomers}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Total Outstanding Ledger (KES)</div>
                <div class="meta-value">${summary.stats.totalOutstanding.toLocaleString()}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Pipeline Sales Leads</div>
                <div class="meta-value">${summary.stats.totalLeads}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Lead Conversion Ratio</div>
                <div class="meta-value">${summary.stats.conversionRate}%</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Pending Follow Ups</div>
                <div class="meta-value">${summary.stats.pendingFollowUps}</div>
              </div>
            </div>

            <div class="section-title">Active Customer Roster Directory</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Company Legal Name</th>
                  <th>Primary Liaison</th>
                  <th>Liaison Contact Phone</th>
                  <th>Billing Email</th>
                  <th>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td style="font-family: monospace; font-weight: bold; color: #0284c7;">${c.accountCode}</td>
                    <td style="font-weight: 600;">${c.companyName || "Personal Subscriber"}</td>
                    <td>${c.contactPerson}</td>
                    <td>${c.phone}</td>
                    <td>${c.email}</td>
                    <td style="font-family: monospace; font-weight: bold; text-align: right;">KES ${c.outstandingBalance.toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="section-title">Critical Active Sales Pipeline (Leads)</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Prospect Legal Name</th>
                  <th>Corporate Target</th>
                  <th>Phone Number</th>
                  <th>Prospect Status</th>
                  <th>Lead Acquisition Source</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map(l => `
                  <tr>
                    <td style="font-weight: 600;">${l.fullName}</td>
                    <td>${l.companyName || "N/A"}</td>
                    <td>${l.phone}</td>
                    <td style="font-weight: bold;">${l.status}</td>
                    <td>${l.source}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="footer">
              Celcom Networks Ltd • ISO 9001:2015 Compliant Telecommunication ERP Systems • Strictly Confidential
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleExportCSV = () => {
    // Generate beautiful spreadsheet-compliant CSV
    const headers = ["Account Code", "Company Legal Name", "Primary Liaison", "Support Email", "Support Phone", "Physical HQ Address", "Credit Limit (KES)", "Outstanding Ledger (KES)", "Status"];
    const rows = filteredCustomers.map(c => [
      c.accountCode,
      c.companyName || "Personal Subscriber",
      c.contactPerson,
      c.email,
      c.phone,
      `"${c.physicalAddress.replace(/"/g, '""')}"`,
      c.creditLimit,
      c.outstandingBalance,
      c.isActive ? "ACTIVE" : "DISABLED"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Celcom_Networks_CRM_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Spreadsheet Downloaded", "Customer directory CSV compiled and downloaded successfully.", "success");
  };

  // -------------------------------------------------------------
  // LAYOUT COLUMNS SCHEMAS
  // -------------------------------------------------------------

  const customerColumns: Column<CRMCustomer>[] = [
    { key: "accountCode", header: "Code", render: (row) => <span className="font-mono font-bold text-sky-400">{row.accountCode}</span> },
    { key: "companyName", header: "Company Profile / Name", render: (row) => (
      <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{row.companyName || "Personal Subscriber"}</h4>
        <span className="text-[10px] text-slate-400 tracking-tight font-medium flex items-center gap-1 mt-0.5">
          <MapPin className="h-2.5 w-2.5 text-slate-500" />
          {row.physicalAddress.slice(0, 45)}{row.physicalAddress.length > 45 ? "..." : ""}
        </span>
      </div>
    )},
    { key: "contactPerson", header: "Key Liaison", render: (row) => (
      <div>
        <p className="font-medium text-slate-300">{row.contactPerson}</p>
        <p className="text-[10px] text-slate-500 font-mono">{row.phone}</p>
      </div>
    )},
    { key: "outstandingBalance", header: "Outstanding Debt", render: (row) => (
      <span className={`font-mono font-bold ${row.outstandingBalance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
        KES {row.outstandingBalance.toLocaleString()}
      </span>
    )},
    { key: "isActive", header: "ERP Status", render: (row) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
        row.isActive 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      }`}>
        <span className={`h-1 w-1 rounded-full ${row.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
        {row.isActive ? "ACTIVE" : "SUSPENDED"}
      </span>
    )},
    { key: "actions", header: "Action", render: (row) => (
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="xxs" onClick={() => handleSelectCustomer(row)}>
          Folder
        </Button>
        <Button variant="outline" size="xxs" onClick={() => handleOpenCustomerModal(row)}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    )}
  ];

  const leadColumns: Column<CRMLead>[] = [
    { key: "fullName", header: "Prospect Legal Name", render: (row) => (
      <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{row.fullName}</h4>
        <span className="text-[10px] text-slate-500 font-mono">{row.email}</span>
      </div>
    )},
    { key: "companyName", header: "Target Company", render: (row) => <span className="font-medium text-slate-300">{row.companyName || "Personal/N/A"}</span> },
    { key: "source", header: "Funnel Source", render: (row) => (
      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
        {row.source}
      </span>
    )},
    { key: "status", header: "SLA Status", render: (row) => {
      const colorsMap: Record<string, string> = {
        NEW: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        CONTACTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        QUALIFIED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        UNQUALIFIED: "bg-slate-500/10 text-slate-400 border-slate-700/20",
        LOST: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        CONVERTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      };
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${colorsMap[row.status] || ""}`}>
          {row.status}
        </span>
      );
    }},
    { key: "actions", header: "Actions", render: (row) => (
      <div className="flex items-center gap-1.5">
        {row.status !== "CONVERTED" && (
          <Button variant="primary" size="xxs" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => handleOpenConvertModal(row)} leftIcon={<UserPlus className="h-3 w-3" />}>
            Convert
          </Button>
        )}
        <Button variant="outline" size="xxs" onClick={() => handleOpenLeadModal(row)}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">

      {/* -------------------------------------------------------------
          MODULE MAIN HEADER
         ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-500" />
            CRM Module Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accelerate the enterprise sales pipeline. Track customer profiles, files, contacts, logged history timeline and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {activeTab === "customers" && !focusedCustomer && (
            <>
              <Button variant="primary" size="sm" onClick={() => handleOpenCustomerModal()} leftIcon={<Plus className="h-4 w-4" />}>
                Create Client Account
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />}>
                Export CSV
              </Button>
            </>
          )}
          {activeTab === "leads" && (
            <Button variant="primary" size="sm" onClick={() => handleOpenLeadModal()} leftIcon={<Plus className="h-4 w-4" />}>
              Add Pipeline Lead
            </Button>
          )}
          {activeTab === "followups" && (
            <Button variant="primary" size="sm" onClick={handleOpenFollowUpModal} leftIcon={<Calendar className="h-4 w-4" />}>
              Schedule Call / Site Survey
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (activeTab === "overview") fetchCRMReportSummary();
              else if (activeTab === "customers") { fetchCustomers(); setFocusedCustomer(null); }
              else if (activeTab === "leads") fetchLeads();
              else if (activeTab === "followups") fetchFollowUps();
              showNotification("CRM Refreshed", "Synchronized CRM folder with DB.", "success");
            }}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CRM SUB NAVIGATION CARDS (Print layout hides it)
         ------------------------------------------------------------- */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/50 print:hidden">
        <button
          onClick={() => { setActiveTab("overview"); setFocusedCustomer(null); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-sky-500 text-sky-400 font-black"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Executive Summary Report
        </button>
        <button
          onClick={() => { setActiveTab("customers"); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "customers"
              ? "border-sky-500 text-sky-400 font-black"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Customer Profiles {focusedCustomer && ` / Folder: ${focusedCustomer.companyName || focusedCustomer.contactPerson}`}
        </button>
        <button
          onClick={() => { setActiveTab("leads"); setFocusedCustomer(null); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "leads"
              ? "border-sky-500 text-sky-400 font-black"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Leads Pipeline
        </button>
        <button
          onClick={() => { setActiveTab("followups"); setFocusedCustomer(null); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "followups"
              ? "border-sky-500 text-sky-400 font-black"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Follow Up Scheduler
        </button>
      </div>

      {/* -------------------------------------------------------------
          MAIN VIEWPORTS ROUTER
         ------------------------------------------------------------- */}

      {/* VIEWPORT 1: CRM OVERVIEW METRICS & GRAPH */}
      {activeTab === "overview" && (
        <div className="space-y-6" id="crm-printable-summary">
          {summaryLoading ? (
            <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
              Retrieving corporate sales pipeline ledger telemetry...
            </div>
          ) : (
            <>
              {/* PRINT BANNER - HIDDEN ON DESKTOP */}
              <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                <h1 className="text-xl font-bold">Celcom Networks Limited</h1>
                <p className="text-xs">Corporate Sales & CRM Ledger Summary. Date generated: {new Date().toLocaleDateString()}</p>
              </div>

              {/* CRM Key Metrics Panels */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Corporate Clients</p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-2xl font-black tracking-tight text-white">{summary.stats.totalCustomers}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        {summary.stats.activeCustomers} Active
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Sales Pipeline Leads</p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-2xl font-black tracking-tight text-white">{summary.stats.totalLeads}</span>
                      <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded">
                        {summary.stats.conversionRate}% Conv.
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Active Debt Ledger</p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-2xl font-black tracking-tight text-white">
                        KES {Math.round(summary.stats.totalOutstanding / 1000)}K
                      </span>
                      <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                        Arrears
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Pending Follow Ups</p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-2xl font-black tracking-tight text-white">{summary.stats.pendingFollowUps}</span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        Scheduled
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Double Column Graphs & Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Visual Graph Area */}
                <div className="lg:col-span-3 space-y-6 print:hidden">
                  <Card className="border-slate-800/80 bg-slate-950/20">
                    <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Outstanding Billing Balances (Top Accounts)</CardTitle>
                      <CardDescription>Accounts with outstanding arrears listed against active credit limits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {summary.charts.outstandingLedger.length > 0 ? (
                        <Charts 
                          type="bar"
                          data={summary.charts.outstandingLedger}
                          metrics={[
                            { key: "balance", color: "#f43f5e", label: "Outstanding (KES)" },
                            { key: "credit", color: "#0284c7", label: "Allowed Credit Limit" }
                          ]}
                          height={240}
                        />
                      ) : (
                        <div className="text-center text-xs text-slate-500 py-10">No customer ledger accounts initialized.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Lead Distribution stats and controls */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-slate-800/80 bg-slate-950/20">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800/40 pb-4">
                      <div>
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Recent CRM Activities</CardTitle>
                        <CardDescription>Live telemetry tracking conversion milestones.</CardDescription>
                      </div>
                      <Button variant="outline" size="xs" onClick={handlePrintPDF} leftIcon={<Printer className="h-3.5 w-3.5" />} className="print:hidden">
                        Export PDF
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {summary.recentEvents.length > 0 ? (
                            summary.recentEvents.map((event, eventIdx) => (
                              <li key={event.id}>
                                <div className="relative pb-8">
                                  {eventIdx !== summary.recentEvents.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                                  ) : null}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center ring-8 ring-slate-950/10">
                                        <History className="h-4 w-4 text-sky-500" />
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-xs text-slate-300">
                                          <span className="font-extrabold text-sky-400">{event.customerName}</span>: {event.eventDetails}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                          <span>By {event.performedBy}</span>
                                          <span>•</span>
                                          <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <div className="text-center text-xs text-slate-500 py-6">No historical records logged in database.</div>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* VIEWPORT 2: CUSTOMERS DIRECTORY & DETAIL FILES */}
      {activeTab === "customers" && (
        <>
          {/* A. CUSTOMER DIRECTORY LIST VIEW (IF NO DOCK FILE FOCUS) */}
          {!focusedCustomer ? (
            <div className="space-y-4">
              {/* Dynamic Filtering Frame */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search account code, company, liaison, email, phone..."
                    value={customerQuery}
                    onChange={(e) => { setCustomerQuery(e.target.value); setCustomerPage(1); }}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <Select
                    label=""
                    options={[
                      { value: "ALL", label: "All Account Statuses" },
                      { value: "ACTIVE", label: "ACTIVE Clients Only" },
                      { value: "DISABLED", label: "SUSPENDED Clients Only" }
                    ]}
                    value={customerStatusFilter}
                    onChange={(e) => { setCustomerStatusFilter(e.target.value); setCustomerPage(1); }}
                  />
                </div>

                <div>
                  <Select
                    label=""
                    options={[
                      { value: "ALL", label: "All Ledger Balances" },
                      { value: "DEBT", label: "Outstanding Debts (Arrears)" },
                      { value: "CLEAN", label: "Paid / Clean Accounts" }
                    ]}
                    value={customerBalanceFilter}
                    onChange={(e) => { setCustomerBalanceFilter(e.target.value); setCustomerPage(1); }}
                  />
                </div>
              </div>

              {/* customers table list */}
              <Table 
                columns={customerColumns} 
                data={paginatedCustomers} 
                isLoading={customersLoading} 
                emptyMessage="No active customer accounts matched the search criteria."
              />

              {filteredCustomers.length > 0 && (
                <Pagination 
                  currentPage={customerPage}
                  totalPages={Math.ceil(filteredCustomers.length / customerRowsPerPage)}
                  totalRecords={filteredCustomers.length}
                  rowsPerPage={customerRowsPerPage}
                  onPageChange={setCustomerPage}
                  onRowsPerPageChange={(rows) => { setCustomerRowsPerPage(rows); setCustomerPage(1); }}
                />
              )}
            </div>
          ) : (
            /* B. INDIVIDUAL CLIENT DETAIL DOCK FOLDER */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column Profile Sidebar card */}
              <div className="lg:col-span-2 space-y-4">
                <Button variant="outline" size="xs" onClick={() => setFocusedCustomer(null)} leftIcon={<ArrowRight className="h-4 w-4 rotate-180" />}>
                  Back to Directory
                </Button>

                <Card className="border-slate-800">
                  <CardHeader className="bg-gradient-to-b from-slate-900 to-transparent border-b border-slate-800/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 font-extrabold text-base border border-sky-500/20">
                        {focusedCustomer.companyName ? focusedCustomer.companyName.slice(0, 2).toUpperCase() : focusedCustomer.contactPerson.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-sky-400 uppercase tracking-tight bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            {focusedCustomer.accountCode}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${focusedCustomer.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
                        </div>
                        <h2 className="text-sm font-black text-slate-100 mt-1">{focusedCustomer.companyName || "Personal Account"}</h2>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/40">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Arrears Balance</p>
                        <p className={`font-mono text-base font-black ${focusedCustomer.outstandingBalance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          KES {focusedCustomer.outstandingBalance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Allowed Limit</p>
                        <p className="font-mono text-base font-black text-slate-300">
                          KES {focusedCustomer.creditLimit.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Users className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Key Liaison Contact</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{focusedCustomer.contactPerson}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Mail className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Support Email</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{focusedCustomer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Phone className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Support Telephone</p>
                          <p className="font-semibold text-slate-300 mt-0.5 font-mono">{focusedCustomer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Physical Registered HQ Address</p>
                          <p className="font-semibold text-slate-300 mt-0.5 tracking-tight">{focusedCustomer.physicalAddress}</p>
                        </div>
                      </div>

                      {focusedCustomer.kraPin && (
                        <div className="flex items-start gap-2.5">
                          <Building2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Corporate KRA PIN</p>
                            <p className="font-semibold text-slate-300 mt-0.5 font-mono">{focusedCustomer.kraPin}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/40">
                      <Button variant="outline" size="xs" className="w-full" onClick={() => handleOpenCustomerModal(focusedCustomer)}>
                        Configure Legal Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column Folder Categories & Tabbed content */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Tabs Panel */}
                <div className="flex border-b border-slate-800/60 bg-slate-900/40 rounded-lg p-1">
                  <button
                    onClick={() => setCustomerDetailTab("notes")}
                    className={`flex-1 text-center py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      customerDetailTab === "notes" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Client Notes
                  </button>
                  <button
                    onClick={() => setCustomerDetailTab("contacts")}
                    className={`flex-1 text-center py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      customerDetailTab === "contacts" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    contacts Directory
                  </button>
                  <button
                    onClick={() => setCustomerDetailTab("documents")}
                    className={`flex-1 text-center py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      customerDetailTab === "documents" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Documents Binder
                  </button>
                  <button
                    onClick={() => setCustomerDetailTab("history")}
                    className={`flex-1 text-center py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      customerDetailTab === "history" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    CRM Logs History
                  </button>
                </div>

                {/* 1. NOTES DOCK VIEW */}
                {customerDetailTab === "notes" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/30 p-3.5 border border-slate-800/60 rounded-xl">
                      <span className="text-xs text-slate-400">Add operational log briefings regarding billing limits or link installations.</span>
                      <Button variant="primary" size="xs" onClick={() => setIsNoteModalOpen(true)} leftIcon={<Plus className="h-3 w-3" />}>
                        Append Note
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {detailsLoading ? (
                        <div className="py-10 text-center text-xs text-slate-500">Querying notes logs...</div>
                      ) : focusedNotes.length > 0 ? (
                        focusedNotes.map(note => (
                          <div key={note.id} className="bg-slate-900/10 border border-slate-800/40 p-4 rounded-xl text-xs space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="font-extrabold text-sky-400">{note.authorName}</span>
                              <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-300 font-sans tracking-wide leading-relaxed">{note.note}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-slate-500 py-10 bg-slate-950/10 rounded-xl border border-slate-800/30">
                          No customer log notes appended to profile folder.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CONTACTS DIRECTORY DOCK VIEW */}
                {customerDetailTab === "contacts" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/30 p-3.5 border border-slate-800/60 rounded-xl">
                      <span className="text-xs text-slate-400">Register alternative technical coordinators or accountant points of contact.</span>
                      <Button variant="primary" size="xs" onClick={() => setIsContactModalOpen(true)} leftIcon={<Plus className="h-3 w-3" />}>
                        Add Liaison
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailsLoading ? (
                        <div className="col-span-2 py-10 text-center text-xs text-slate-500">Querying alternative liaisons...</div>
                      ) : focusedContacts.length > 0 ? (
                        focusedContacts.map(contact => (
                          <div key={contact.id} className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl text-xs relative space-y-2">
                            <button 
                              className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div>
                              <h4 className="font-bold text-slate-200">{contact.fullName}</h4>
                              <p className="text-[10px] text-sky-400 font-mono tracking-wide mt-0.5">{contact.designation || "Liaison Point"}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-800/40 text-[11px] space-y-1 text-slate-400">
                              <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {contact.phone}</p>
                              {contact.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {contact.email}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-xs text-slate-500 py-10 bg-slate-950/10 rounded-xl border border-slate-800/30">
                          No alternative liaisons listed.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. DOCUMENTS BINDER DOCK VIEW */}
                {customerDetailTab === "documents" && (
                  <div className="space-y-4">
                    {/* Drag and Drop Attachment simulation space */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                        isDragging 
                          ? "border-sky-500 bg-sky-500/10 text-sky-400" 
                          : "border-slate-800 bg-slate-950/10 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20"
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                      />
                      <UploadCloud className="h-10 w-10 mx-auto text-slate-500 mb-3 animate-bounce" />
                      <h4 className="font-bold text-xs text-slate-200">Drag & Drop signed customer SLAs or site-survey PDFs here</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Supports PDF, Word, Excel, Images up to 25MB (Simulated filing)</p>
                    </div>

                    <div className="space-y-2">
                      {detailsLoading ? (
                        <div className="py-10 text-center text-xs text-slate-500">Loading documents...</div>
                      ) : focusedDocuments.length > 0 ? (
                        focusedDocuments.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-slate-900/10 border border-slate-800/40 p-3.5 rounded-xl text-xs">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded bg-sky-500/10 flex items-center justify-center text-sky-400">
                                <FileCheck2 className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-200">{doc.title}</h4>
                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{doc.fileName}</span>
                                  <span>•</span>
                                  <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                              <button 
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-slate-500 py-10 bg-slate-950/10 rounded-xl border border-slate-800/30">
                          No uploaded documents in client file index.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. HISTORY AND EVENT LOGS */}
                {customerDetailTab === "history" && (
                  <div className="space-y-4">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {detailsLoading ? (
                          <div className="py-10 text-center text-xs text-slate-500">Loading audit history timeline...</div>
                        ) : focusedHistory.length > 0 ? (
                          focusedHistory.map((hist, histIdx) => (
                            <li key={hist.id}>
                              <div className="relative pb-8">
                                {histIdx !== focusedHistory.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center ring-8 ring-slate-950/10">
                                      <Clock className="h-4 w-4 text-sky-400" />
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight bg-slate-800 text-sky-400 border border-slate-700/50 uppercase mr-2">
                                        {hist.eventType}
                                      </span>
                                      <p className="text-xs text-slate-300 inline">{hist.eventDetails}</p>
                                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                        <span>Triggered by {hist.performedBy}</span>
                                        <span>•</span>
                                        <span>{new Date(hist.createdAt).toLocaleString()}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <div className="text-center text-xs text-slate-500 py-10 bg-slate-950/10 rounded-xl border border-slate-800/30">
                            No event history timeline compiled for this customer.
                          </div>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </>
      )}

      {/* VIEWPORT 3: SALES PIPELINE LEADS */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          
          {/* Filtering criteria header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search prospect names, target corporate, emails, phones..."
                value={leadQuery}
                onChange={(e) => { setLeadQuery(e.target.value); setLeadPage(1); }}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <Select
                label=""
                options={[
                  { value: "ALL", label: "All Pipeline Stages" },
                  { value: "NEW", label: "NEW" },
                  { value: "CONTACTED", label: "CONTACTED" },
                  { value: "QUALIFIED", label: "QUALIFIED" },
                  { value: "UNQUALIFIED", label: "UNQUALIFIED" },
                  { value: "LOST", label: "LOST" },
                  { value: "CONVERTED", label: "CONVERTED" }
                ]}
                value={leadStatusFilter}
                onChange={(e) => { setLeadStatusFilter(e.target.value); setLeadPage(1); }}
              />
            </div>

            <div>
              <Select
                label=""
                options={[
                  { value: "ALL", label: "All Lead Channels" },
                  { value: "WEBSITE", label: "WEBSITE Portal" },
                  { value: "REFERRAL", label: "Corporate REFERRAL" },
                  { value: "COLD_CALL", label: "COLD CALL" },
                  { value: "SOCIAL_MEDIA", label: "SOCIAL MEDIA" },
                  { value: "CAMPAIGN", label: "SLA Marketing CAMPAIGN" }
                ]}
                value={leadSourceFilter}
                onChange={(e) => { setLeadSourceFilter(e.target.value); setLeadPage(1); }}
              />
            </div>
          </div>

          <Table 
            columns={leadColumns} 
            data={paginatedLeads} 
            isLoading={leadsLoading} 
            emptyMessage="No prospective sales leads matched the pipeline search query."
          />

          {filteredLeads.length > 0 && (
            <Pagination 
              currentPage={leadPage}
              totalPages={Math.ceil(filteredLeads.length / leadRowsPerPage)}
              totalRecords={filteredLeads.length}
              rowsPerPage={leadRowsPerPage}
              onPageChange={setLeadPage}
              onRowsPerPageChange={(rows) => { setLeadRowsPerPage(rows); setLeadPage(1); }}
            />
          )}

        </div>
      )}

      {/* VIEWPORT 4: FOLLOW UPS CALENDAR & AGENDA CHRONOLOGY */}
      {activeTab === "followups" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search schedule summaries or brief notes..."
                value={fupQuery}
                onChange={(e) => setFupQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <Select
                label=""
                options={[
                  { value: "ALL", label: "All Schedule Statuses" },
                  { value: "PENDING", label: "PENDING Events" },
                  { value: "COMPLETED", label: "COMPLETED Events" },
                  { value: "CANCELLED", label: "CANCELLED Events" },
                  { value: "RESCHEDULED", label: "RESCHEDULED Events" }
                ]}
                value={fupStatusFilter}
                onChange={(e) => setFupStatusFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followupsLoading ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-500">Querying follow-ups scheduler files...</div>
            ) : filteredFollowUps.length > 0 ? (
              filteredFollowUps.map(fup => {
                const lead = leads.find(l => l.id === fup.leadId);
                const cust = customers.find(c => c.id === fup.customerId);
                const isOverdue = new Date(fup.scheduledDate) < new Date() && fup.status === "PENDING";
                
                return (
                  <Card key={fup.id} className={`border-slate-800 relative bg-gradient-to-b from-slate-950/20 to-transparent ${isOverdue ? "border-rose-950 bg-rose-950/5" : ""}`}>
                    {isOverdue && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-tight text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        OVERDUE
                      </span>
                    )}
                    <CardHeader className="pb-3 border-b border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {fup.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                          fup.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          fup.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                        }`}>
                          {fup.status}
                        </span>
                      </div>
                      <h4 className="text-xs text-slate-500 font-mono mt-2.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-sky-500" />
                        {new Date(fup.scheduledDate).toLocaleString()}
                      </h4>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Associated Contact</p>
                        <h4 className="font-semibold text-slate-200 mt-0.5">
                          {lead ? `[Pipeline Lead] ${lead.fullName}` : 
                           cust ? `[Client] ${cust.companyName || cust.contactPerson}` : "General Schedule"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {lead ? lead.phone : cust ? cust.phone : "No Phone"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Agenda Briefing</p>
                        <p className="text-slate-300 mt-1 font-sans leading-relaxed tracking-wide italic bg-slate-900/10 p-2.5 rounded border border-slate-800/40">
                          "{fup.notes}"
                        </p>
                      </div>

                      {fup.status === "PENDING" && (
                        <div className="pt-3 border-t border-slate-800/40 flex items-center gap-2">
                          <Button variant="outline" size="xxs" className="flex-1 text-emerald-400 border-emerald-950/30 hover:bg-emerald-500/10" onClick={() => handleUpdateFollowUpStatus(fup.id, "COMPLETED")}>
                            Complete
                          </Button>
                          <Button variant="outline" size="xxs" className="flex-1 text-rose-400 border-rose-950/30 hover:bg-rose-500/10" onClick={() => handleUpdateFollowUpStatus(fup.id, "CANCELLED")}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-500">No events scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODALS COMPILING SUITE
         ------------------------------------------------------------- */}

      {/* 1. CREATE / EDIT CUSTOMER PROFILE FORM */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? "Configure Customer Legal Profile" : "Register New Corporate Client"}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveCustomer}>Write Profile</Button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Account Code" 
              required 
              value={customerForm.accountCode} 
              onChange={(e) => setCustomerForm({ ...customerForm, accountCode: e.target.value })}
              disabled={!!editingCustomer}
            />
            <Input 
              label="Company Legal Name (leave blank if individual)" 
              value={customerForm.companyName} 
              placeholder="e.g. Nairobi Hospital Node"
              onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Primary Liaison Person" 
              required 
              placeholder="e.g. Dr. Arthur Ndwiga"
              value={customerForm.contactPerson} 
              onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
            />
            <Input 
              label="Corporate KRA PIN" 
              placeholder="e.g. P051122334A"
              value={customerForm.kraPin} 
              onChange={(e) => setCustomerForm({ ...customerForm, kraPin: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Billing Email Address" 
              type="email"
              required 
              placeholder="e.g. billing@nairobihosp.org"
              value={customerForm.email} 
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
            />
            <Input 
              label="Contact Telephone" 
              required 
              placeholder="e.g. +254700112233"
              value={customerForm.phone} 
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
            />
          </div>

          <Input 
            label="Physical HQ / Installation Address" 
            required 
            placeholder="Argwings Kodhek Road, Hurlingham, Nairobi"
            value={customerForm.physicalAddress} 
            onChange={(e) => setCustomerForm({ ...customerForm, physicalAddress: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Allowed Debt Limit (KES)" 
              type="number" 
              required 
              value={customerForm.creditLimit} 
              onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: parseFloat(e.target.value) })}
            />
            {editingCustomer && (
              <div className="pt-8">
                <Checkbox 
                  label="Profile Clearance Status" 
                  checked={customerForm.isActive}
                  onChange={(e) => setCustomerForm({ ...customerForm, isActive: e.target.checked })}
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* 2. CREATE / EDIT PIPELINE LEAD FORM */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title={editingLead ? "Edit Pipeline Lead Configs" : "Register Sales Prospect Lead"}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsLeadModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveLead}>File Prospect</Button>
          </>
        }
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Prospect Liaison Full Name" 
              required 
              placeholder="James Kamau"
              value={leadForm.fullName} 
              onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
            />
            <Input 
              label="Corporate Target Organization" 
              placeholder="e.g. Kisumu Business Hub"
              value={leadForm.companyName} 
              onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Prospect Email" 
              type="email"
              required 
              placeholder="e.g. contact@kisumuhub.co.ke"
              value={leadForm.email} 
              onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            />
            <Input 
              label="Prospect Phone Contact" 
              required 
              placeholder="+254711223344"
              value={leadForm.phone} 
              onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Sales Funnel Source" 
              options={[
                { value: "WEBSITE", label: "WEBSITE Portal Landing" },
                { value: "REFERRAL", label: "Corporate Referral" },
                { value: "COLD_CALL", label: "COLD CALL Outbound" },
                { value: "SOCIAL_MEDIA", label: "SOCIAL MEDIA Outreach" },
                { value: "CAMPAIGN", label: "Fibre Lease Marketing Campaign" }
              ]}
              value={leadForm.source}
              onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value as any })}
            />
            <Select 
              label="Sales pipeline Status" 
              options={[
                { value: "NEW", label: "NEW" },
                { value: "CONTACTED", label: "CONTACTED" },
                { value: "QUALIFIED", label: "QUALIFIED" },
                { value: "UNQUALIFIED", label: "UNQUALIFIED" },
                { value: "LOST", label: "LOST" }
              ]}
              value={leadForm.status}
              onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
            />
          </div>

          <Input 
            label="Inquiry Brief / Context Requirements" 
            placeholder="Needs dual fiber ring feed with high SLA diagnostics uptime guarantee..."
            value={leadForm.notes} 
            onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* 3. CONVERT LEAD TO ACTIVE CUSTOMER PROFILE MODAL */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Prospect into Corporate Client"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleConvertLead} className="bg-emerald-600 hover:bg-emerald-500">Initialize Account</Button>
          </>
        }
      >
        {convertingLead && (
          <form onSubmit={handleConvertLead} className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-xs space-y-1">
              <p className="font-extrabold text-emerald-400">Pipeline Deal Qualification Complete!</p>
              <p className="text-slate-400">Prospect: <span className="text-slate-300 font-bold">{convertingLead.fullName}</span> ({convertingLead.companyName || "Personal"})</p>
              <p className="text-slate-400">Emails & contact phones will instantly migrate to the master ledger.</p>
            </div>

            <Input 
              label="Assigned Billing Account Code" 
              required 
              value={convertForm.accountCode} 
              onChange={(e) => setConvertForm({ ...convertForm, accountCode: e.target.value })}
            />

            <Input 
              label="Primary Account Liaison Representative" 
              required 
              value={convertForm.contactPerson} 
              onChange={(e) => setConvertForm({ ...convertForm, contactPerson: e.target.value })}
            />

            <Input 
              label="Client HQ / Physical Lease Location" 
              required 
              placeholder="e.g. Meru Town Plaza, Meru, Kenya"
              value={convertForm.physicalAddress} 
              onChange={(e) => setConvertForm({ ...convertForm, physicalAddress: e.target.value })}
            />

            <Input 
              label="Allowed Account Debt Limit (KES)" 
              type="number" 
              required 
              value={convertForm.creditLimit} 
              onChange={(e) => setConvertForm({ ...convertForm, creditLimit: parseFloat(e.target.value) })}
            />
          </form>
        )}
      </Modal>

      {/* 4. APPEND CUSTOM NOTE MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Customer Operational Note"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddNote}>Save Note</Button>
          </>
        }
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <Input 
            label="Provide detailed operational note / incident review briefing" 
            placeholder="Reviewing signal latency loops regarding fiber breakages near parliament road..."
            required 
            value={noteForm.note} 
            onChange={(e) => setNoteForm({ note: e.target.value })}
          />
        </form>
      </Modal>

      {/* 5. ADD SECONDARY LIAISON CONTACT MODAL */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Secondary Corporate Liaison"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsContactModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddContact}>Save Liaison</Button>
          </>
        }
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input 
            label="Secondary Representative Legal Name" 
            required 
            placeholder="John Mwangi"
            value={contactForm.fullName} 
            onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
          />
          <Input 
            label="Direct Designation" 
            required 
            placeholder="e.g. Lead Network Administrator / Chief Accountant"
            value={contactForm.designation} 
            onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
          />
          <Input 
            label="Direct Phone Contact" 
            required 
            placeholder="+254700000000"
            value={contactForm.phone} 
            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
          />
          <Input 
            label="Direct Support Email" 
            type="email"
            placeholder="liaison@corp.co.ke"
            value={contactForm.email} 
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
          />
        </form>
      </Modal>

      {/* 6. SCHEDULE AGENDA FOLLOW UP MODAL */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Pipeline Agenda Event"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveFollowUp}>Schedule Event</Button>
          </>
        }
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Event Protocol Method" 
              options={[
                { value: "CALL", label: "CALL Protocol" },
                { value: "EMAIL", label: "EMAIL Outreach" },
                { value: "MEETING", label: "MEETING Presentation" },
                { value: "SITE_SURVEY", label: "SITE SURVEY Attenuation Grid" }
              ]}
              value={followUpForm.type}
              onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value as any })}
            />
            <Input 
              label="Meeting Date & Time" 
              type="datetime-local" 
              required 
              value={followUpForm.scheduledDate} 
              onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Pipeline Lead Association (optional)" 
              options={[
                { value: "", label: "No Lead association" },
                ...leads.map(l => ({ value: l.id, label: `Lead: ${l.fullName} (${l.companyName || "Personal"})` }))
              ]}
              value={followUpForm.leadId}
              onChange={(e) => setFollowUpForm({ ...followUpForm, leadId: e.target.value, customerId: "" })}
            />
            <Select 
              label="Corporate Client Association (optional)" 
              options={[
                { value: "", label: "No Customer association" },
                ...customers.map(c => ({ value: c.id, label: `Client: ${c.companyName || c.contactPerson}` }))
              ]}
              value={followUpForm.customerId}
              onChange={(e) => setFollowUpForm({ ...followUpForm, customerId: e.target.value, leadId: "" })}
            />
          </div>

          <Input 
            label="Schedule Brief & Targets Notes" 
            placeholder="Inquire on fiber attenuation results or pitch the 100Mbps SLA lease draft..."
            required 
            value={followUpForm.notes} 
            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
          />
        </form>
      </Modal>

    </div>
  );
}

export default CRMPage;
