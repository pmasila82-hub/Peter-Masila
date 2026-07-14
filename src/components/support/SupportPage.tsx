import React, { useState, useEffect, useMemo } from "react";
import { 
  FolderSync, 
  LifeBuoy, 
  PhoneCall, 
  Mail, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Plus, 
  FileText, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  BookOpen, 
  Search,
  Check,
  Send,
  Eye,
  Trash2,
  Calendar,
  Star,
  Layers,
  Wrench,
  ThumbsUp,
  User,
  ShieldCheck,
  Zap,
  Package,
  HeartHandshake
} from "lucide-react";
import { useNotifications } from "../ui/Notifications";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { Charts } from "../ui/Charts";

export function SupportPage() {
  const { showNotification } = useNotifications();
  const { accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "schedules" | "jobcards" | "knowledge" | "reports">("dashboard");

  // API State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);

  // Filtering / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Selected entities for drilldown
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

  // Support Forms
  const [ticketForm, setTicketForm] = useState({
    customerId: "cust-1",
    customerName: "Westlands Retail Center",
    contactPerson: "John Wambua",
    phone: "+254 711 000111",
    email: "ops@westlandsmall.co.ke",
    category: "FIBRE_FAULT",
    description: "",
    priority: "MEDIUM",
    assignedTechnician: "Joseph Kariuki",
    channel: "Manual Entry"
  });

  const [scheduleForm, setScheduleForm] = useState({
    customerId: "cust-1",
    customerName: "Westlands Retail Center",
    equipment: "Core OLT Splicing Backplane",
    serviceDate: "",
    technician: "Joseph Kariuki",
    nextMaintenanceDate: "",
    notes: ""
  });

  const [jobCardForm, setJobCardForm] = useState({
    location: "",
    toolsRequired: "Optical splice machine, optical power meter",
    materialsRequired: [] as { productId: string; name: string; qty: number; cost: number }[],
    materialProductId: "prod-3",
    materialQty: "1"
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: "5",
    comments: ""
  });

  const [chatMessage, setChatMessage] = useState("");

  // Static options
  const customersList = [
    { id: "cust-1", name: "Westlands Retail Center", contact: "John Wambua", phone: "+254 711 000111", email: "ops@westlandsmall.co.ke" },
    { id: "cust-2", name: "Kilimani Heights Apartments", contact: "Grace Mutua", phone: "+254 722 555444", email: "care@kilimaniheights.ke" },
    { id: "cust-3", name: "Lavington Green Secondary School", contact: "Principal Mutegi", phone: "+254 733 999111", email: "admin@lavingtongreen.sc.ke" }
  ];

  const techniciansList = [
    "Joseph Kariuki",
    "David Mwangi",
    "Mercy Chebet",
    "Newton Kiprop"
  ];

  const inventoryProducts = [
    { id: "prod-1", sku: "MT-HEX-GR3", name: "Mikrotik hEX gr3 Gigabit Router", costPrice: 6500 },
    { id: "prod-2", sku: "UBNT-UAP-AC-LITE", name: "Ubiquiti UniFi AC Lite AP", costPrice: 9000 },
    { id: "prod-3", sku: "HK-DOME-5MP", name: "Hikvision 5MP Dome Camera", costPrice: 4200 }
  ];

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken || localStorage.getItem("celcom_access_token")}`
  }), [accessToken]);

  // -------------------------------------------------------------
  // REFRESH DATA FROM BACKEND SUPPORT ENDPOINTS
  // -------------------------------------------------------------
  const refreshData = async () => {
    setLoading(true);
    try {
      // Dashboard Stats
      const statsRes = await fetch("/api/v1/support/dashboard-stats", { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Tickets
      const tktsRes = await fetch("/api/v1/support/tickets", { headers });
      if (tktsRes.ok) {
        const tktsData = await tktsRes.json();
        setTickets(tktsData.tickets);
      }

      // Job Cards
      const jcRes = await fetch("/api/v1/support/job-cards", { headers });
      if (jcRes.ok) {
        const jcData = await jcRes.json();
        setJobCards(jcData.jobCards);
      }

      // Maintenance Schedules
      const schedRes = await fetch("/api/v1/support/schedules", { headers });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setSchedules(schedData.schedules);
      }

      // Knowledge Base
      const kbRes = await fetch("/api/v1/support/knowledge-base", { headers });
      if (kbRes.ok) {
        const kbData = await kbRes.json();
        setKnowledgeBase(kbData.articles);
      }
    } catch (e) {
      console.error("Support Module: Network telemetry error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [headers]);

  // Handle customer pick inside Create Ticket
  const handleCustomerSelect = (custId: string) => {
    const selected = customersList.find(c => c.id === custId);
    if (selected) {
      setTicketForm(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        contactPerson: selected.contact,
        phone: selected.phone,
        email: selected.email
      }));
    }
  };

  // Handle ticket creation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/support/tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(ticketForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Ticket Registered", `Incident ${data.ticket.ticketNumber} created successfully.`, "success");
        setIsTicketModalOpen(false);
        setTicketForm({
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          contactPerson: "John Wambua",
          phone: "+254 711 000111",
          email: "ops@westlandsmall.co.ke",
          category: "FIBRE_FAULT",
          description: "",
          priority: "MEDIUM",
          assignedTechnician: "Joseph Kariuki",
          channel: "Manual Entry"
        });
        refreshData();
      } else {
        showNotification("Process Error", data.message, "error");
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Technician re-assignment / status update
  const handleUpdateTicket = async (tktId: string, payload: any) => {
    try {
      const res = await fetch(`/api/v1/support/tickets/${tktId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Ticket Processed", "Incident state modified in system archives.", "success");
        if (selectedTicket?.id === tktId) {
          setSelectedTicket(data.ticket);
        }
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  // Post chat logs inside ticket detail view
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    try {
      const res = await fetch(`/api/v1/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sender: "SUPPORT_AGENT",
          message: chatMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket((prev: any) => ({
          ...prev,
          messages: [...prev.messages, data.message]
        }));
        setChatMessage("");
        refreshData();
      }
    } catch (e: any) {
      showNotification("Communication Failure", e.message, "error");
    }
  };

  // Upvote Knowledge base helpfulness rating
  const handleKnowledgeHelpful = async (kbId: string) => {
    try {
      const res = await fetch(`/api/v1/support/knowledge-base/${kbId}/helpful`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        showNotification("Voted Helpful", "Troubleshooting validation score upvoted.", "success");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Preventative maintenance schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/support/schedules", {
        method: "POST",
        headers,
        body: JSON.stringify(scheduleForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Maintenance Scheduled", "Periodic sweeping schedule registered.", "success");
        setIsScheduleModalOpen(false);
        setScheduleForm({
          customerId: "cust-1",
          customerName: "Westlands Retail Center",
          equipment: "Core OLT Splicing Backplane",
          serviceDate: "",
          technician: "Joseph Kariuki",
          nextMaintenanceDate: "",
          notes: ""
        });
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleCompleteSchedule = async (schedId: string) => {
    try {
      const res = await fetch(`/api/v1/support/schedules/${schedId}/complete`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        showNotification("SLA Swept", "Schedules updated successfully.", "success");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // JOB CARD INTERFACES
  // -------------------------------------------------------------
  const handleOpenJobCardModal = (tkt: any) => {
    setSelectedTicket(tkt);
    setJobCardForm({
      location: "Building C, Suite 4B",
      toolsRequired: "Optical splicing core kit, power testing device",
      materialsRequired: [],
      materialProductId: "prod-3",
      materialQty: "1"
    });
    setIsJobCardModalOpen(true);
  };

  const handleAddMaterialToJobCard = () => {
    const prod = inventoryProducts.find(p => p.id === jobCardForm.materialProductId);
    if (!prod) return;

    const qty = parseInt(jobCardForm.materialQty) || 1;
    const newMat = {
      productId: prod.id,
      name: prod.name,
      qty,
      cost: prod.costPrice * qty
    };

    setJobCardForm(prev => ({
      ...prev,
      materialsRequired: [...prev.materialsRequired, newMat]
    }));
  };

  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/v1/support/tickets/${selectedTicket.id}/job-card`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          location: jobCardForm.location,
          toolsRequired: jobCardForm.toolsRequired,
          materialsRequired: jobCardForm.materialsRequired
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Job Card Issued", `Field service order ${data.jobCard.jobNumber} queued.`, "success");
        setIsJobCardModalOpen(false);
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleCompleteJobCard = async (jcId: string) => {
    try {
      const res = await fetch(`/api/v1/support/job-cards/${jcId}/complete`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          workDone: "Investigated core lines, replaced broken hardware modules & finalized optical parameters.",
          customerSignature: "Authenticated Customer Rep"
        })
      });
      if (res.ok) {
        showNotification("Job Finalized", "Ledgers posted, hardware stock decremented automatically.", "success");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit satisfaction CSAT feedbacks
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/v1/support/tickets/${selectedTicket.id}/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating: parseInt(feedbackForm.rating),
          comments: feedbackForm.comments
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("CSAT Submitted", "Customer satisfaction rating indexed successfully.", "success");
        setIsFeedbackModalOpen(false);
        setFeedbackForm({ rating: "5", comments: "" });
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  // Filtered ticket queue matching query params
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = filterCategory === "ALL" || t.category === filterCategory;
      const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
      const matchStatus = filterStatus === "ALL" || t.status === filterStatus;

      return matchSearch && matchCategory && matchPriority && matchStatus;
    });
  }, [tickets, searchQuery, filterCategory, filterPriority, filterStatus]);

  // SLA Met counts for chart
  const slaChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Response SLA", "Met %": stats.slaResponseSuccessRate, "Target %": 100 },
      { name: "Resolution SLA", "Met %": stats.slaResolutionSuccessRate, "Target %": 100 }
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* ----------------- SERVICE HEADER WITH SLA STATUS Ticker ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 border border-slate-950 p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5.5 w-5.5 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight">Service Desk & Support Core</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time management of optical/CCTV faults, tech dispatch SLA tracking, preventative schedules & automated hardware store stock integrations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Button variant="outline" size="sm" className="text-slate-300 border-slate-800 hover:bg-slate-900" onClick={refreshData}>
            <FolderSync className="h-3.5 w-3.5 mr-1" /> Re-Sync Desk
          </Button>
          <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 border-none font-bold" onClick={() => setIsTicketModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Support Ticket
          </Button>
        </div>
      </div>

      {/* ----------------- SUB-NAVIGATION TABS ----------------- */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: "dashboard", label: "Operations Hub", icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: "tickets", label: "Ticket Queue", icon: <LifeBuoy className="h-3.5 w-3.5" /> },
          { id: "schedules", label: "Preventive Sweeps", icon: <Calendar className="h-3.5 w-3.5" /> },
          { id: "jobcards", label: "Field Job Cards", icon: <Wrench className="h-3.5 w-3.5" /> },
          { id: "knowledge", label: "Knowledge Directory", icon: <BookOpen className="h-3.5 w-3.5" /> },
          { id: "reports", label: "SLA & CSAT Metrics", icon: <FileText className="h-3.5 w-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all duration-150 border-b-2 cursor-pointer ${
              activeTab === tab.id 
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-500/5 font-bold" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ----------------- TAB: DASHBOARD ----------------- */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard KPI Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Open Incidents</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.openTickets} / {stats.totalTickets}</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Activity className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resolved Desk Tickets</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.resolvedTickets}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-sky-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Response SLA Rate</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.slaResponseSuccessRate?.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Average CSAT Score</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.csatAverage}%</p>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SLA Compliance Graphic */}
            <Card className="lg:col-span-8 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">SLA Contract Metric Summary</CardTitle>
                <CardDescription>Audited percentage profiles comparing corporate resolution response rates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Charts 
                    type="bar" 
                    data={slaChartData} 
                    metrics={[
                      { key: "Met %", color: "#eab308", label: "SLA Met Rate (%)" },
                      { key: "Target %", color: "#64748b", label: "Contractual Baseline (%)" }
                    ]}
                    height={230}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick-links right panel */}
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Ticket Categories Distribution</CardTitle>
                <CardDescription>Incidents broken down by technical field domains.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.categoryStats?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No incident distributions logged.</p>
                ) : (
                  stats.categoryStats?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">
                          {item.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold">{item.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ----------------- TAB: TICKETS ----------------- */}
      {activeTab === "tickets" && (
        <div className="space-y-4 animate-fade-in">
          {/* Live search filters & category maps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 text-xs w-full text-slate-800 dark:text-slate-200 rounded-lg pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 outline-none"
              />
            </div>
            
            <Select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="INTERNET_PROBLEM">Internet Problem</option>
              <option value="FIBRE_FAULT">Fibre Fault</option>
              <option value="ROUTER_PROBLEM">Router Problem</option>
              <option value="CCTV_PROBLEM">CCTV Problem</option>
              <option value="NETWORK_PROBLEM">Network Problem</option>
              <option value="BILLING_ISSUE">Billing Issue</option>
            </Select>

            <Select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            <Select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_CUSTOMER">Waiting Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-${selectedTicket ? "6" : "12"} space-y-4`}>
              {filteredTickets.length === 0 ? (
                <EmptyState 
                  title="No Incident Records" 
                  description="No registered support tickets match your filter parameters."
                  actionLabel="Create Incident Ticket"
                  onAction={() => setIsTicketModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredTickets.map(ticket => (
                    <Card key={ticket.id} className={`shadow-sm hover:border-amber-500/40 transition-colors ${selectedTicket?.id === ticket.id ? "border-amber-500 shadow-md bg-amber-500/5" : ""}`}>
                      <CardContent className="p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                            {ticket.ticketNumber}
                          </span>
                          <div className="flex gap-1.5 items-center">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                              ticket.priority === "CRITICAL" ? "bg-red-950 text-red-400 border-red-900/50 animate-pulse" :
                              ticket.priority === "HIGH" ? "bg-amber-950 text-amber-400 border-amber-900/50" :
                              "bg-slate-950 text-slate-400 border-slate-900/50"
                            }`}>
                              {ticket.priority}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                              ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" :
                              ticket.status === "IN_PROGRESS" ? "bg-sky-950 text-sky-400 border-sky-900/50" :
                              "bg-amber-950 text-amber-400 border-amber-900/50"
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{ticket.customerName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ticket.category.replace(/_/g, " ")} | Tech: {ticket.assignedTechnician || "Unassigned"}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-2 line-clamp-2">{ticket.description}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-3 text-[10px] text-slate-400">
                          <span>SLA Due: {new Date(ticket.dueDate).toLocaleString()}</span>
                          <div className="flex gap-2">
                            {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                              <Button 
                                variant="outline" 
                                size="xs" 
                                className="text-amber-500 hover:bg-amber-500/5"
                                onClick={() => handleOpenJobCardModal(ticket)}
                              >
                                Issue Job Card <Wrench className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                            <Button 
                              variant="primary" 
                              size="xs" 
                              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0"
                              onClick={() => { setSelectedTicket(ticket); setIsTicketDetailOpen(true); }}
                            >
                              Open Timeline <Eye className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Drilldown Communication Panel */}
            {selectedTicket && (
              <div className="lg:col-span-6 space-y-4 animate-slide-in">
                <Card className="shadow-md border border-amber-500/30 sticky top-4">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-3 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{selectedTicket.ticketNumber}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                          selectedTicket.slaResolutionMet === true ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" :
                          selectedTicket.slaResolutionMet === false ? "bg-red-950 text-red-400 border-red-900/50 animate-bounce" :
                          "bg-slate-950 text-slate-400 border-slate-900/50"
                        }`}>
                          {selectedTicket.slaResolutionMet === true ? "SLA MET" : selectedTicket.slaResolutionMet === false ? "SLA BREACHED" : "ACTIVE SLA"}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-1">{selectedTicket.customerName}</CardTitle>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => setSelectedTicket(null)}>Close</Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Incident Metadata */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-400">Contact Person</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{selectedTicket.contactPerson}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-400">Direct Contact</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300 font-mono">{selectedTicket.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">Description</p>
                        <p className="text-slate-600 dark:text-slate-300 leading-normal">{selectedTicket.description}</p>
                      </div>
                    </div>

                    {/* Dispatch Form Controls */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400">Assigned Field Specialist</label>
                        <Select 
                          value={selectedTicket.assignedTechnician || ""}
                          onChange={(e) => handleUpdateTicket(selectedTicket.id, { assignedTechnician: e.target.value })}
                          className="text-xs mt-1"
                        >
                          <option value="">-- Assign Tech --</option>
                          {techniciansList.map(tech => (
                            <option key={tech} value={tech}>{tech}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400">Operational Status</label>
                        <Select 
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateTicket(selectedTicket.id, { status: e.target.value })}
                          className="text-xs mt-1"
                        >
                          <option value="OPEN">Open</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_CUSTOMER">Waiting Customer</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </Select>
                      </div>
                    </div>

                    {/* Messages Chat Box */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Incident Timeline Logs</p>
                      <div className="bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg p-3 h-52 overflow-y-auto space-y-2.5">
                        {selectedTicket.messages?.map((msg: any) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] rounded-lg p-2.5 text-xs ${
                              msg.sender === "SUPPORT_AGENT" ? "bg-amber-500/10 dark:bg-amber-500/5 text-amber-700 dark:text-amber-300 border border-amber-500/20 ml-auto" :
                              msg.sender === "SYSTEM" ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700 mr-auto" :
                              "bg-sky-500/10 dark:bg-sky-500/5 text-sky-700 dark:text-sky-300 border border-sky-500/20 mr-auto"
                            }`}
                          >
                            <span className="font-bold text-[9px] opacity-75">{msg.senderName}</span>
                            <p className="mt-1 font-sans">{msg.message}</p>
                            <span className="text-[8px] text-slate-400 mt-1 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Send Message Form */}
                      <form onSubmit={handleSendChatMessage} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Type technical update..." 
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900 text-xs w-full text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800 outline-none"
                        />
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 shrink-0"><Send className="h-3.5 w-3.5" /></Button>
                      </form>
                    </div>

                    {/* Feedback Rating triggers when resolved */}
                    {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && (
                      <div className="border-t border-slate-100 dark:border-slate-900 pt-3.5 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">Customer Satisfaction</p>
                          {selectedTicket.feedbackRating ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex text-amber-500">
                                {[...Array(selectedTicket.feedbackRating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">("{selectedTicket.feedbackComments}")</span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">Awaiting customer satisfaction feedback.</p>
                          )}
                        </div>
                        {!selectedTicket.feedbackRating && (
                          <Button 
                            variant="primary" 
                            size="xs" 
                            className="bg-amber-500 text-slate-950"
                            onClick={() => setIsFeedbackModalOpen(true)}
                          >
                            Log CSAT Survey <Star className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB: PREVENTIVE SWEEPS ----------------- */}
      {activeTab === "schedules" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Preventive Maintenance Auditing</h3>
              <p className="text-[10px] text-slate-400 mt-1">Periodic sweep logs scheduled for major corporate optical termination structures.</p>
            </div>
            <Button variant="primary" size="xs" onClick={() => setIsScheduleModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Schedule Sweep
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map(sched => (
              <Card key={sched.id} className="shadow-sm border-t-4 border-t-amber-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 p-1 rounded">
                      {sched.scheduleNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      sched.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" : "bg-amber-950 text-amber-400 border-amber-900/50"
                    }`}>
                      {sched.status}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{sched.customerName}</CardTitle>
                  <CardDescription className="text-[11px] font-mono">{sched.equipment}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs font-sans">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider font-bold text-slate-400">Sweep Notes</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 leading-normal">{sched.notes}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-400">Scheduled Date</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{sched.serviceDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400">Next Audit Date</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{sched.nextMaintenanceDate || "--"}</p>
                    </div>
                  </div>
                </CardContent>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-between items-center text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">Tech: {sched.technician}</span>
                  {sched.status === "SCHEDULED" && (
                    <Button 
                      variant="outline" 
                      size="xs" 
                      className="text-emerald-500 border-emerald-500/25"
                      onClick={() => handleCompleteSchedule(sched.id)}
                    >
                      Complete Sweep <CheckCircle className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: FIELD JOB CARDS ----------------- */}
      {activeTab === "jobcards" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Technical Dispatch Job Cards</h3>
            <p className="text-[10px] text-slate-400">Detailed logs describing site hardware swaps, optical splicing, tool listings, and signature validation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCards.map(jc => (
              <Card key={jc.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                      {jc.jobNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      jc.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" : "bg-amber-950 text-amber-400 border-amber-900/50 animate-pulse"
                    }`}>
                      {jc.status}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{jc.customerName}</CardTitle>
                  <CardDescription className="text-[11px] font-mono">{jc.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs font-sans leading-normal">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase text-slate-400">Problem Description</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 font-semibold">{jc.problemDescription}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase text-slate-400">Material Allocation Out</p>
                    {jc.materialsRequired?.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">No stock resources allocated.</p>
                    ) : (
                      <div className="mt-1.5 space-y-1 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded border border-slate-200/40 dark:border-slate-800/80">
                        {jc.materialsRequired?.map((mat: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{mat.name} x{mat.qty}</span>
                            <span className="font-mono text-slate-500">KES {mat.cost?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {jc.workDone && (
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase text-slate-400">Work Logs</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400 italic">"{jc.workDone}"</p>
                    </div>
                  )}

                  {jc.customerSignature && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 p-2 rounded text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Signature Captured: {jc.customerSignature}</span>
                    </div>
                  )}
                </CardContent>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-between items-center text-xs font-mono">
                  <span className="text-[10px] text-slate-500">Tech: {jc.technician}</span>
                  {jc.status === "OPEN" && (
                    <Button 
                      variant="primary" 
                      size="xs" 
                      className="bg-amber-500 text-slate-950"
                      onClick={() => handleCompleteJobCard(jc.id)}
                    >
                      Complete & Sign Card <Check className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: KNOWLEDGE BASE ----------------- */}
      {activeTab === "knowledge" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <Search className="h-4 w-4 text-slate-400 animate-pulse" />
            <input 
              type="text" 
              placeholder="Query problems, troubleshooting steps, Fiber LOS configurations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs w-full text-slate-800 dark:text-slate-200 placeholder-slate-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {knowledgeBase.filter(kb => kb.title.toLowerCase().includes(searchQuery.toLowerCase())).map(kb => (
              <Card key={kb.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono font-bold">
                      {kb.category}
                    </span>
                    <span className="text-slate-400 font-mono">
                      Views: {kb.views}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{kb.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs font-sans">
                  <div className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/40 dark:border-slate-800/80 leading-normal">
                    <p className="font-mono text-[9px] font-bold text-slate-400 uppercase">Symptom / Problem</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-200 font-semibold">{kb.problem}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-bold text-slate-400 uppercase">Resolution Playbook</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed font-mono">{kb.solution}</p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {kb.steps?.map((step: string, sIdx: number) => (
                      <div key={sIdx} className="flex gap-2 text-[11px] leading-normal text-slate-600 dark:text-slate-400">
                        <span className="font-mono text-amber-500 font-bold shrink-0">{sIdx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-between items-center text-xs font-mono">
                  <span className="text-[10px] text-slate-400">Was this resolution helpful?</span>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    className="text-amber-500 hover:bg-amber-500/5 flex items-center gap-1 border-amber-500/20"
                    onClick={() => handleKnowledgeHelpful(kb.id)}
                  >
                    <ThumbsUp className="h-3 w-3" /> Yes ({kb.helpfulCount})
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: REPORTS ----------------- */}
      {activeTab === "reports" && stats && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Overall Resolved Count</p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{stats.resolvedTickets}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">Total resolved issues logged on production server.</p>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Mean CSAT Rating</p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{stats.averageRating} / 5</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">Aggregated Customer Satisfaction survey star indexes.</p>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">SLA Response Metrics</p>
                <p className="text-3xl font-black text-emerald-500 mt-2">{stats.slaResponseSuccessRate?.toFixed(1)}%</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">Compliance with 1h (critical) / 4h (high) first contact.</p>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">SLA Resolution compliance</p>
                <p className="text-3xl font-black text-emerald-500 mt-2">{stats.slaResolutionSuccessRate?.toFixed(1)}%</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">Total incidents resolved inside structural countdown limits.</p>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Technical Dispatch Roster Performance</CardTitle>
              <CardDescription>Real-time telemetry showing staff capacity mapping.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs font-sans text-slate-700 dark:text-slate-300 text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                    <th className="py-2.5">Field Specialist</th>
                    <th>Average Rating</th>
                    <th>Response Performance</th>
                    <th>Incidents Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900 font-mono">
                  {[
                    { name: "Joseph Kariuki", rating: "4.9", sla: "100%", closed: "12" },
                    { name: "David Mwangi", rating: "4.8", sla: "95%", closed: "8" },
                    { name: "Mercy Chebet", rating: "4.7", sla: "92%", closed: "5" }
                  ].map((tech, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/20">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{tech.name}</td>
                      <td>★ {tech.rating}</td>
                      <td className="text-emerald-500">{tech.sla}</td>
                      <td>{tech.closed} closed</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: CREATE SUPPORT TICKET ----------------- */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Log Technical Support Incident">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select ERP Customer</label>
            <Select 
              value={ticketForm.customerId} 
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="text-xs mt-1"
            >
              {customersList.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name} ({cust.contact})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Incident Category</label>
              <Select 
                value={ticketForm.category} 
                onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as any})}
                className="text-xs mt-1"
              >
                <option value="INTERNET_PROBLEM">Internet Problem</option>
                <option value="FIBRE_FAULT">Fibre Fault</option>
                <option value="ROUTER_PROBLEM">Router Problem</option>
                <option value="CCTV_PROBLEM">CCTV Problem</option>
                <option value="NETWORK_PROBLEM">Network Problem</option>
                <option value="BILLING_ISSUE">Billing Issue</option>
                <option value="INSTALLATION_REQUEST">Installation Request</option>
                <option value="GENERAL_INQUIRY">General Inquiry</option>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Urgency Priority</label>
              <Select 
                value={ticketForm.priority} 
                onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value as any})}
                className="text-xs mt-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical Priority</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Support Channel</label>
              <Select 
                value={ticketForm.channel} 
                onChange={(e) => setTicketForm({...ticketForm, channel: e.target.value})}
                className="text-xs mt-1"
              >
                <option value="Manual Entry">Manual Desk Entry</option>
                <option value="Customer Portal">Customer Self Portal</option>
                <option value="Phone Call">Phone Operator</option>
                <option value="Email Gateway">Email Gateway</option>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Assigned Dispatch</label>
              <Select 
                value={ticketForm.assignedTechnician} 
                onChange={(e) => setTicketForm({...ticketForm, assignedTechnician: e.target.value})}
                className="text-xs mt-1"
              >
                <option value="">-- Queue Dispatch --</option>
                {techniciansList.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Problem Description</label>
            <Textarea 
              value={ticketForm.description} 
              onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
              placeholder="State the connection failure codes, physical optical line metrics..."
              className="text-xs mt-1 h-24 font-mono"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
            <Button type="button" variant="outline" onClick={() => setIsTicketModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono">Commit Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: CREATE PREVENTIVE SCHEDULE ----------------- */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Register Preventative Maintenance Schedule">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Client Node</label>
            <Select 
              value={scheduleForm.customerId}
              onChange={(e) => {
                const opt = customersList.find(c => c.id === e.target.value);
                if (opt) setScheduleForm({...scheduleForm, customerId: opt.id, customerName: opt.name});
              }}
              className="text-xs mt-1"
            >
              {customersList.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Target Equipment / Infrastructure</label>
            <Input 
              type="text"
              value={scheduleForm.equipment}
              onChange={(e) => setScheduleForm({...scheduleForm, equipment: e.target.value})}
              className="text-xs mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Audit Sweep Date</label>
              <Input 
                type="date"
                value={scheduleForm.serviceDate}
                onChange={(e) => setScheduleForm({...scheduleForm, serviceDate: e.target.value})}
                className="text-xs mt-1 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Renewal/Next Date</label>
              <Input 
                type="date"
                value={scheduleForm.nextMaintenanceDate}
                onChange={(e) => setScheduleForm({...scheduleForm, nextMaintenanceDate: e.target.value})}
                className="text-xs mt-1 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Primary Field Engineer</label>
            <Select 
              value={scheduleForm.technician}
              onChange={(e) => setScheduleForm({...scheduleForm, technician: e.target.value})}
              className="text-xs mt-1"
            >
              {techniciansList.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Technical Sweeping Notes</label>
            <Textarea 
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
              placeholder="Batteries volt inspections, cleaning chassis grids..."
              className="text-xs mt-1 h-20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
            <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-500 text-slate-950 font-bold">Lock Sweep Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: ISSUE FIELD JOB CARD ----------------- */}
      <Modal isOpen={isJobCardModalOpen} onClose={() => setIsJobCardModalOpen(false)} title={`Generate Technical Job Card for ${selectedTicket?.ticketNumber}`}>
        <form onSubmit={handleCreateJobCard} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Client Physical Location</label>
            <Input 
              type="text"
              value={jobCardForm.location}
              onChange={(e) => setJobCardForm({...jobCardForm, location: e.target.value})}
              className="text-xs mt-1"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tools Required</label>
            <Input 
              type="text"
              value={jobCardForm.toolsRequired}
              onChange={(e) => setJobCardForm({...jobCardForm, toolsRequired: e.target.value})}
              className="text-xs mt-1"
              required
            />
          </div>

          {/* Splicer hardware stock allocations */}
          <div className="border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-lg space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Inventory Allocation & Stock Out</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-slate-400">Select Stock Item</label>
                <Select 
                  value={jobCardForm.materialProductId}
                  onChange={(e) => setJobCardForm({...jobCardForm, materialProductId: e.target.value})}
                  className="text-xs mt-1"
                >
                  {inventoryProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name} (KES {prod.costPrice})</option>
                  ))}
                </Select>
              </div>
              <div className="w-20">
                <label className="text-[9px] font-bold text-slate-400">Qty</label>
                <Input 
                  type="number"
                  value={jobCardForm.materialQty}
                  onChange={(e) => setJobCardForm({...jobCardForm, materialQty: e.target.value})}
                  className="text-xs mt-1 font-mono"
                  min="1"
                />
              </div>
              <Button type="button" variant="outline" size="xs" className="h-9 shrink-0 text-amber-500 border-amber-500/20" onClick={handleAddMaterialToJobCard}>Allocate</Button>
            </div>

            {/* List allocated materials */}
            {jobCardForm.materialsRequired.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-900 space-y-1">
                {jobCardForm.materialsRequired.map((mat, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] font-mono">
                    <span>{mat.name} x{mat.qty}</span>
                    <span className="font-bold">KES {mat.cost?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
            <Button type="button" variant="outline" onClick={() => setIsJobCardModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-500 text-slate-950 font-bold font-mono">Generate & Dispatch Job</Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: CSAT SATISFACTION SURVEY ----------------- */}
      <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title="Customer Satisfaction Survey (CSAT)">
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Rating Performance Score</label>
            <Select 
              value={feedbackForm.rating}
              onChange={(e) => setFeedbackForm({...feedbackForm, rating: e.target.value})}
              className="text-xs mt-1 font-mono"
            >
              <option value="5">★★★★★ Excellent (100% CSAT)</option>
              <option value="4">★★★★☆ Good (80% CSAT)</option>
              <option value="3">★★★☆☆ Average (60% CSAT)</option>
              <option value="2">★★☆☆☆ Disappointing (40% CSAT)</option>
              <option value="1">★☆☆☆☆ Poor (20% CSAT)</option>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Comments / Feedback Description</label>
            <Textarea 
              value={feedbackForm.comments}
              onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
              placeholder="State any additional client feedback details..."
              className="text-xs mt-1 h-20"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
            <Button type="button" variant="outline" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-500 text-slate-950 font-bold font-mono font-bold">Lock CSAT Score</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupportPage;
