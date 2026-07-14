import React, { useState, useEffect } from "react";
import { 
  Building2, ShoppingCart, ShieldCheck, FileSpreadsheet, PackageCheck, Receipt, DollarSign, BarChart3,
  RefreshCw, PlusCircle, ArrowRight, Truck, Info, Settings, FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { useNotifications } from "../ui/Notifications";

// Import custom sub-tabs
import { SupplierTab } from "./components/SupplierTab";
import { PurchaseRequestTab } from "./components/PurchaseRequestTab";
import { ApprovalTab } from "./components/ApprovalTab";
import { LPOTab } from "./components/LPOTab";
import { POTab } from "./components/POTab";
import { GRNTab } from "./components/GRNTab";
import { BillingTab } from "./components/BillingTab";
import { ReportsTab } from "./components/ReportsTab";

export function ProcurementPage() {
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<"dashboard" | "suppliers" | "requests" | "approvals" | "lpos" | "orders" | "grns" | "billing" | "reports">("dashboard");

  // Server state caches
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [lpos, setLpos] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      };

      // Concurrent fetch for high execution efficiency
      const [
        resSuppliers, resRequests, resLpos, resOrders, resGrns, resInvoices, resPayments, resReports, resWarehouses, resProducts
      ] = await Promise.all([
        fetch("/api/v1/procurement/suppliers", { headers }),
        fetch("/api/v1/procurement/requests", { headers }),
        fetch("/api/v1/procurement/lpos", { headers }),
        fetch("/api/v1/procurement/orders", { headers }),
        fetch("/api/v1/procurement/grns", { headers }),
        fetch("/api/v1/procurement/invoices", { headers }),
        fetch("/api/v1/procurement/payments", { headers }),
        fetch("/api/v1/procurement/reports", { headers }),
        fetch("/api/v1/inventory/warehouses", { headers }),
        fetch("/api/v1/inventory/products", { headers })
      ]);

      const [
        dSuppliers, dRequests, dLpos, dOrders, dGrns, dInvoices, dPayments, dReports, dWarehouses, dProducts
      ] = await Promise.all([
        resSuppliers.json(), resRequests.json(), resLpos.json(), resOrders.json(), resGrns.json(), resInvoices.json(), resPayments.json(), resReports.json(), resWarehouses.json(), resProducts.json()
      ]);

      if (dSuppliers.success) setSuppliers(dSuppliers.suppliers);
      if (dRequests.success) setRequests(dRequests.purchaseRequests);
      if (dLpos.success) setLpos(dLpos.lpos);
      if (dOrders.success) setPurchaseOrders(dOrders.purchaseOrders);
      if (dGrns.success) setGrns(dGrns.grns);
      if (dInvoices.success) setInvoices(dInvoices.invoices);
      if (dPayments.success) setPayments(dPayments.payments);
      if (dReports.success) setReportData(dReports.reports);
      if (dWarehouses.success) setWarehouses(dWarehouses.warehouses);
      if (dProducts.success) setProducts(dProducts.products);

    } catch (err: any) {
      showNotification("Fetch Error", "Failed to refresh procurement ledger caches.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCustomNotification = (title: string, message: string, type: "success" | "error" | "info") => {
    showNotification(title, message, type);
  };

  // Dashboard Aggregations
  const totalInvoicedClaims = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalSettledPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const netOutstandingClaims = totalInvoicedClaims - totalSettledPayments;

  const pendingPRCount = requests.filter(r => r.status === "SUBMITTED" || r.status === "APPROVED").length;
  const dispatchPOCount = purchaseOrders.filter(po => po.deliveryStatus === "PENDING" || po.deliveryStatus === "SHIPPED").length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
            <Building2 size={14} className="text-amber-500" />
            Celcom Networks ERP Corporate
          </div>
          <h1 className="text-2xl font-black text-gray-900 font-sans mt-1">Sourcing & Procurement Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automate supply demand acquisition, trace freight shipments, tag serialized hardware, and reconcile trade payables.</p>
        </div>
        <div className="flex gap-2">
          <Button id="btn-refresh-proc" onClick={fetchAllData} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Ledger
          </Button>
          <Button id="btn-quick-pr" onClick={() => setActiveTab("requests")} variant="primary" className="bg-blue-900 hover:bg-blue-950 flex items-center gap-1">
            <PlusCircle size={16} className="text-amber-500" /> Draft Request
          </Button>
        </div>
      </div>

      {/* CORE NAVIGATION BAR */}
      <div className="flex overflow-x-auto bg-white p-1 rounded-xl border border-gray-100 shadow-sm whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "dashboard" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Overview Dash
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "suppliers" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Suppliers Directory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "requests" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Purchase Demands (PR)
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "approvals" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Approval Gates
          {pendingPRCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
              {pendingPRCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("lpos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "lpos" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Local Orders (LPO)
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "orders" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Purchase Orders (PO)
        </button>
        <button
          onClick={() => setActiveTab("grns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "grns" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Warehouse Loading (GRN)
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "billing" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          AP Ledger & Bills
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "reports" ? "bg-blue-900 text-white font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          Spend Analytics
        </button>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      <div className="transition duration-150">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Bento Stat widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card id="widget-active-vendors">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Compliance Partners</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{suppliers.length} Vendors</h3>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">● Certified & Audit Checked</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full text-blue-900">
                    <Building2 size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card id="widget-pending-prs">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Approval Backlog</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{pendingPRCount} Demands</h3>
                    <span className="text-[10px] text-amber-600 block mt-0.5">● Routing in workflow</span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                    <ShoppingCart size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card id="widget-active-pos">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dispatched Shipments</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{dispatchPOCount} Orders</h3>
                    <span className="text-[10px] text-blue-600 block mt-0.5">● Expected on offloading dock</span>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-full text-indigo-500">
                    <Truck size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card id="widget-net-outstanding">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trade Creditors (AP)</span>
                    <h3 className="text-2xl font-black text-red-600 font-mono mt-1 font-bold">KES {netOutstandingClaims.toLocaleString()}</h3>
                    <span className="text-[10px] text-red-500 block mt-0.5">● Active outstanding debt</span>
                  </div>
                  <div className="bg-red-50 p-3 rounded-full text-red-500">
                    <DollarSign size={22} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Procurement Visual Workflow Pipeline */}
            <Card id="workflow-pipeline-card">
              <CardHeader className="bg-blue-900 text-white rounded-t-xl border-b border-blue-950">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">8-Step Commercial Procurement Pipeline</CardTitle>
                    <CardDescription className="text-blue-200">The audited, compliant route matching Celcom Networks structural protocols.</CardDescription>
                  </div>
                  <span className="bg-amber-500 text-blue-950 font-extrabold px-3 py-1 rounded text-xs">Compliance Engine Active</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                  {[
                    { step: "1. Demand", title: "Dept Request", desc: "Staff declares need", icon: <ShoppingCart size={18} />, active: requests.length > 0 },
                    { step: "2. Draft", title: "Purchase Req", desc: "Specs & items input", icon: <FileSpreadsheet size={18} />, active: requests.some(r => r.status === "SUBMITTED") },
                    { step: "3. Gate", title: "Approvals", desc: "Multi-tier audit", icon: <ShieldCheck size={18} />, active: requests.some(r => r.status === "APPROVED") },
                    { step: "4. Commitment", title: "LPO Bind", desc: "Contract created", icon: <FileText size={18} />, active: lpos.length > 0 },
                    { step: "5. Dispatch", title: "Purchase Order", desc: "Vendor dispatched", icon: <Truck size={18} />, active: purchaseOrders.length > 0 },
                    { step: "6. Dock", title: "GRN Reception", desc: "Inventory updated", icon: <PackageCheck size={18} />, active: grns.length > 0 },
                    { step: "7. AP Claim", title: "Supplier Invoice", desc: "Bill logged", icon: <Receipt size={18} />, active: invoices.length > 0 },
                    { step: "8. Settlement", title: "Clearing Payment", desc: "AP accounts settled", icon: <DollarSign size={18} />, active: payments.length > 0 }
                  ].map((st, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (idx === 0 || idx === 1) setActiveTab("requests");
                        else if (idx === 2) setActiveTab("approvals");
                        else if (idx === 3) setActiveTab("lpos");
                        else if (idx === 4) setActiveTab("orders");
                        else if (idx === 5) setActiveTab("grns");
                        else if (idx === 6 || idx === 7) setActiveTab("billing");
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition duration-250 flex flex-col items-center justify-between h-40 ${
                        st.active 
                          ? "bg-blue-50/50 border-blue-200 text-blue-950 shadow-sm hover:border-amber-500 hover:bg-amber-50/10" 
                          : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100/50"
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider font-bold mb-1 block">
                        {st.step}
                      </div>
                      <div className={`p-2 rounded-full mb-2 shrink-0 ${st.active ? "bg-blue-900 text-amber-400" : "bg-gray-200 text-gray-400"}`}>
                        {st.icon}
                      </div>
                      <div className="font-bold text-xs leading-tight">{st.title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-snug">{st.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Two Column details: Recent logs & Quick links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left columns: Recent actions */}
              <Card id="proc-recent-logs-card" className="lg:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Procurement Operations</CardTitle>
                  <CardDescription>Live feed of requests, receipts, and accounts payable settlements.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
                    {grns.slice(0, 4).map((g) => (
                      <div key={g.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition">
                        <div>
                          <div className="text-xs font-semibold text-gray-900">
                            Loaded shipment <span className="font-mono text-amber-600 font-bold">{g.grnNumber}</span> into warehouse
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Supplier: {g.supplierName} | Stored: {g.warehouseName} | Received By: {g.receivedBy}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{g.receivedDate}</span>
                      </div>
                    ))}
                    {requests.slice(0, 4).map((r) => (
                      <div key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition">
                        <div>
                          <div className="text-xs font-semibold text-gray-900">
                            Purchase request <span className="font-mono text-indigo-600 font-bold">{r.requestNo}</span> status is {r.status}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Department: {r.department} | Reason: "{r.reason}"
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{r.date}</span>
                      </div>
                    ))}
                    {grns.length === 0 && requests.length === 0 && (
                      <p className="p-8 text-center text-xs text-gray-400 italic">No historical activities found in ledger.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right column: Quick actions and tutorials */}
              <Card id="proc-quick-links-card" className="shadow-sm">
                <CardHeader>
                  <CardTitle>Audited Quick Actions</CardTitle>
                  <CardDescription>Direct navigation and workflow tools.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button 
                    onClick={() => { setActiveTab("requests"); }} 
                    className="w-full p-3 bg-gray-50 hover:bg-amber-50/40 hover:border-amber-300 transition text-left rounded-lg border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800"
                  >
                    <span>1. Draft Purchase demand (PR)</span>
                    <ArrowRight size={14} className="text-amber-500" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("approvals"); }} 
                    className="w-full p-3 bg-gray-50 hover:bg-amber-50/40 hover:border-amber-300 transition text-left rounded-lg border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800"
                  >
                    <span>2. Inspect multi-stage approvals queue</span>
                    <ArrowRight size={14} className="text-amber-500" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("grns"); }} 
                    className="w-full p-3 bg-gray-50 hover:bg-amber-50/40 hover:border-amber-300 transition text-left rounded-lg border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800"
                  >
                    <span>3. Log dock arrival & serials (GRN)</span>
                    <ArrowRight size={14} className="text-amber-500" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("billing"); }} 
                    className="w-full p-3 bg-gray-50 hover:bg-amber-50/40 hover:border-amber-300 transition text-left rounded-lg border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800"
                  >
                    <span>4. Record vendor claim invoice & payments</span>
                    <ArrowRight size={14} className="text-amber-500" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "suppliers" && (
          <SupplierTab 
            suppliers={suppliers} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "requests" && (
          <PurchaseRequestTab 
            requests={requests} 
            products={products} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "approvals" && (
          <ApprovalTab 
            requests={requests} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "lpos" && (
          <LPOTab 
            lpos={lpos} 
            suppliers={suppliers} 
            requests={requests} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "orders" && (
          <POTab 
            purchaseOrders={purchaseOrders} 
            lpos={lpos} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "grns" && (
          <GRNTab 
            grns={grns} 
            purchaseOrders={purchaseOrders} 
            warehouses={warehouses} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "billing" && (
          <BillingTab 
            invoices={invoices} 
            payments={payments} 
            suppliers={suppliers} 
            grns={grns} 
            onRefresh={fetchAllData} 
            onShowNotification={handleCustomNotification} 
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab 
            reportData={reportData} 
            invoices={invoices} 
          />
        )}
      </div>
    </div>
  );
}
