import React, { useState, useMemo } from "react";
import { 
  Radio, 
  BookOpen, 
  Layers, 
  Sliders, 
  Bell, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Info,
  ChevronRight,
  Plus,
  RefreshCw,
  FolderSync,
  Sparkles,
  Wifi,
  DollarSign,
  TrendingUp,
  Ticket
} from "lucide-react";

// Reusable Components Imports
import { ThemeProvider, useTheme } from "./components/ui/ThemeProvider";
import { NotificationProvider, useNotifications } from "./components/ui/Notifications";
import { DashboardLayout } from "./components/ui/DashboardLayout";
import { Button } from "./components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/Card";
import { Input, Select, Textarea, Checkbox } from "./components/ui/Input";
import { Table, Column } from "./components/ui/Table";
import { Modal } from "./components/ui/Modal";
import { Charts } from "./components/ui/Charts";
import { Pagination } from "./components/ui/Pagination";
import { EmptyState } from "./components/ui/EmptyState";
import { LoadingScreen } from "./components/ui/LoadingScreen";

// Authentication Module Imports
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { UserProfilePage } from "./components/auth/UserProfilePage";
import { AdminPage } from "./components/admin/AdminPage";
import { CRMPage } from "./components/crm/CRMPage";
import { InventoryPage } from "./components/inventory/InventoryPage";
import { SalesPage } from "./components/sales/SalesPage";
import { ProcurementPage } from "./components/procurement/ProcurementPage";
import { ISPPage } from "./components/isp/ISPPage";
import { ProjectsPage } from "./components/projects/ProjectsPage";
import { SupportPage } from "./components/support/SupportPage";
import AnalyticsDashboard from "./components/analytics/AnalyticsDashboard";
import IntegrationsDashboard from "./components/integrations/IntegrationsDashboard";

// -----------------------------------------------------------------
// MOCK DATA STRUCTURES FOR INTERACTIVE DESIGN PLAYGROUND
// -----------------------------------------------------------------

interface Subscriber {
  id: string;
  name: string;
  email: string;
  pppoeUsername: string;
  ontMac: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  balanceKES: number;
}

const INITIAL_SUBSCRIBERS: Subscriber[] = [
  { id: "SUB-101", name: "Alpha Telecomm Ltd", email: "noc@alphatel.co.ke", pppoeUsername: "cel_alphatel_gpon", ontMac: "A4:3C:D0:E1:92:BF", plan: "Celcom Corporate 100Mbps", status: "ACTIVE", balanceKES: 45000 },
  { id: "SUB-102", name: "Kariuki Kamau & Partners", email: "kamau@kpartners.co.ke", pppoeUsername: "cel_kamau_partners", ontMac: "D0:C5:F3:82:11:AB", plan: "Celcom Business 30Mbps", status: "ACTIVE", balanceKES: 0 },
  { id: "SUB-103", name: "Naivasha Flower Alliance", email: "billing@naivashaflowers.com", pppoeUsername: "cel_naivasha_gpon", ontMac: "00:E0:4C:68:01:12", plan: "Celcom Dedicated 200Mbps", status: "SUSPENDED", balanceKES: 125000 },
  { id: "SUB-104", name: "Zainab Fatuma", email: "zainab.fat@gmail.com", pppoeUsername: "cel_zainab_home", ontMac: "54:04:A6:32:88:FF", plan: "Celcom Home 15Mbps", status: "ACTIVE", balanceKES: 3500 },
  { id: "SUB-105", name: "Mombasa Shipping Terminal", email: "ops@mombasaport.co.ke", pppoeUsername: "cel_msa_port_gpon", ontMac: "FC:7F:F1:C9:22:90", plan: "Celcom Dedicated 50Mbps", status: "TERMINATED", balanceKES: 0 },
  { id: "SUB-106", name: "Safaricom Transit Node 4", email: "interconnect@safaricom.co.ke", pppoeUsername: "cel_transit_safaricom", ontMac: "E4:8D:8C:F3:11:23", plan: "Celcom Transit 1Gbps", status: "ACTIVE", balanceKES: 980000 },
  { id: "SUB-107", name: "Nairobi Eye Clinic", email: "info@naroibieye.co.ke", pppoeUsername: "cel_eye_clinic", ontMac: "00:15:90:94:F1:C0", plan: "Celcom Business 50Mbps", status: "ACTIVE", balanceKES: 12000 }
];

const ANALYTICS_DATA = [
  { name: "Jan", subscribers: 1200, revenueKES: 12000000, latencyMs: 2.2 },
  { name: "Feb", subscribers: 1350, revenueKES: 13900000, latencyMs: 2.1 },
  { name: "Mar", subscribers: 1540, revenueKES: 15800000, latencyMs: 2.3 },
  { name: "Apr", subscribers: 1810, revenueKES: 18200000, latencyMs: 1.9 },
  { name: "May", subscribers: 2100, revenueKES: 22100000, latencyMs: 1.8 },
  { name: "Jun", subscribers: 2450, revenueKES: 25600000, latencyMs: 1.7 },
  { name: "Jul", subscribers: 2890, revenueKES: 29800000, latencyMs: 2.0 }
];

// -----------------------------------------------------------------
// CORE PLAYGROUND RENDER CONTROLLER
// -----------------------------------------------------------------

function DesignSystemPlayground() {
  const { showNotification } = useNotifications();

  // Navigation Panel Routing simulation state
  const [activeNavId, setActiveNavId] = useState<string>("dashboard");

  // State controls for component demos
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [forceFullLoader, setForceFullLoader] = useState(false);

  // Table parameters
  const [subscribers, setSubscribers] = useState<Subscriber[]>(INITIAL_SUBSCRIBERS);
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // New Subscriber Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pppoeUsername: "",
    ontMac: "",
    plan: "Celcom Home 15Mbps",
    balanceKES: "",
    terms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Trigger full-page load simulator
  const triggerFullPageLoad = () => {
    setForceFullLoader(true);
    setTimeout(() => {
      setForceFullLoader(false);
      showNotification("Systems Connected", "Relational clusters synchronizing successfully with GPON headends.", "success");
    }, 1800);
  };

  // Toast alarm action triggers
  const triggerToast = (type: "success" | "error" | "info" | "warning") => {
    const titles = {
      success: "Database Transaction Written",
      error: "Kenyan statutory KRA KES Calculation Failed",
      info: "GPON Node Scheduled Maintenance",
      warning: "OLT Fiber Signal Degradation Alert"
    };
    const messages = {
      success: "Ledger credit records mapped successfully to general accounts journal entries.",
      error: "VAT 16.0% input string mismatch. Check numeric parsing configurations.",
      info: "Nairobi West Ring OLT scheduled for optics firmware upgrades at 03:00 UTC.",
      warning: "Optical attenuation at Node NBO-GPON-04 reported -27.8dBm (SLA threshold limit -25dBm)."
    };
    showNotification(titles[type], messages[type], type);
  };

  // Table sorting logic
  const handleSort = (key: string) => {
    const isAsc = sortColumn === key && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortColumn(key);
  };

  // Filtering & Pagination Calculations
  const filteredSubscribers = useMemo(() => {
    if (showEmptyState) return [];
    return subscribers.filter(sub => {
      const matchText = searchQuery.toLowerCase();
      return (
        sub.name.toLowerCase().includes(matchText) ||
        sub.pppoeUsername.toLowerCase().includes(matchText) ||
        sub.ontMac.toLowerCase().includes(matchText) ||
        sub.plan.toLowerCase().includes(matchText) ||
        sub.id.toLowerCase().includes(matchText)
      );
    });
  }, [subscribers, searchQuery, showEmptyState]);

  const sortedSubscribers = useMemo(() => {
    const sorted = [...filteredSubscribers];
    sorted.sort((a, b) => {
      let valA = (a as any)[sortColumn];
      let valB = (b as any)[sortColumn];
      if (typeof valA === "string") {
        return sortDirection === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredSubscribers, sortColumn, sortDirection]);

  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedSubscribers.slice(start, start + rowsPerPage);
  }, [sortedSubscribers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedSubscribers.length / rowsPerPage);

  // Form submission handler
  const handleCreateSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Subscriber Legal Corporate Name is required.";
    if (!formData.email.trim() || !formData.email.includes("@")) errors.email = "Valid administrative Email is required.";
    if (!formData.pppoeUsername.trim()) errors.pppoeUsername = "PPPoE account routing ID is required.";
    if (!formData.ontMac.trim() || !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.ontMac)) {
      errors.ontMac = "Must enter a valid hex ONT physical MAC address (e.g. AA:BB:CC:DD:EE:FF).";
    }
    if (!formData.terms) errors.terms = "You must verify compliance with Communications Authority of Kenya guidelines.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showNotification("Form Validation Rejected", "Please resolve errors indicated in the billing setup.", "error");
      return;
    }

    setFormErrors({});
    const newSub: Subscriber = {
      id: `SUB-${100 + subscribers.length + 1}`,
      name: formData.name,
      email: formData.email,
      pppoeUsername: formData.pppoeUsername,
      ontMac: formData.ontMac.toUpperCase(),
      plan: formData.plan,
      status: "ACTIVE",
      balanceKES: parseFloat(formData.balanceKES) || 0
    };

    setSubscribers((prev) => [newSub, ...prev]);
    showNotification("Subscriber Activated", `${newSub.name} was successfully registered on PPPoE server profiles.`, "success");
    
    // Clear form and close modal
    setFormData({
      name: "",
      email: "",
      pppoeUsername: "",
      ontMac: "",
      plan: "Celcom Home 15Mbps",
      balanceKES: "",
      terms: false
    });
    setIsModalOpen(false);
  };

  // Dynamic breadcrumb mapping based on navigation ID
  const breadcrumbItems = useMemo(() => {
    const base = [{ label: "Operations Hub" }];
    if (activeNavId === "subscribers") return [...base, { label: "GPON Subscriber Roster" }];
    if (activeNavId === "projects") return [...base, { label: "Projects & Technical Deployments" }];
    if (activeNavId === "support") return [...base, { label: "Service Desk & Customer Support" }];
    if (activeNavId === "ledgers") return [...base, { label: "General Accounts Ledgers" }];
    if (activeNavId === "billing") return [...base, { label: "Revenue & Billing" }];
    if (activeNavId === "payroll") return [...base, { label: "Statutory Payroll Ledger" }];
    if (activeNavId === "tickets") return [...base, { label: "Support Ticketing & SLA" }];
    if (activeNavId === "reports") return [...base, { label: "Reports Console" }];
    if (activeNavId === "integrations") return [...base, { label: "External Integrations" }];
    if (activeNavId === "profile") return [...base, { label: "Staff Profile" }];
    if (activeNavId === "admin") return [...base, { label: "Administration Panel" }];
    if (activeNavId === "crm") return [...base, { label: "Customer Relations Management (CRM)" }];
    if (activeNavId === "inventory") return [...base, { label: "Inventory & Warehousing" }];
    if (activeNavId === "procurement") return [...base, { label: "Procurement & Sourcing" }];
    return base;
  }, [activeNavId]);

  // Column definitions for the interactive Table
  const tableColumns: Column<Subscriber>[] = [
    { key: "id", header: "Subscriber ID", sortable: true },
    { key: "name", header: "Corporate Entity Name", sortable: true, render: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span>
        <span className="text-[10px] text-slate-400 font-sans">{row.email}</span>
      </div>
    )},
    { key: "pppoeUsername", header: "PPPoE Routing User", sortable: true, render: (row) => (
      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs">
        {row.pppoeUsername}
      </span>
    )},
    { key: "ontMac", header: "ONT Mac Address", render: (row) => (
      <span className="font-mono text-slate-500">{row.ontMac}</span>
    )},
    { key: "plan", header: "Bandwidth Tier" },
    { key: "status", header: "SLA Status", sortable: true, render: (row) => {
      const colors = {
        ACTIVE: "bg-emerald-950 text-emerald-400 border-emerald-900/50",
        SUSPENDED: "bg-amber-950 text-amber-400 border-amber-900/50",
        TERMINATED: "bg-red-950 text-red-400 border-red-900/50"
      };
      return (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${colors[row.status]}`}>
          {row.status}
        </span>
      );
    }},
    { key: "balanceKES", header: "Outstanding (KES)", sortable: true, render: (row) => (
      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
        KES {row.balanceKES.toLocaleString()}
      </span>
    )}
  ];

  return (
    <>
      {/* Absolute Full-Screen Loading Mask Simulator */}
      {forceFullLoader && <LoadingScreen type="full" />}

      <DashboardLayout
        activeNavId={activeNavId}
        onNavChange={setActiveNavId}
        breadcrumbs={breadcrumbItems}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {activeNavId === "profile" ? (
          <UserProfilePage />
        ) : activeNavId === "admin" ? (
          <AdminPage />
        ) : activeNavId === "projects" ? (
          <ProjectsPage />
        ) : activeNavId === "support" || activeNavId === "tickets" ? (
          <SupportPage />
        ) : activeNavId === "crm" ? (
          <CRMPage />
        ) : activeNavId === "inventory" ? (
          <InventoryPage />
        ) : activeNavId === "procurement" ? (
          <ProcurementPage />
        ) : activeNavId === "billing" ? (
          <SalesPage />
        ) : activeNavId === "subscribers" ? (
          <ISPPage />
        ) : activeNavId === "reports" || activeNavId === "ledgers" ? (
          <AnalyticsDashboard />
        ) : activeNavId === "integrations" ? (
          <IntegrationsDashboard />
        ) : (
          <div className="space-y-6">
          
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-5 px-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500" />
                Celcom Networks UI System Kit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A highly customizable, high-density ERP template workspace built natively with Tailwind v4, React 19, and Recharts.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
              <Button variant="subtle" size="sm" leftIcon={<RefreshCw />} onClick={triggerFullPageLoad}>
                Simulate System Init
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => setIsModalOpen(true)}>
                Provision Subscriber
              </Button>
            </div>
          </div>

          {/* Core grid blocks mapping individual panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ----------------- LEFT COMPONENT COL: Forms, Buttons, Alerts ----------------- */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* COMPONENT 1: Interactive Alert triggers */}
              <Card borderAccent>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-sky-500" />
                    Alert Toaster Trigger Bar
                  </CardTitle>
                  <CardDescription>Click to invoke real, sliding toast notifications across the screen stack.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2.5">
                  <Button variant="outline" size="sm" className="w-full text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5" onClick={() => triggerToast("success")} leftIcon={<CheckCircle className="h-3.5 w-3.5" />}>
                    Success Toast
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/5" onClick={() => triggerToast("error")} leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}>
                    Error Toast
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-sky-500 hover:text-sky-400 hover:bg-sky-500/5" onClick={() => triggerToast("info")} leftIcon={<Info className="h-3.5 w-3.5" />}>
                    Info Toast
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-amber-500 hover:text-amber-400 hover:bg-amber-500/5" onClick={() => triggerToast("warning")} leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}>
                    Warning Toast
                  </Button>
                </CardContent>
              </Card>

              {/* COMPONENT 2: Form Input Fields family demo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-sky-500" />
                    ERP Form Input Primitives
                  </CardTitle>
                  <CardDescription>Dense form states with labels, requirements, and formatting rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    label="Corporate Client Legal Name" 
                    placeholder="Enter legal trading name" 
                    required 
                    description="As registered at Registrar of Companies" 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Withholding Tax Code" 
                      defaultValue="WHT-KRA-04" 
                      disabled 
                      description="Read-only static parameter" 
                    />
                    <Select 
                      label="GPON Allocation Port" 
                      options={[
                        { value: "gpon-01", label: "GPON Port 1 (Westlands)" },
                        { value: "gpon-02", label: "GPON Port 2 (Nairobi Central)" },
                        { value: "gpon-03", label: "GPON Port 3 (Industrial Area)" }
                      ]}
                      description="Assigned OLT physical node"
                    />
                  </div>
                  <Textarea 
                    label="GPON Physical Core Diagnostics Notes" 
                    placeholder="Record fiber splicer optical feedback or ODF coordinates..." 
                  />
                  <Checkbox 
                    label="Kenyan statutory compliance verification" 
                    description="Verify connection adheres to KRA, PAYE, and CA billing regulations." 
                  />
                </CardContent>
              </Card>

              {/* COMPONENT 3: Standard Trigger Button weights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-sky-500" />
                    Standard Button Library
                  </CardTitle>
                  <CardDescription>Reusable triggers with varying focus weighting states.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm">Primary SM</Button>
                    <Button variant="secondary" size="sm">Secondary SM</Button>
                    <Button variant="outline" size="sm">Outline SM</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="subtle" size="md">Subtle MD</Button>
                    <Button variant="ghost" size="md">Ghost MD</Button>
                    <Button variant="destructive" size="md">Destructive MD</Button>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <Button 
                      variant="primary" 
                      isLoading={btnLoading} 
                      onClick={() => {
                        setBtnLoading(true);
                        setTimeout(() => setBtnLoading(false), 2000);
                      }}
                      className="w-full"
                    >
                      Click to Test Loading State
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* ----------------- RIGHT COMPONENT COL: Table grid, Charts ----------------- */}
            <div className="lg:col-span-8 space-y-6">

              {/* COMPONENT 4: Analytical Recharts plots */}
              <Card borderAccent>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-sky-500" />
                      Dynamic Revenue & Capacity KPIs
                    </CardTitle>
                    <CardDescription>Live reporting showing active GPON bandwidth performance metrics and billings in KES.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 font-sans">Active Subscribers Growth</p>
                      <Charts 
                        type="area" 
                        data={ANALYTICS_DATA} 
                        metrics={[{ key: "subscribers", color: "#0ea5e9", label: "Total Subscribers" }]}
                        height={180}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 font-sans">Corporate Billing Revenue (KES)</p>
                      <Charts 
                        type="bar" 
                        data={ANALYTICS_DATA} 
                        metrics={[{ key: "revenueKES", color: "#1e3a8a", label: "Gross Receipts (KES)" }]}
                        height={180}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* COMPONENT 5: High Density Database Subscriber Table Grid */}
              <div className="space-y-3.5">
                
                {/* Search Bar, loading/clear triggers */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-sky-500 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                      GPON Optical Node Roster
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Checkbox 
                      label="Simulate Empty Grid" 
                      checked={showEmptyState} 
                      onChange={(e: any) => {
                        setShowEmptyState(e.target.checked);
                        setCurrentPage(1);
                      }} 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      isLoading={tableLoading} 
                      onClick={() => {
                        setTableLoading(true);
                        setTimeout(() => setTableLoading(false), 1500);
                      }}
                      leftIcon={<FolderSync className="h-3 w-3" />}
                    >
                      Sync OLT Node
                    </Button>
                  </div>
                </div>

                {/* Reusable Data Grid */}
                <Table 
                  columns={tableColumns} 
                  data={paginatedSubscribers} 
                  isLoading={tableLoading} 
                  sortColumn={sortColumn} 
                  sortDirection={sortDirection} 
                  onSort={handleSort}
                  emptyMessage="GPON optical database cluster currently holds no records matching filters."
                />

                {/* Reusable Pagination controls */}
                {!showEmptyState && (
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    totalRecords={filteredSubscribers.length} 
                    rowsPerPage={rowsPerPage} 
                    onPageChange={setCurrentPage} 
                    onRowsPerPageChange={setRowsPerPage} 
                  />
                )}

              </div>

            </div>

          </div>

          {/* ----------------- LOWER CARDS: Skeletons, Loaders, Empty states demos ----------------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Skeletal loader demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin-slow text-sky-500" />
                  Inline Skeletons
                </CardTitle>
                <CardDescription>Mock loader skeletons during asynchronous DB requests.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <LoadingScreen type="skeleton" rows={2} />
              </CardContent>
            </Card>

            {/* Empty state presentation */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  Clean Empty Ledger State representation
                </CardTitle>
                <CardDescription>Clean structural outline shown when a data folder query returns zero records.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState 
                  title="Withholding tax statements empty" 
                  description="KRA compliance invoices for the quarter July-Sep 2026 have not been posted to the general double-entry ledgers." 
                  actionLabel="Create Ledger Post"
                  onAction={() => setIsModalOpen(true)}
                />
              </CardContent>
            </Card>

          </div>
        </div>
        )}
      </DashboardLayout>

      {/* -----------------------------------------------------------------
          REUSABLE MODAL: NEW SUBSCRIBER FORM
         ----------------------------------------------------------------- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New GPON Broadband Subscriber"
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel Setup
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubscriber}>
              Write PPPoE Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubscriber} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Subscriber Legal Trading Entity" 
              placeholder="e.g. Nairobi Hospital GPON Node" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
            <Input 
              label="Administrative Contact Email" 
              type="email"
              placeholder="e.g. noc@hospital.co.ke" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="PPPoE Server Access Account Routing ID" 
              placeholder="e.g. cel_nbo_hosp_gpon" 
              required 
              value={formData.pppoeUsername}
              onChange={(e) => setFormData({ ...formData, pppoeUsername: e.target.value })}
              error={formErrors.pppoeUsername}
            />
            <Input 
              label="ONT Fiber Optical Network Terminal MAC Address" 
              placeholder="e.g. FC:42:01:A2:FF:10" 
              required 
              value={formData.ontMac}
              onChange={(e) => setFormData({ ...formData, ontMac: e.target.value })}
              error={formErrors.ontMac}
              description="A unique 12-digit hexadecimal optical MAC sequence"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Contracted Bandwidth Profile" 
              options={[
                { value: "Celcom Home 15Mbps", label: "Celcom Home Fiber (15Mbps)" },
                { value: "Celcom Business 30Mbps", label: "Celcom Business Premium (30Mbps)" },
                { value: "Celcom Business 50Mbps", label: "Celcom Enterprise (50Mbps)" },
                { value: "Celcom Dedicated 100Mbps", label: "Celcom Dedicated Lease (100Mbps)" },
                { value: "Celcom Transit 1Gbps", label: "Celcom Transit Fiber Link (1Gbps)" }
              ]}
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            />
            <Input 
              label="Initial Account Deposit Credit (KES)" 
              type="number"
              placeholder="e.g. 15000" 
              value={formData.balanceKES}
              onChange={(e) => setFormData({ ...formData, balanceKES: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Checkbox 
              label="Confirm compliance with Communications Authority of Kenya and local tax codes." 
              checked={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
              error={formErrors.terms}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}

// -----------------------------------------------------------------
// CONTEXT APP PROVIDER WRAPPER ENTRY POINT
// -----------------------------------------------------------------

function AuthRoutingGate() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState("login");
  const [resetToken, setResetToken] = useState("");

  if (loading) {
    return <LoadingScreen type="full" />;
  }

  if (!user) {
    if (authScreen === "register") {
      return <RegisterPage onNavigate={setAuthScreen} />;
    }
    if (authScreen === "forgot-password") {
      return (
        <ForgotPasswordPage 
          onNavigate={(page, token) => {
            setAuthScreen(page);
            if (token) setResetToken(token);
          }} 
        />
      );
    }
    if (authScreen === "reset-password") {
      return <ResetPasswordPage onNavigate={setAuthScreen} initialToken={resetToken} />;
    }
    return <LoginPage onNavigate={setAuthScreen} />;
  }

  return <DesignSystemPlayground />;
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AuthRoutingGate />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
