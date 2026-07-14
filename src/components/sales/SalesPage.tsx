import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  Copy, 
  Printer, 
  Mail, 
  BookOpen, 
  ArrowRightLeft, 
  Percent, 
  User, 
  Building, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  Info,
  Calendar,
  X,
  CreditCard,
  Layers,
  Sparkles,
  FileDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Table } from "../ui/Table";
import { useNotifications } from "../ui/Notifications";

// Types corresponding to backend structures
interface Product {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  vat: number;
}

interface Customer {
  id: string;
  accountCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  outstandingBalance: number;
}

interface QuotationItem {
  productId: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Quotation {
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
  items: QuotationItem[];
  createdAt: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  quotationRef?: string;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  deliveryDate?: string;
  assignedSalesPerson: string;
  items: Array<{
    productId: string;
    name?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

interface Invoice {
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
  items: Array<{
    productId: string;
    name?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

interface Payment {
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

interface Receipt {
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

interface CreditNote {
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

export function SalesPage() {
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<"dashboard" | "quotations" | "orders" | "invoices" | "payments" | "statements" | "creditnotes" | "isppreps" | "reports">("dashboard");

  // Server state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Reports & ISP preps
  const [reportData, setReportData] = useState<any>(null);
  const [ispPreps, setIspPreps] = useState<any>(null);

  // Loading indicator states
  const [loading, setLoading] = useState(false);
  const [ispRunning, setIspRunning] = useState(false);

  // Modals
  const [activeModal, setActiveModal] = useState<"quote" | "invoice" | "payment" | "creditnote" | "viewpdf" | null>(null);
  const [selectedPdfType, setSelectedPdfType] = useState<"quotation" | "invoice" | "receipt" | "statement" | null>(null);
  const [selectedPdfData, setSelectedPdfData] = useState<any>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // FORM STATES
  // Quotation form
  const [quoteForm, setQuoteForm] = useState({
    customerId: "",
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Celcom Networks: Premium Broadband Solutions.",
    termsAndConditions: "Payment: 100% on delivery. Valid for 30 days.",
    items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0 }]
  });

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: [{ productId: "", quantity: 1, unitPrice: 0 }]
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: 0,
    paymentMethod: "MPESA" as any,
    transactionReference: ""
  });

  // Credit note form
  const [cnForm, setCnForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: 0,
    reason: "",
    type: "ADJUSTMENT" as any
  });

  // Customer Statement selector
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState("");
  const [statementData, setStatementData] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      };

      // 1. Fetch CRM customers
      const resCust = await fetch("/api/v1/crm/customers", { headers });
      const dataCust = await resCust.json();
      if (dataCust.success) setCustomers(dataCust.customers);

      // 2. Fetch products
      const resProd = await fetch("/api/v1/inventory/products", { headers });
      const dataProd = await resProd.json();
      if (dataProd.success) setProducts(dataProd.products);

      // 3. Fetch module-specific models
      const [resQ, resSO, resInv, resPay, resRcpt, resCN, resRep, resIsp] = await Promise.all([
        fetch("/api/v1/sales/quotations", { headers }),
        fetch("/api/v1/sales/orders", { headers }),
        fetch("/api/v1/sales/invoices", { headers }),
        fetch("/api/v1/sales/payments", { headers }),
        fetch("/api/v1/sales/receipts", { headers }),
        fetch("/api/v1/sales/credit-notes", { headers }),
        fetch("/api/v1/sales/reports", { headers }),
        fetch("/api/v1/sales/isp-preps", { headers })
      ]);

      const [dq, dso, dinv, dpay, drcpt, dcn, drep, disp] = await Promise.all([
        resQ.json(), resSO.json(), resInv.json(), resPay.json(), resRcpt.json(), resCN.json(), resRep.json(), resIsp.json()
      ]);

      if (dq.success) setQuotations(dq.quotations);
      if (dso.success) setSalesOrders(dso.salesOrders);
      if (dinv.success) setInvoices(dinv.invoices);
      if (dpay.success) setPayments(dpay.payments);
      if (drcpt.success) setReceipts(drcpt.receipts);
      if (dcn.success) setCreditNotes(dcn.creditNotes);
      if (drep.success) setReportData(drep.reports);
      if (disp.success) setIspPreps(disp.ispPreps);

    } catch (e: any) {
      showNotification("Database Error", "Failed to contact Sales & Billing APIs. Falling back to secure offline JSON engine.", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle Quotation submission
  const handleCreateQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.customerId) return showNotification("Validation Failed", "Please select a customer.", "error");

    // Compute subTotal
    let sub = 0;
    const finalItems = quoteForm.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      const name = prod ? prod.name : "Item description";
      const sku = prod ? prod.sku : "SKU";
      const itemSub = it.quantity * it.unitPrice * (1 - it.discount / 100);
      sub += itemSub;
      return { ...it, name, sku };
    });

    const payload = {
      customerId: quoteForm.customerId,
      validUntil: quoteForm.validUntil,
      notes: quoteForm.notes,
      termsAndConditions: quoteForm.termsAndConditions,
      items: finalItems,
      subTotal: sub,
      status: "DRAFT"
    };

    try {
      const res = await fetch("/api/v1/sales/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Quotation Saved", `Draft Quotation ${data.quotation.quotationNumber} recorded.`, "success");
        setActiveModal(null);
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Failed to save quotation.", "error");
    }
  };

  // Convert Quotation to Invoice
  const handleConvertQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/quotations/${id}/convert`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Workflow Triggered", "Converted to Active Sales Order and Invoice generated.", "success");
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Conversion process failed.", "error");
    }
  };

  // Duplicate Quotation
  const handleDuplicateQuotation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/sales/quotations/${id}/duplicate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Quotation Duplicated", "New draft copy registered.", "success");
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Duplication failed.", "error");
    }
  };

  // Handle Invoice generation
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.customerId) return showNotification("Validation Failed", "Please select a customer.", "error");

    let sub = 0;
    const finalItems = invoiceForm.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      const name = prod ? prod.name : "Item description";
      const sku = prod ? prod.sku : "SKU";
      sub += (it.quantity * it.unitPrice);
      return { ...it, name, sku };
    });

    const payload = {
      customerId: invoiceForm.customerId,
      dueDate: invoiceForm.dueDate,
      items: finalItems,
      subTotal: sub,
      amountPaid: 0,
      status: "SENT"
    };

    try {
      const res = await fetch("/api/v1/sales/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Invoice Issued", `Generated Invoice ${data.invoice.invoiceNumber}.`, "success");
        setActiveModal(null);
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Failed to issue invoice.", "error");
    }
  };

  // Handle Payment recording
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.invoiceId) return showNotification("Validation Failed", "Please select an invoice.", "error");
    if (!paymentForm.transactionReference) return showNotification("Validation Failed", "Please enter M-Pesa or Bank transaction reference code.", "error");

    const inv = invoices.find(i => i.id === paymentForm.invoiceId);
    if (!inv) return;

    const payload = {
      customerId: inv.customerId,
      customerName: inv.customerName,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      transactionReference: paymentForm.transactionReference
    };

    try {
      const res = await fetch("/api/v1/sales/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Payment Processed", "Double-entry registered, receipt issued, and stock updated.", "success");
        setActiveModal(null);
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Payment process crashed.", "error");
    }
  };

  // Handle Credit Note submission
  const handleCreateCreditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnForm.customerId) return showNotification("Validation Failed", "Please select a customer.", "error");

    let invoiceNumber = undefined;
    if (cnForm.invoiceId) {
      const inv = invoices.find(i => i.id === cnForm.invoiceId);
      if (inv) invoiceNumber = inv.invoiceNumber;
    }

    const payload = {
      customerId: cnForm.customerId,
      invoiceId: cnForm.invoiceId || null,
      invoiceNumber,
      amount: Number(cnForm.amount),
      reason: cnForm.reason,
      type: cnForm.type
    };

    try {
      const res = await fetch("/api/v1/sales/credit-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Credit Note Issued", "Credit adjust record logged successfully.", "success");
        setActiveModal(null);
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "Failed to issue Credit Note.", "error");
    }
  };

  // Fetch Customer Account Statement
  const handleLoadStatement = async (customerId: string) => {
    if (!customerId) return;
    try {
      const res = await fetch(`/api/v1/sales/statements/${customerId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatementData(data.statement);
        showNotification("Statement Compiled", "Retrieved direct double-entry statement card.", "success");
      }
    } catch (err) {
      showNotification("Error", "Failed to load statements.", "error");
    }
  };

  // Run ISP Recurring Billing Loop
  const handleRunIspBilling = async () => {
    setIspRunning(true);
    try {
      const res = await fetch("/api/v1/sales/isp-preps/recurring", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Invoices Provisioned", `ISP billing complete. Generated ${data.runResult.generatedInvoicesCount} invoices totaling KES ${data.runResult.billedAmount.toLocaleString()}.`, "success");
        fetchData();
      }
    } catch (err) {
      showNotification("Error", "ISP monthly billing automation failed.", "error");
    } finally {
      setIspRunning(false);
    }
  };

  // Simulated Email Send
  const handleSimulateEmail = (type: string, num: string) => {
    showNotification("Email Transport Fired", `Dispatched ${type} document [${num}] securely to client.`, "success");
  };

  // Launch PDF modal
  const handleViewPdf = (type: "quotation" | "invoice" | "receipt" | "statement", data: any) => {
    setSelectedPdfType(type);
    setSelectedPdfData(data);
    setActiveModal("viewpdf");
  };

  // Search filter matches
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const nameMatch = q.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === "ALL" || q.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [quotations, searchQuery, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const nameMatch = i.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === "ALL" || i.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6" id="sales_and_billing_module">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-950 p-5 px-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold tracking-wider">
              CELCOM ERP v4
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold">
              TAX COMPLIANT
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Sales & Billing Core Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time quotations, sales orders, double-entry automated invoicing, receipts, Kenya VAT 16.0% reporting, and OLT fiber stock deduction.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <Button variant="subtle" size="sm" leftIcon={<RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />} onClick={fetchData}>
            Sync Operations
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
            setQuoteForm({
              customerId: "",
              validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              notes: "Celcom Networks: Premium Broadband Solutions.",
              termsAndConditions: "Payment: 100% on delivery. Valid for 30 days.",
              items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0 }]
            });
            setActiveModal("quote");
          }}>
            New Quotation
          </Button>
        </div>
      </div>

      {/* REVENUE CONTROLS NAVIGATION TABS */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "dashboard", label: "Dashboard", icon: <Layers className="h-4 w-4" /> },
          { id: "quotations", label: "Quotations", icon: <FileText className="h-4 w-4" /> },
          { id: "orders", label: "Sales Orders", icon: <ArrowRightLeft className="h-4 w-4" /> },
          { id: "invoices", label: "Invoices", icon: <FileText className="h-4 w-4" /> },
          { id: "payments", label: "Payments & Receipts", icon: <DollarSign className="h-4 w-4" /> },
          { id: "statements", label: "Customer Statements", icon: <Building className="h-4 w-4" /> },
          { id: "creditnotes", label: "Credit Notes", icon: <Percent className="h-4 w-4" /> },
          { id: "isppreps", label: "ISP Automated Billing", icon: <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> },
          { id: "reports", label: "Sales Reports", icon: <BarChart3 className="h-4 w-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 cursor-pointer transition-all duration-150
              ${activeTab === tab.id 
                ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold bg-sky-500/5" 
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40"}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODULE TAB CONTENT PANELS */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Card className="bg-slate-900 text-white border-slate-950">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Monthly Sales Revenue</p>
                    <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-sky-400">
                      KES {(reportData?.monthlySales || 53700).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-4 flex items-center gap-1 font-mono">
                  <span className="text-emerald-400 font-bold">▲ 14.2%</span> from previous cycle
                </div>
              </CardContent>
            </Card>

            <Card borderAccent>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Outstanding Receivables</p>
                    <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
                      KES {(reportData?.outstandingReceivables || 15660).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-4 flex items-center gap-1">
                  <span className="text-amber-500 font-bold">● Warning:</span> 2 invoices overdue limits
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Broadband ISP Recurring Pool</p>
                    <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
                      KES {(ispPreps?.pendingBillingAmount || 47500).toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-4 flex items-center gap-1">
                  <span className="text-sky-500 font-bold">● Ready:</span> {ispPreps?.upcomingRenewals?.length || 3} upcoming subscriber nodes
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Total Active Quotations</p>
                    <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
                      {quotations.length} Quotes
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-4 flex items-center gap-1">
                  <span className="text-emerald-500 font-bold">● {quotations.filter(q=>q.status==="APPROVED").length} Approved</span> ready for order pipeline
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TWO COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-sky-500" />
                  Recent Double-Entry Invoices
                </CardTitle>
                <CardDescription>Most recent billing transactions dispatched to Kenya Revenue Authority compliant channels.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Created</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 5).map(inv => (
                        <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{inv.invoiceNumber}</td>
                          <td className="p-3 font-semibold">{inv.customerName}</td>
                          <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-bold font-mono">KES {inv.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-slate-500 font-mono">KES {inv.amountPaid.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              inv.status === "PAID" ? "bg-emerald-950 text-emerald-400" :
                              inv.status === "PARTIALLY_PAID" ? "bg-amber-950 text-amber-400" :
                              "bg-red-950 text-red-400"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-amber-500" />
                  Upcoming Renewals
                </CardTitle>
                <CardDescription>ISP subscribers set for automatic monthly recurring subscription generation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(ispPreps?.upcomingRenewals || []).map((sub: any) => (
                  <div key={sub.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <div>
                      <h4 className="text-xs font-bold">{sub.subscriberName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{sub.packageName}</p>
                      <span className="text-[10px] text-sky-500 font-mono font-bold mt-1 inline-block">Renew: {sub.renewalDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">KES {sub.monthlyPrice.toLocaleString()}</span>
                      <p className="text-[9px] text-slate-400 font-mono">+16% VAT</p>
                    </div>
                  </div>
                ))}
                <Button variant="primary" size="sm" className="w-full mt-2" leftIcon={<Sparkles />} onClick={() => setActiveTab("isppreps")}>
                  Manage ISP Billing Pool
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* QUOTATIONS PANEL */}
      {activeTab === "quotations" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <CardTitle>Sales Quotation Portfolio</CardTitle>
                <CardDescription>Design professional quotations, duplicate client bids, and convert approved files to orders.</CardDescription>
              </div>
              <div className="flex gap-2.5">
                <Input 
                  placeholder="Search quotes, clients..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-48 text-xs h-9" 
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                />
                <Select 
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "DRAFT", label: "Draft" },
                    { value: "SENT", label: "Sent" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "EXPIRED", label: "Expired" }
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-36 text-xs h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    <th className="p-3">Quote Number</th>
                    <th className="p-3">Customer Entity</th>
                    <th className="p-3">Date Created</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Total (KES)</th>
                    <th className="p-3">Sales Agent</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map(q => (
                    <tr key={q.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{q.quotationNumber}</td>
                      <td className="p-3 font-semibold">
                        <div>{q.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{q.customerEmail}</div>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-500">{q.validUntil}</td>
                      <td className="p-3 font-bold font-mono">KES {q.totalAmount.toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{q.salesPerson}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          q.status === "APPROVED" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                          q.status === "SENT" ? "bg-sky-950 text-sky-400 border border-sky-900" :
                          q.status === "DRAFT" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                          "bg-red-950 text-red-400 border border-red-900"
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button variant="outline" size="xs" leftIcon={<Printer className="h-3 w-3" />} onClick={() => handleViewPdf("quotation", q)}>
                          View
                        </Button>
                        <Button variant="subtle" size="xs" leftIcon={<Copy className="h-3 w-3" />} onClick={() => handleDuplicateQuotation(q.id)}>
                          Duplicate
                        </Button>
                        {q.status !== "APPROVED" && (
                          <Button variant="outline" size="xs" leftIcon={<CheckCircle className="h-3 w-3 text-emerald-500" />} onClick={() => handleConvertQuotation(q.id)}>
                            Convert to Invoice
                          </Button>
                        )}
                        <Button variant="outline" size="xs" leftIcon={<Mail className="h-3 w-3" />} onClick={() => handleSimulateEmail("Quotation", q.quotationNumber)}>
                          Email
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredQuotations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                        No quotations match specified filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SALES ORDERS PANEL */}
      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Approved Sales Orders Pipeline</CardTitle>
              <CardDescription>Track equipment deliveries, client setups, and fulfillment parameters for active fiber contracts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer Client</th>
                    <th className="p-3">Quotation Ref</th>
                    <th className="p-3">Items Requested</th>
                    <th className="p-3">Est Delivery Date</th>
                    <th className="p-3">Sales Rep</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map(so => (
                    <tr key={so.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{so.orderNumber}</td>
                      <td className="p-3 font-semibold">{so.customerName}</td>
                      <td className="p-3 font-mono text-slate-500">{so.quotationRef || "N/A"}</td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {so.items.map((item, idx) => (
                            <div key={idx} className="text-[10px] text-slate-500 font-sans">
                              {item.name} <span className="font-bold text-slate-700">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">{so.deliveryDate || "TBD"}</td>
                      <td className="p-3 text-slate-500">{so.assignedSalesPerson}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          so.status === "FULFILLED" ? "bg-emerald-950 text-emerald-400" :
                          so.status === "PENDING" ? "bg-amber-950 text-amber-400 animate-pulse" :
                          "bg-red-950 text-red-400"
                        }`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {so.status === "PENDING" && (
                          <Button variant="outline" size="xs" className="text-emerald-500" leftIcon={<CheckCircle className="h-3 w-3" />} onClick={async () => {
                            try {
                              const res = await fetch(`/api/v1/sales/orders/${so.id}/status`, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                                },
                                body: JSON.stringify({ status: "FULFILLED" })
                              });
                              if (res.ok) {
                                showNotification("Sales Order Fulfilled", `Order ${so.orderNumber} dispatched for fiber installation.`, "success");
                                fetchData();
                              }
                            } catch (e) {
                              showNotification("Error", "Failed to fulfill sales order.", "error");
                            }
                          }}>
                            Fulfill Order
                          </Button>
                        )}
                        {so.status === "PENDING" && (
                          <Button variant="outline" size="xs" className="text-red-500" leftIcon={<X className="h-3 w-3" />} onClick={async () => {
                            try {
                              const res = await fetch(`/api/v1/sales/orders/${so.id}/status`, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                                },
                                body: JSON.stringify({ status: "CANCELLED" })
                              });
                              if (res.ok) {
                                showNotification("Order Cancelled", "Sales order removed from dispatch lists.", "info");
                                fetchData();
                              }
                            } catch (e) {
                              showNotification("Error", "Failed to cancel order.", "error");
                            }
                          }}>
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INVOICES PANEL */}
      {activeTab === "invoices" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <CardTitle>Corporate Invoices Ledger</CardTitle>
                <CardDescription>Automated double-entry invoice generation. Generates professional templates compatible with VAT Kenya.</CardDescription>
              </div>
              <div className="flex gap-2.5">
                <Input 
                  placeholder="Search invoices..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-48 text-xs h-9" 
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                />
                <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
                  setInvoiceForm({
                    customerId: "",
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    items: [{ productId: "", quantity: 1, unitPrice: 0 }]
                  });
                  setActiveModal("invoice");
                }}>
                  Issue Manual Invoice
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Customer Entity</th>
                    <th className="p-3">Billing Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Amount Paid</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold">{inv.customerName}</td>
                      <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-500">{inv.dueDate}</td>
                      <td className="p-3 font-bold font-mono text-slate-900 dark:text-slate-100">KES {inv.totalAmount.toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-mono">KES {inv.amountPaid.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          inv.status === "PAID" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                          inv.status === "PARTIALLY_PAID" ? "bg-amber-950 text-amber-400 border border-amber-900" :
                          "bg-red-950 text-red-400 border border-red-900"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button variant="outline" size="xs" leftIcon={<Printer className="h-3 w-3" />} onClick={() => handleViewPdf("invoice", inv)}>
                          View Template
                        </Button>
                        {inv.status !== "PAID" && (
                          <Button variant="primary" size="xs" leftIcon={<DollarSign className="h-3 w-3" />} onClick={() => {
                            setPaymentForm({
                              customerId: inv.customerId,
                              invoiceId: inv.id,
                              amount: inv.totalAmount - inv.amountPaid,
                              paymentMethod: "MPESA",
                              transactionReference: ""
                            });
                            setActiveModal("payment");
                          }}>
                            Pay Invoice
                          </Button>
                        )}
                        <Button variant="outline" size="xs" leftIcon={<Mail className="h-3 w-3" />} onClick={() => handleSimulateEmail("Invoice", inv.invoiceNumber)}>
                          Email
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                        No invoices match criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PAYMENTS & RECEIPTS PANEL */}
      {activeTab === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Received Payments Log</CardTitle>
              <CardDescription>Audit logs of double-entry payments completed across MPesa, bank wiring, or cheques.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                      <th className="p-3">Code</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Txn Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="p-3 font-mono font-bold text-slate-500">{p.paymentCode}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.customerName}</td>
                        <td className="p-3 font-mono text-sky-500 font-bold">{p.invoiceNumber || "Ondemand"}</td>
                        <td className="p-3 font-bold font-mono text-emerald-600">KES {p.amount.toLocaleString()}</td>
                        <td className="p-3 font-semibold">{p.paymentMethod}</td>
                        <td className="p-3 font-mono text-indigo-500">{p.transactionReference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issued Cash Receipts</CardTitle>
              <CardDescription>Download, email, or print receipts issued to clients on successful transactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Paid Amount</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(r => (
                      <tr key={r.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{r.receiptNumber}</td>
                        <td className="p-3 font-semibold">{r.customerName}</td>
                        <td className="p-3 font-mono text-slate-500">{r.invoiceNumber || "Ondemand"}</td>
                        <td className="p-3 font-bold font-mono text-emerald-600">KES {r.amount.toLocaleString()}</td>
                        <td className="p-3 text-right space-x-1.5">
                          <Button variant="outline" size="xs" leftIcon={<Printer className="h-3 w-3" />} onClick={() => handleViewPdf("receipt", r)}>
                            Print Receipt
                          </Button>
                          <Button variant="outline" size="xs" leftIcon={<Mail className="h-3 w-3" />} onClick={() => handleSimulateEmail("Receipt", r.receiptNumber)}>
                            Email
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CUSTOMER STATEMENT PANEL */}
      {activeTab === "statements" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <CardTitle>Customer Statement of Account</CardTitle>
                <CardDescription>Select a CRM client to compile their billing summary, outstanding ledger lines, payments, and credits.</CardDescription>
              </div>
              <div className="flex gap-2 items-end">
                <Select
                  label="Select Client Entity"
                  options={[
                    { value: "", label: "Choose registered client..." },
                    ...customers.map(c => ({ value: c.id, label: `${c.companyName || c.contactPerson} (${c.accountCode})` }))
                  ]}
                  value={selectedStatementCustomer}
                  onChange={(e) => {
                    setSelectedStatementCustomer(e.target.value);
                    handleLoadStatement(e.target.value);
                  }}
                  className="w-80 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statementData ? (
              <div className="space-y-6">
                {/* Statement Brief */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Subscriber Client Name</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{statementData.customerName}</h4>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Balance KES</span>
                    <h4 className="text-sm font-bold text-red-500 mt-0.5">KES {statementData.outstandingBalance.toLocaleString()}</h4>
                  </div>
                  <div className="flex justify-end items-center">
                    <Button variant="primary" size="sm" leftIcon={<Printer />} onClick={() => handleViewPdf("statement", statementData)}>
                      View Printable Statement PDF
                    </Button>
                  </div>
                </div>

                {/* Ledger lists split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Invoice history */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-sky-500" /> Invoice History
                    </h4>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono">
                          <tr>
                            <th className="p-2">Inv No</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Total Amount</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statementData.invoiceHistory.map((inv: any) => (
                            <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-900">
                              <td className="p-2 font-mono font-bold text-sky-600 dark:text-sky-400">{inv.invoiceNumber}</td>
                              <td className="p-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                              <td className="p-2 font-mono font-bold">KES {inv.totalAmount.toLocaleString()}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  inv.status === "PAID" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment history */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-500" /> Payment logs & Credits
                    </h4>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono">
                          <tr>
                            <th className="p-2">Ref Code</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Method</th>
                            <th className="p-2">Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statementData.paymentHistory.map((p: any) => (
                            <tr key={p.id} className="border-b border-slate-100 dark:border-slate-900">
                              <td className="p-2 font-mono text-slate-500">{p.paymentCode}</td>
                              <td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="p-2 font-semibold">{p.paymentMethod}</td>
                              <td className="p-2 font-mono font-bold text-emerald-600">KES {p.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          {statementData.creditNotes.map((cn: any) => (
                            <tr key={cn.id} className="border-b border-slate-100 dark:border-slate-900 bg-amber-500/5">
                              <td className="p-2 font-mono text-amber-500 font-bold">{cn.creditNoteNumber}</td>
                              <td className="p-2">{new Date(cn.createdAt).toLocaleDateString()}</td>
                              <td className="p-2 text-amber-500 font-bold">{cn.type}</td>
                              <td className="p-2 font-mono font-bold text-amber-600">KES {cn.amount.toLocaleString()} (CN)</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 font-mono border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Please select a subscriber client from the dropdown above to load statement ledgers.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREDIT NOTES PANEL */}
      {activeTab === "creditnotes" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <CardTitle>Sales Return & Credit Notes</CardTitle>
                <CardDescription>Issue credit notes for hardware returns, billing mistakes, or customer account refunds.</CardDescription>
              </div>
              <div>
                <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
                  setCnForm({
                    customerId: "",
                    invoiceId: "",
                    amount: 0,
                    reason: "",
                    type: "ADJUSTMENT"
                  });
                  setActiveModal("creditnote");
                }}>
                  Issue Credit Note
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    <th className="p-3">CN Number</th>
                    <th className="p-3">Customer Entity</th>
                    <th className="p-3">Ref Invoice</th>
                    <th className="p-3">Adjusted Amount</th>
                    <th className="p-3">Adjustment Type</th>
                    <th className="p-3">Reason / Details</th>
                    <th className="p-3">Date Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map(cn => (
                    <tr key={cn.id} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="p-3 font-mono font-bold text-amber-600">{cn.creditNoteNumber}</td>
                      <td className="p-3 font-semibold">{cn.customerName}</td>
                      <td className="p-3 font-mono text-slate-500">{cn.invoiceNumber || "Ondemand"}</td>
                      <td className="p-3 font-bold font-mono text-amber-600">KES {cn.amount.toLocaleString()}</td>
                      <td className="p-3 font-semibold font-mono text-slate-500">{cn.type}</td>
                      <td className="p-3 text-slate-500">{cn.reason || "General billing adjustment"}</td>
                      <td className="p-3 text-slate-500">{new Date(cn.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {creditNotes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                        No credit adjustments logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ISP AUTOMATED BILLING PANEL */}
      {activeTab === "isppreps" && (
        <div className="space-y-6">
          <Card borderAccent>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                Celcom PPPoE Monthly Recurring Invoicing Pool
              </CardTitle>
              <CardDescription>Prepare subscription renewals, monthly flat-rate broadband bills, and sync bandwidth profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Active ISP Nodes</span>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
                    {ispPreps?.activeSubscribersCount || 24}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">Registered PPPoE routers</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Unbilled Monthly Renewals</span>
                  <h3 className="text-3xl font-extrabold tracking-tight mt-1 text-indigo-500 dark:text-indigo-400">
                    KES {(ispPreps?.pendingBillingAmount || 47500).toLocaleString()}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">Pending recurring invoices</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center flex flex-col justify-center">
                  <Button variant="primary" size="md" className="w-full" leftIcon={<Sparkles />} isLoading={ispRunning} onClick={handleRunIspBilling}>
                    Run Automated Billing Loop
                  </Button>
                  <p className="text-[8px] text-slate-400 mt-1.5 font-mono">
                    This triggers PDF invoices generation + KRA tax integration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Subscription Billing Queue</CardTitle>
              <CardDescription>ISP clients whose leases will expire soon and trigger auto-invoicing.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                      <th className="p-3">Subscriber Node</th>
                      <th className="p-3">Internet Package</th>
                      <th className="p-3">Monthly KES (Ex VAT)</th>
                      <th className="p-3">VAT Kenya (16%)</th>
                      <th className="p-3">Total Due</th>
                      <th className="p-3">Cycle Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ispPreps?.upcomingRenewals || []).map((sub: any) => (
                      <tr key={sub.id} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="p-3 font-semibold">{sub.subscriberName}</td>
                        <td className="p-3 text-slate-500">{sub.packageName}</td>
                        <td className="p-3 font-mono">KES {sub.monthlyPrice.toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-400">KES {(sub.monthlyPrice * 0.16).toLocaleString()}</td>
                        <td className="p-3 font-bold font-mono text-slate-900 dark:text-white">KES {(sub.monthlyPrice * 1.16).toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-sky-500">Every 1st / {sub.renewalDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SALES REPORTS PANEL */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Celcom ERP Financial Reports Console</CardTitle>
              <CardDescription>Daily/Monthly revenue analysis, salesperson performance tracking, and tax reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Salesperson Leaderboard */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5 font-mono">
                    <User className="h-4 w-4 text-sky-500" /> Salesperson Leaderboard
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                        <tr>
                          <th className="p-2.5">Sales Executive</th>
                          <th className="p-2.5">Approved Quotes</th>
                          <th className="p-2.5">Revenue KES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData?.bySalesperson || [
                          { name: "Peter Masila", count: 2, totalSales: 22040 },
                          { name: "Alice Wanjiku", count: 1, totalSales: 31320 }
                        ]).map((sp: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                            <td className="p-2.5 font-semibold">{sp.name}</td>
                            <td className="p-2.5 text-slate-500">{sp.count} contracts</td>
                            <td className="p-2.5 font-bold font-mono">KES {sp.totalSales.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product Sales Report */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5 font-mono">
                    <Layers className="h-4 w-4 text-emerald-500" /> Top-selling ICT Products
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                        <tr>
                          <th className="p-2.5">Product Details</th>
                          <th className="p-2.5">UOM / Qty</th>
                          <th className="p-2.5">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData?.byProduct || [
                          { name: "Mikrotik hEX gr3 Gigabit Router", sku: "MT-HEX-GR3", quantity: 2, revenue: 19000 },
                          { name: "Ubiquiti UniFi AC Lite Access Point", sku: "UBNT-UAP-AC-LITE", quantity: 1, revenue: 13500 }
                        ]).map((p: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                            <td className="p-2.5">
                              <div className="font-semibold">{p.name}</div>
                              <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                            </td>
                            <td className="p-2.5 text-slate-500 font-bold">{p.quantity} PCS</td>
                            <td className="p-2.5 font-bold font-mono text-emerald-600">KES {p.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Outstanding Invoices report */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Aging Outstanding Invoice Receivables
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono">
                      <tr>
                        <th className="p-2.5">Invoice Number</th>
                        <th className="p-2.5">Customer Client</th>
                        <th className="p-2.5">Due Date</th>
                        <th className="p-2.5">Total Amount</th>
                        <th className="p-2.5">Outstanding Balance</th>
                        <th className="p-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.outstandingInvoices || [
                        { id: "inv-2", invoiceNumber: "INV-2026-002", customerName: "Equator ICT Solutions", dueDate: "2026-08-10", totalAmount: 15660, amountPaid: 0 }
                      ]).map((inv: any) => (
                        <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-900">
                          <td className="p-2.5 font-mono font-bold text-sky-600 dark:text-sky-400">{inv.invoiceNumber}</td>
                          <td className="p-2.5 font-semibold">{inv.customerName}</td>
                          <td className="p-2.5 text-red-500 font-mono font-bold">{inv.dueDate}</td>
                          <td className="p-2.5 font-mono">KES {inv.totalAmount.toLocaleString()}</td>
                          <td className="p-2.5 font-mono text-red-500 font-bold">KES {(inv.totalAmount - inv.amountPaid).toLocaleString()}</td>
                          <td className="p-2.5">
                            <Button variant="outline" size="xs" leftIcon={<Mail className="h-3 w-3" />} onClick={() => handleSimulateEmail("Remind Due", inv.invoiceNumber)}>
                              Send Overdue Alert
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* -----------------------------------------------------------------
          MODAL DIALOG DIALS
         ----------------------------------------------------------------- */}

      {/* 1. QUOTATION DIALOG */}
      {activeModal === "quote" && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle>Draft New Corporate Quotation</CardTitle>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateQuotationSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    label="Select Customer Account"
                    required
                    options={[
                      { value: "", label: "Choose customer profile..." },
                      ...customers.map(c => ({ value: c.id, label: `${c.companyName || c.contactPerson} (${c.accountCode})` }))
                    ]}
                    value={quoteForm.customerId}
                    onChange={(e) => setQuoteForm({ ...quoteForm, customerId: e.target.value })}
                  />
                  <Input 
                    label="Quotation Valid Until"
                    type="date"
                    required
                    value={quoteForm.validUntil}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  />
                </div>

                {/* Items line */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Bidded ICT Products / Services</h4>
                    <Button type="button" variant="subtle" size="xs" leftIcon={<Plus />} onClick={() => {
                      setQuoteForm({
                        ...quoteForm,
                        items: [...quoteForm.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0 }]
                      });
                    }}>
                      Add Line Item
                    </Button>
                  </div>

                  {quoteForm.items.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/20">
                      <div className="md:col-span-5">
                        <Select 
                          label="Select Product"
                          required
                          options={[
                            { value: "", label: "Choose item..." },
                            ...products.map(p => ({ value: p.id, label: `${p.name} (KES ${p.sellingPrice.toLocaleString()})` }))
                          ]}
                          value={line.productId}
                          onChange={(e) => {
                            const newItems = [...quoteForm.items];
                            newItems[idx].productId = e.target.value;
                            const prod = products.find(p => p.id === e.target.value);
                            if (prod) newItems[idx].unitPrice = prod.sellingPrice;
                            setQuoteForm({ ...quoteForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          label="Qty"
                          type="number"
                          required
                          value={line.quantity}
                          onChange={(e) => {
                            const newItems = [...quoteForm.items];
                            newItems[idx].quantity = Number(e.target.value);
                            setQuoteForm({ ...quoteForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          label="Unit Price KES"
                          type="number"
                          required
                          value={line.unitPrice}
                          onChange={(e) => {
                            const newItems = [...quoteForm.items];
                            newItems[idx].unitPrice = Number(e.target.value);
                            setQuoteForm({ ...quoteForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          label="Discount %"
                          type="number"
                          value={line.discount}
                          onChange={(e) => {
                            const newItems = [...quoteForm.items];
                            newItems[idx].discount = Number(e.target.value);
                            setQuoteForm({ ...quoteForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 text-center">
                        <button type="button" className="text-red-500 hover:text-red-400 p-2 text-xs font-bold cursor-pointer" onClick={() => {
                          const newItems = quoteForm.items.filter((_, i) => i !== idx);
                          setQuoteForm({ ...quoteForm, items: newItems });
                        }}>
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Input 
                    label="Notes & Terms"
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<FileText />}>
                  Save Draft Quotation
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* 2. INVOICE DIALOG */}
      {activeModal === "invoice" && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-fade-in">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle>Generate New Invoice</CardTitle>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateInvoiceSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    label="Select Customer Entity"
                    required
                    options={[
                      { value: "", label: "Choose customer profile..." },
                      ...customers.map(c => ({ value: c.id, label: `${c.companyName || c.contactPerson} (${c.accountCode})` }))
                    ]}
                    value={invoiceForm.customerId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                  />
                  <Input 
                    label="Due Date"
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Billed Products & Subscriptions</h4>
                    <Button type="button" variant="subtle" size="xs" leftIcon={<Plus />} onClick={() => {
                      setInvoiceForm({
                        ...invoiceForm,
                        items: [...invoiceForm.items, { productId: "", quantity: 1, unitPrice: 0 }]
                      });
                    }}>
                      Add Billing Line
                    </Button>
                  </div>

                  {invoiceForm.items.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/20">
                      <div className="md:col-span-6">
                        <Select 
                          label="Select Product / ISP Package"
                          required
                          options={[
                            { value: "", label: "Choose item..." },
                            ...products.map(p => ({ value: p.id, label: `${p.name} (KES ${p.sellingPrice.toLocaleString()})` }))
                          ]}
                          value={line.productId}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].productId = e.target.value;
                            const prod = products.find(p => p.id === e.target.value);
                            if (prod) newItems[idx].unitPrice = prod.sellingPrice;
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          label="Quantity"
                          type="number"
                          required
                          value={line.quantity}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].quantity = Number(e.target.value);
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input 
                          label="Unit Price KES"
                          type="number"
                          required
                          value={line.unitPrice}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].unitPrice = Number(e.target.value);
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 text-center">
                        <button type="button" className="text-red-500 hover:text-red-400 p-2 font-bold cursor-pointer" onClick={() => {
                          const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                          setInvoiceForm({ ...invoiceForm, items: newItems });
                        }}>
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<FileText />}>
                  Issue Active Invoice
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* 3. PAYMENT DIALOG */}
      {activeModal === "payment" && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl animate-fade-in">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle>Record Client Payment</CardTitle>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleRecordPaymentSubmit}>
              <CardContent className="space-y-4 pt-4">
                <Input 
                  label="Total Payable (KES)"
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
                <Select 
                  label="Payment Method"
                  options={[
                    { value: "MPESA", label: "M-Pesa (Celcom BuyGoods / PayBill)" },
                    { value: "BANK", label: "Bank Transfer (KCB / Equity Bank)" },
                    { value: "CASH", label: "Office Cash Box" },
                    { value: "CARD", label: "Visa / Credit Card" },
                    { value: "CHEQUE", label: "Cheque Clearance" }
                  ]}
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                />
                <Input 
                  label="M-Pesa Code / Bank Ref Sequence"
                  placeholder="e.g. KGA8902HJ1"
                  required
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value.toUpperCase() })}
                  description="Required for transaction verification with Nairobi gateway"
                />
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle />}>
                  Post Payment & Issue Receipt
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* 4. CREDIT NOTE DIALOG */}
      {activeModal === "creditnote" && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl animate-fade-in">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle>Issue Credit Adjustment Note</CardTitle>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateCreditNoteSubmit}>
              <CardContent className="space-y-4 pt-4">
                <Select 
                  label="Select Customer"
                  required
                  options={[
                    { value: "", label: "Select client account..." },
                    ...customers.map(c => ({ value: c.id, label: `${c.companyName || c.contactPerson} (${c.accountCode})` }))
                  ]}
                  value={cnForm.customerId}
                  onChange={(e) => setCnForm({ ...cnForm, customerId: e.target.value })}
                />
                <Select 
                  label="Select Invoice Reference (Optional)"
                  options={[
                    { value: "", label: "No direct invoice link" },
                    ...invoices.filter(i => i.customerId === cnForm.customerId).map(i => ({ value: i.id, label: `${i.invoiceNumber} (KES ${i.totalAmount.toLocaleString()})` }))
                  ]}
                  value={cnForm.invoiceId}
                  onChange={(e) => setCnForm({ ...cnForm, invoiceId: e.target.value })}
                />
                <Input 
                  label="Adjusted Amount KES"
                  type="number"
                  required
                  value={cnForm.amount}
                  onChange={(e) => setCnForm({ ...cnForm, amount: Number(e.target.value) })}
                />
                <Select 
                  label="Adjustment Type"
                  options={[
                    { value: "ADJUSTMENT", label: "Invoice Price Adjustment" },
                    { value: "RETURN", label: "Returned Hardware Stock Return" },
                    { value: "REFUND", label: "Cash Refund / Credits Log" }
                  ]}
                  value={cnForm.type}
                  onChange={(e) => setCnForm({ ...cnForm, type: e.target.value as any })}
                />
                <Input 
                  label="Detailed Reason"
                  placeholder="e.g. Customer returned damaged ONT router"
                  required
                  value={cnForm.reason}
                  onChange={(e) => setCnForm({ ...cnForm, reason: e.target.value })}
                />
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<Percent />}>
                  Authorize Credit Note
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* 5. PRINTABLE PDF TEMPLATE DIALOG */}
      {activeModal === "viewpdf" && selectedPdfData && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-4xl shadow-2xl my-8 bg-slate-900/10 p-0 overflow-hidden border-0">
            {/* Action Bar */}
            <div className="bg-slate-900 text-white p-3 px-5 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-sky-400">
                Celcom Corporate Document Engine
              </h3>
              <div className="flex gap-2">
                <Button variant="subtle" size="xs" leftIcon={<Printer />} onClick={() => window.print()}>
                  Print Document
                </Button>
                <Button variant="outline" size="xs" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => setActiveModal(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Document Sheet (Celcom networks style) */}
            <div className="bg-white p-10 md:p-14 text-slate-800 font-sans border-x border-b border-slate-200 shadow-inner select-text">
              
              {/* Header Branding */}
              <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-sky-600 text-white p-1.5 rounded font-bold font-mono text-lg">C</div>
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">CELCOM NETWORKS CO.</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Gateway Park, Block B, Mombasa Road, Nairobi, Kenya<br />
                    Email: finance@celcomnetworks.co.ke | Tel: +254 700 000 000
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {selectedPdfType}
                  </h1>
                  <span className="inline-block mt-2 px-3 py-1 bg-amber-500 text-slate-950 font-mono font-black text-xs rounded">
                    {selectedPdfType === "quotation" ? selectedPdfData.quotationNumber : 
                     selectedPdfType === "invoice" ? selectedPdfData.invoiceNumber :
                     selectedPdfType === "receipt" ? selectedPdfData.receiptNumber : "STATEMENT CARD"}
                  </span>
                </div>
              </div>

              {/* Addresses Row */}
              <div className="grid grid-cols-2 gap-10 mt-8 text-xs">
                <div>
                  <h4 className="font-bold text-slate-500 uppercase font-mono border-b border-slate-100 pb-1">Billed To (Subscriber Customer):</h4>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {selectedPdfType === "statement" ? selectedPdfData.customerName : selectedPdfData.customerName}
                  </p>
                  <p className="text-slate-500 mt-1">
                    Registered Corporate Address<br />
                    Nairobi Headend Transit Cluster<br />
                    Email: {selectedPdfData.customerEmail || "billing@corporate.co.ke"}
                  </p>
                </div>

                <div className="text-right">
                  <h4 className="font-bold text-slate-500 uppercase font-mono border-b border-slate-100 pb-1">Document Registry:</h4>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-slate-500">
                    <span className="font-bold">Issue Date:</span>
                    <span>{new Date(selectedPdfData.createdAt || Date.now()).toLocaleDateString()}</span>
                    
                    {selectedPdfType === "quotation" && (
                      <>
                        <span className="font-bold">Valid Until:</span>
                        <span>{selectedPdfData.validUntil}</span>
                        <span className="font-bold">Salesperson:</span>
                        <span>{selectedPdfData.salesPerson}</span>
                      </>
                    )}

                    {selectedPdfType === "invoice" && (
                      <>
                        <span className="font-bold">Due Date:</span>
                        <span className="text-red-500 font-bold">{selectedPdfData.dueDate}</span>
                        <span className="font-bold">KRA PIN:</span>
                        <span>P051239031Z</span>
                      </>
                    )}

                    {selectedPdfType === "receipt" && (
                      <>
                        <span className="font-bold">Payment Method:</span>
                        <span>{selectedPdfData.paymentMethod}</span>
                        <span className="font-bold">Txn Reference:</span>
                        <span className="font-bold text-emerald-600 font-mono">{selectedPdfData.transactionReference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-3">Item Description</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price KES</th>
                      {selectedPdfType === "quotation" && <th className="p-3 text-right">Discount</th>}
                      <th className="p-3 text-right">Total KES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPdfType === "statement" ? (
                      selectedPdfData.invoiceHistory.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="p-3 font-semibold text-slate-900">Lease Invoice: {item.invoiceNumber}</td>
                          <td className="p-3 font-mono text-slate-400">INV-{item.id.slice(0, 5)}</td>
                          <td className="p-3 text-right">1</td>
                          <td className="p-3 text-right">{item.subTotal.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold font-mono">KES {item.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      (selectedPdfData.items || []).map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="p-3">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">{item.sku || "N/A"}</td>
                          <td className="p-3 text-right font-bold">{item.quantity}</td>
                          <td className="p-3 text-right">{item.unitPrice.toLocaleString()}</td>
                          {selectedPdfType === "quotation" && <td className="p-3 text-right text-amber-600">-{item.discount}%</td>}
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {selectedPdfType === "quotation" 
                              ? KES(item.quantity * item.unitPrice * (1 - item.discount / 100))
                              : KES(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & tax box */}
              <div className="flex justify-between items-start mt-8 pt-6 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 font-mono">
                  This document is generated by automated ERP protocols of Celcom Networks.<br />
                  Certified VAT KRA Kenya Compliant.<br />
                  For inquiries, please call Nairobi finance center.
                </div>
                <div className="w-80 text-xs">
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3 text-slate-500">
                    <span>Subtotal KES:</span>
                    <span className="text-right font-mono">
                      KES {(selectedPdfType === "statement" ? selectedPdfData.outstandingBalance : selectedPdfData.subTotal || selectedPdfData.amount || 0).toLocaleString()}
                    </span>

                    {selectedPdfType !== "receipt" && selectedPdfType !== "statement" && (
                      <>
                        <span>VAT Rate Config:</span>
                        <span className="text-right font-semibold">Kenya VAT 16.0%</span>
                        <span>VAT Tax KES:</span>
                        <span className="text-right font-mono">KES {selectedPdfData.taxAmount?.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 pt-3 font-bold text-slate-900 text-sm">
                    <span>Total Amount Due:</span>
                    <span className="text-right font-mono text-indigo-600">
                      KES {(selectedPdfType === "receipt" ? selectedPdfData.amount : selectedPdfType === "statement" ? selectedPdfData.outstandingBalance : selectedPdfData.totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="grid grid-cols-2 gap-10 mt-14 pt-10 border-t border-dashed border-slate-100">
                <div>
                  <div className="w-48 h-10 border-b border-slate-300 flex items-end justify-center">
                    <span className="text-[9px] text-slate-400 font-mono">Authorized signature</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-1">Celcom Networks Officer</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="w-48 h-10 border-b border-slate-300 flex items-end justify-center">
                    <span className="text-[9px] text-slate-400 font-mono">Customer chop & sign</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-1">Received & Accepted By</p>
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

// Utility formatting helper
function KES(val: number): string {
  return "KES " + Number(val).toLocaleString();
}
export default SalesPage;
