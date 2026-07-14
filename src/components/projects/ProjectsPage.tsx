import React, { useState, useEffect, useMemo } from "react";
import { 
  FolderSync, 
  Briefcase, 
  Users, 
  Wrench, 
  Layers, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  FileText, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Compass, 
  HardDrive, 
  ShieldAlert, 
  PenTool, 
  Search,
  Check,
  Send,
  Eye,
  Trash2
} from "lucide-react";
import { useNotifications } from "../ui/Notifications";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea, Checkbox } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { Charts } from "../ui/Charts";

export function ProjectsPage() {
  const { showNotification } = useNotifications();
  const { accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "projects" | "surveys" | "tasks" | "techs" | "contracts" | "jobcards" | "reports">("dashboard");

  // API State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);

  // Selected project for detailed side/overlay view
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({ name: "", customerId: "cust-1", customerName: "Westlands Retail Center", projectType: "FIBRE_INSTALLATION", budget: "", startDate: "", expectedCompletionDate: "", description: "" });
  const [surveyForm, setSurveyForm] = useState({ customerId: "cust-1", customerName: "Westlands Retail Center", location: "", gpsCoordinates: "", surveyDate: "", surveyTechnician: "Joseph Kariuki", requirements: "", recommendations: "", estimatedLabourCost: "", estMaterials: [] });
  const [taskForm, setTaskForm] = useState({ projectId: "", assignedEmployee: "Joseph Kariuki", description: "", startDate: "", dueDate: "", priority: "MEDIUM" });
  const [contractForm, setContractForm] = useState({ customerId: "cust-1", customerName: "Westlands Retail Center", contractType: "ANNUAL_PREMIUM", startDate: "", endDate: "", monthlyFee: "", servicesIncluded: "" });
  const [jobCardForm, setJobCardForm] = useState({ customerId: "cust-1", customerName: "Westlands Retail Center", issue: "", technician: "Joseph Kariuki", date: "", workDone: "", materialsUsed: "", customerSignature: "" });

  // Additional detail modal form states
  const [expenseForm, setExpenseForm] = useState({ category: "LABOUR", description: "", amount: "" });
  const [materialForm, setMaterialForm] = useState({ productId: "prod-1", quantityRequired: "" });
  const [fibreForm, setFibreForm] = useState({ routeDetails: "", cableLength: "", fibreType: "Single Mode G.652D", ontSerialNumber: "", router: "Mikrotik hEX gr3", signalTestResults: "" });
  const [cctvForm, setCctvForm] = useState({ cameraQuantity: "", cameraType: "IP Dome 5MP", dvrNvrModel: "Hikvision NVR 16-Ch", storageCapacity: "4TB", cableUsed: "Cat6 Shielded" });
  const [certForm, setCertForm] = useState({ workCompleted: "", equipmentInstalled: "", warranty: "12 Months replacement warranty", customerApprovalName: "" });

  // Loaders
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken || localStorage.getItem("celcom_access_token")}`
  }), [accessToken]);

  // Fetch all endpoints
  const refreshData = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { path: "/api/v1/project/dashboard-stats", setter: setStats, key: "stats" },
        { path: "/api/v1/project/projects", setter: setProjects, key: "projects" },
        { path: "/api/v1/project/surveys", setter: setSurveys, key: "surveys" },
        { path: "/api/v1/project/tasks", setter: setTasks, key: "tasks" },
        { path: "/api/v1/project/technicians", setter: setTechnicians, key: "technicians" },
        { path: "/api/v1/project/maintenance-contracts", setter: setContracts, key: "contracts" },
        { path: "/api/v1/project/job-cards", setter: setJobCards, key: "jobCards" },
        { path: "/api/v1/project/completion-certificates", setter: setCertificates, key: "certificates" }
      ];

      for (const ep of endpoints) {
        const res = await fetch(ep.path, { headers });
        if (res.ok) {
          const data = await res.json();
          ep.setter(data[ep.key]);
        }
      }
    } catch (e) {
      console.error("Error refreshing Projects data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [headers]);

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/project/projects", {
        method: "POST",
        headers,
        body: JSON.stringify(projectForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Project Instantiated", "New project profile recorded in systems.", "success");
        setIsProjectModalOpen(false);
        setProjectForm({ name: "", customerId: "cust-1", customerName: "Westlands Retail Center", projectType: "FIBRE_INSTALLATION", budget: "", startDate: "", expectedCompletionDate: "", description: "" });
        refreshData();
      } else {
        showNotification("System Failure", data.message, "error");
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Project Status Update (integrates with completed invoice & inventory)
  const handleUpdateProjectStatus = async (pId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/project/projects/${pId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Project Modified", `Status shifted to ${status}.`, "success");
        if (status === "COMPLETED") {
          showNotification("Finance Integrated", "Final commercial invoice auto-generated. Revenue recorded.", "info");
        }
        refreshData();
        if (selectedProject?.id === pId) {
          setSelectedProject(data.project);
        }
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Site Survey Submit
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/project/surveys", {
        method: "POST",
        headers,
        body: JSON.stringify(surveyForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Survey Generated", "Site inspection telemetry saved.", "success");
        setIsSurveyModalOpen(false);
        setSurveyForm({ customerId: "cust-1", customerName: "Westlands Retail Center", location: "", gpsCoordinates: "", surveyDate: "", surveyTechnician: "Joseph Kariuki", requirements: "", recommendations: "", estimatedLabourCost: "", estMaterials: [] });
        refreshData();
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Job Card Submit
  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/project/job-cards", {
        method: "POST",
        headers,
        body: JSON.stringify(jobCardForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Job Card Logged", "Technical intervention record saved.", "success");
        setIsJobCardModalOpen(false);
        setJobCardForm({ customerId: "cust-1", customerName: "Westlands Retail Center", issue: "", technician: "Joseph Kariuki", date: "", workDone: "", materialsUsed: "", customerSignature: "" });
        refreshData();
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Maintenance Contract Submit
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/project/maintenance-contracts", {
        method: "POST",
        headers,
        body: JSON.stringify(contractForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Contract Activated", "SLA service contract registered.", "success");
        setIsContractModalOpen(false);
        setContractForm({ customerId: "cust-1", customerName: "Westlands Retail Center", contractType: "ANNUAL_PREMIUM", startDate: "", endDate: "", monthlyFee: "", servicesIncluded: "" });
        refreshData();
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/project/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Task Dispatched", "Operational duty queued.", "success");
        setIsTaskModalOpen(false);
        setTaskForm({ projectId: "", assignedEmployee: "Joseph Kariuki", description: "", startDate: "", dueDate: "", priority: "MEDIUM" });
        refreshData();
      }
    } catch (err: any) {
      showNotification("Error", err.message, "error");
    }
  };

  // Handle Task status update
  const handleUpdateTaskStatus = async (tId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/project/tasks/${tId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showNotification("Task Updated", `Shifted state to ${status}`, "success");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Detail Panel additions (expenses, material allocations, fibre/CCTV records, certificates)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/v1/project/projects/${selectedProject.id}/expenses`, {
        method: "POST",
        headers,
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        showNotification("Expense Registered", "Financial transaction posted on ledger.", "success");
        setExpenseForm({ category: "LABOUR", description: "", amount: "" });
        const refreshed = await (await fetch(`/api/v1/project/projects/${selectedProject.id}`, { headers })).json();
        setSelectedProject(refreshed.project);
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleAllocateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/v1/project/projects/${selectedProject.id}/materials`, {
        method: "POST",
        headers,
        body: JSON.stringify(materialForm)
      });
      if (res.ok) {
        showNotification("Inventory Allocated", "Product reserved from stock pools.", "success");
        setMaterialForm({ productId: "prod-1", quantityRequired: "" });
        const refreshed = await (await fetch(`/api/v1/project/projects/${selectedProject.id}`, { headers })).json();
        setSelectedProject(refreshed.project);
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleMaterialAction = async (mId: string, action: "ISSUE" | "USE" | "RETURN", qty: number) => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/v1/project/projects/${selectedProject.id}/materials/${mId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ action, quantity: qty })
      });
      if (res.ok) {
        showNotification("Inventory Synchronized", `${action} transaction propagated.`, "success");
        const refreshed = await (await fetch(`/api/v1/project/projects/${selectedProject.id}`, { headers })).json();
        setSelectedProject(refreshed.project);
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleCreateFibreRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/v1/project/fibre-records", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...fibreForm, projectId: selectedProject.id })
      });
      if (res.ok) {
        showNotification("Fibre Parameters Saved", "Backbone splice logs recorded.", "success");
        setFibreForm({ routeDetails: "", cableLength: "", fibreType: "Single Mode G.652D", ontSerialNumber: "", router: "Mikrotik hEX gr3", signalTestResults: "" });
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleCreateCctvRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/v1/project/cctv-records", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...cctvForm, projectId: selectedProject.id })
      });
      if (res.ok) {
        showNotification("CCTV Logs Locked", "Surveillance layout matrix recorded.", "success");
        setCctvForm({ cameraQuantity: "", cameraType: "IP Dome 5MP", dvrNvrModel: "Hikvision NVR 16-Ch", storageCapacity: "4TB", cableUsed: "Cat6 Shielded" });
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/v1/project/completion-certificates", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...certForm, projectId: selectedProject.id, technicianSignature: selectedProject.projectManager })
      });
      if (res.ok) {
        showNotification("Completion Certificate Issued", "Aesthetic quality cert signed.", "success");
        setCertForm({ workCompleted: "", equipmentInstalled: "", warranty: "12 Months replacement warranty", customerApprovalName: "" });
        refreshData();
      }
    } catch (e: any) {
      showNotification("Error", e.message, "error");
    }
  };

  // Simulation Downloads (PDF)
  const triggerPDFDownload = (title: string, payload: any) => {
    showNotification("Generating Document", "Rendering vector layouts...", "info");
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("Document Transferred", `${title} PDF structure downloaded.`, "success");
    }, 1500);
  };

  // Filtered views
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ----------------- MODULE TITLE & KPI SUMMARY CARD ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 border border-slate-950 p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5.5 w-5.5 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight">Technical Projects Core</h2>
          </div>
          <p className="text-xs text-slate-400">
            Provisioning and SLA auditing of Celcom Fibre installations, CCTV grids, network deployment & maintenance contract metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Button variant="outline" size="sm" className="text-slate-300 border-slate-800 hover:bg-slate-900" onClick={refreshData}>
            <FolderSync className="h-3.5 w-3.5 mr-1" /> Re-Sync Ledger
          </Button>
          <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 border-none font-bold" onClick={() => setIsProjectModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Launch Project
          </Button>
        </div>
      </div>

      {/* ----------------- SUB-NAVIGATION TABS ----------------- */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: "dashboard", label: "Operations Hub", icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: "projects", label: "Projects", icon: <Briefcase className="h-3.5 w-3.5" /> },
          { id: "surveys", label: "Site Surveys", icon: <Compass className="h-3.5 w-3.5" /> },
          { id: "tasks", label: "Tasks", icon: <Clock className="h-3.5 w-3.5" /> },
          { id: "techs", label: "Technicians", icon: <Users className="h-3.5 w-3.5" /> },
          { id: "contracts", label: "SLAs & Contracts", icon: <Wrench className="h-3.5 w-3.5" /> },
          { id: "jobcards", label: "Job Cards", icon: <PenTool className="h-3.5 w-3.5" /> },
          { id: "reports", label: "Project Analytics", icon: <FileText className="h-3.5 w-3.5" /> }
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
          {/* Bento-style stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Active Projects</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.activeProjects} / {stats.totalProjects}</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Activity className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Completed Projects</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.completedProjects}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-sky-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Project Budgets</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">KES {stats.totalBudget?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Overall Profit Margin</p>
                  <p className="text-2xl font-black mt-1 text-slate-850 dark:text-slate-100">{stats.averageProfitMargin?.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Financial Budget vs Costing Matrix</CardTitle>
                <CardDescription>Visual telemetry comparing project budgets against real material & field expenses.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Charts 
                    type="bar" 
                    data={projects} 
                    metrics={[
                      { key: "budget", color: "#eab308", label: "Project Budget (KES)" },
                      { key: "totalProjectCost", color: "#3b82f6", label: "Actual Costing (KES)" }
                    ]}
                    height={230}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Operational Summary</CardTitle>
                <CardDescription>Roster tallies across specialized operational boards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Site Surveys Completed", val: stats.surveyCount, color: "bg-amber-500" },
                  { label: "Active Project Tasks", val: stats.taskCount, color: "bg-sky-500" },
                  { label: "Technical Intervention Job Cards", val: stats.jobCardCount, color: "bg-emerald-500" },
                  { label: "Active SLA Service Contracts", val: stats.contractCount, color: "bg-purple-500" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
                    </div>
                    <span className="font-mono text-sm font-bold">{item.val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Roster of Project Managers / Technicians workload */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Field Engineers Workload & Rating</CardTitle>
                <CardDescription>Real-time telemetry showing staff capacity mapping.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {technicians.slice(0, 4).map((tech, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{tech.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full font-mono">
                        {tech.assignedProjectsCount} projects
                      </span>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-mono">
                        {tech.workload} active tasks
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/40 dark:border-slate-800/60 text-slate-500">
                      <span>Completion:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{tech.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------- TAB: PROJECTS ----------------- */}
      {activeTab === "projects" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Query projects by number, name, or customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs w-full text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredProjects.length === 0 ? (
                  <EmptyState 
                    title="No Projects Found" 
                    description="No project files match your database parameters."
                    actionLabel="Instantiate Project"
                    onAction={() => setIsProjectModalOpen(true)}
                  />
                ) : (
                  filteredProjects.map(project => (
                    <Card key={project.id} className="shadow-sm hover:border-amber-500/40 transition-colors">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded">
                            {project.projectNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            project.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" :
                            project.status === "PLANNING" ? "bg-slate-950 text-slate-400 border-slate-900/50" :
                            project.status === "IN_PROGRESS" ? "bg-amber-950 text-amber-400 border-amber-900/50" :
                            "bg-sky-950 text-sky-400 border-sky-900/50"
                          }`}>
                            {project.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{project.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans">{project.description}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-900 pt-3 text-slate-500">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold">Client</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{project.customerName}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold">Manager</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{project.projectManager}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold">Budget</p>
                            <p className="text-xs font-bold text-slate-850 dark:text-slate-100 font-mono">KES {project.budget?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold">Costing</p>
                            <p className="text-xs font-bold text-slate-850 dark:text-slate-100 font-mono">KES {project.totalProjectCost?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-3">
                          <span className="text-[10px] font-sans text-slate-400">
                            Start Date: {project.startDate}
                          </span>
                          <div className="flex gap-2">
                            {project.status !== "COMPLETED" && project.status !== "CANCELLED" && (
                              <Button 
                                variant="outline" 
                                size="xs" 
                                className="text-emerald-500 hover:text-emerald-400 border-emerald-500/25"
                                onClick={() => handleUpdateProjectStatus(project.id, "COMPLETED")}
                              >
                                Complete File
                              </Button>
                            )}
                            <Button 
                              variant="primary" 
                              size="xs" 
                              className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0"
                              onClick={() => { setSelectedProject(project); setIsDetailModalOpen(true); }}
                            >
                              Explore File <Plus className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Quick-links Right Panel */}
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Project Slicing Roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Fibre Connection Flow</p>
                    <p className="text-[10px] text-slate-500">Every completion auto-provisions PPPoE routing codes & records fiber splices directly to the physical mapping logs.</p>
                  </div>
                  <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 space-y-1">
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400">CCTV System Deployment</p>
                    <p className="text-[10px] text-slate-500">Tracks IP Dome counts, storage retention capacity profiles & issues completion warranty certificates automatically.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: SITE SURVEYS ----------------- */}
      {activeTab === "surveys" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Site Inspection Dossiers</h3>
            <Button variant="primary" size="xs" onClick={() => setIsSurveyModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Log Site Survey
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map(survey => (
              <Card key={survey.id} className="shadow-sm relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 p-1 rounded">
                      {survey.surveyNumber}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {survey.surveyDate}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{survey.customerName}</CardTitle>
                  <CardDescription className="text-[11px] font-sans flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    GPS: {survey.gpsCoordinates} | {survey.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono">Technical Requirements</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{survey.requirements}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono">Splicing / Material Recommendations</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 font-sans italic">"{survey.recommendations}"</p>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 font-mono">
                    <span className="text-slate-400">Est. Labour:</span>
                    <span className="font-bold text-slate-850 dark:text-slate-100">KES {survey.estimatedLabourCost?.toLocaleString()}</span>
                  </div>
                </CardContent>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Tech: {survey.surveyTechnician}</span>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => triggerPDFDownload(`Site_Survey_${survey.surveyNumber}`, survey)}
                  >
                    Site Survey Report PDF <FileText className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: TASKS ----------------- */}
      {activeTab === "tasks" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Universal Operations Duty Queue</h3>
            <Button variant="primary" size="xs" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Dispatched Task
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].map(section => {
              const secTasks = tasks.filter(t => t.status === section);
              return (
                <div key={section} className="bg-slate-100/60 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 space-y-4 min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-600 dark:text-slate-400">{section}</span>
                    <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{secTasks.length}</span>
                  </div>

                  <div className="space-y-3">
                    {secTasks.map(task => (
                      <div key={task.id} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                            {task.taskNumber}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            task.priority === "CRITICAL" || task.priority === "HIGH" ? "bg-red-950 text-red-400 border-red-900/50" : "bg-slate-950 text-slate-400 border-slate-900/50"
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.description}</p>
                          <p className="text-[9px] text-slate-400 font-sans mt-1">Project: {task.projectName}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-500">
                          <span>Staff: {task.assignedEmployee}</span>
                          <span className="font-mono">Due: {task.dueDate}</span>
                        </div>

                        <div className="pt-2">
                          <select 
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                            className="w-full text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- TAB: TECHNICIANS ----------------- */}
      {activeTab === "techs" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Operational Engineers Roster</h3>
            <p className="text-[10px] text-slate-500">HR metrics detailing technical expertise pools, active splicing workloads & task completion logs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicians.map((tech, idx) => (
              <Card key={idx} className="shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl font-bold font-mono">
                      {tech.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{tech.name}</h4>
                      <p className="text-[9px] text-slate-400">Technical Field Splicer</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Expertise Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {tech.skills?.map((skill: string, sIdx: number) => (
                        <span key={sIdx} className="text-[9px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-sans">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] font-mono">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider font-bold font-sans text-slate-400">Workload</p>
                      <p className="font-bold mt-0.5">{tech.workload} active duties</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider font-bold font-sans text-slate-400">SLA Rating</p>
                      <p className="font-bold mt-0.5 text-amber-500">{tech.rating} ★</p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Duty Completion Rate:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{tech.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full animate-pulse-slow" style={{ width: `${tech.completionRate}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: MAINTENANCE CONTRACTS ----------------- */}
      {activeTab === "contracts" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Broadband Service Level Agreements (SLAs)</h3>
            <Button variant="primary" size="xs" onClick={() => setIsContractModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Log SLA Contract
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map(contract => (
              <Card key={contract.id} className="shadow-sm border-t-4 border-t-amber-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                      {contract.contractNumber}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">
                      {contract.status}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{contract.customerName}</CardTitle>
                  <CardDescription className="text-[10px] font-mono">SLA Tier: {contract.contractType}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider font-mono">Contracted Telemetry Services</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 font-sans leading-relaxed">{contract.servicesIncluded}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-400">Monthly Billing Fee</p>
                      <p className="font-mono font-bold text-slate-850 dark:text-slate-100 text-xs">KES {contract.monthlyFee?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400">Audit Renewal Date</p>
                      <p className="font-mono font-bold text-slate-850 dark:text-slate-100 text-xs">{contract.renewalDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: JOB CARDS ----------------- */}
      {activeTab === "jobcards" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider">Technical Intervention Job Cards</h3>
            <Button variant="primary" size="xs" onClick={() => setIsJobCardModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Log Intervention
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobCards.map(card => (
              <Card key={card.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                      {card.jobNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      card.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" : "bg-amber-950 text-amber-400 border-amber-900/50"
                    }`}>
                      {card.status}
                    </span>
                  </div>
                  <CardTitle className="text-sm mt-2">{card.customerName}</CardTitle>
                  <CardDescription className="text-[10px] font-sans">Issue Logged: {card.issue}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider font-mono">Corrective Action Log</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 font-sans">{card.workDone || "Under assessment."}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider font-mono">Consumables Spliced</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 font-sans">{card.materialsUsed || "None."}</p>
                  </div>
                  {card.customerSignature && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200/50 dark:border-slate-800 text-[10px] space-y-1">
                      <p className="text-slate-400 font-bold font-mono">Client Sign-Off</p>
                      <p className="font-sans text-slate-800 dark:text-slate-200 italic font-bold">✓ Signed by: {card.customerSignature}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: REPORTS ----------------- */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Operational Margin Audit</CardTitle>
              <CardDescription>Comprehensive metrics detailing cost distributions, profitability bounds & material allocations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {projects.map((project, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                    <p className="text-xs font-mono font-bold text-slate-400">{project.projectNumber}</p>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">{project.name}</h5>
                    <div className="space-y-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/60 text-xs">
                      <div className="flex justify-between">
                        <span>Allocated Budget:</span>
                        <span className="font-mono font-bold">KES {project.budget?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Real Costing:</span>
                        <span className="font-mono font-bold">KES {project.totalProjectCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin:</span>
                        <span className="font-mono font-bold text-emerald-500">{project.profitMargin}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: CREATE PROJECT ----------------- */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Instantiate New ICT Project Profile"
        size="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Project Reference Name" 
              placeholder="e.g. Westlands Mall High-Speed Fibre Connection" 
              required 
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
            <Select 
              label="SLA Project Domain" 
              options={[
                { value: "FIBRE_INSTALLATION", label: "Fibre Installation Project" },
                { value: "CCTV_INSTALLATION", label: "CCTV Deployment Grid" },
                { value: "NETWORKING", label: "Networking Backbone routing" },
                { value: "WIRELESS_INSTALLATION", label: "Wireless Link deployment" },
                { value: "MAINTENANCE", label: "Maintenance SLA Contract" },
                { value: "OTHER", label: "Custom Domain" }
              ]}
              value={projectForm.projectType}
              onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Corporate Client Entity" 
              value={projectForm.customerName}
              onChange={(e) => setProjectForm({ ...projectForm, customerName: e.target.value })}
              required
            />
            <Input 
              label="Total Authorized Budget (KES)" 
              type="number"
              placeholder="e.g. 250000" 
              required 
              value={projectForm.budget}
              onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Project Splicing Start Date" 
              type="date"
              required 
              value={projectForm.startDate}
              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
            />
            <Input 
              label="Expected SLA Completion Date" 
              type="date"
              required 
              value={projectForm.expectedCompletionDate}
              onChange={(e) => setProjectForm({ ...projectForm, expectedCompletionDate: e.target.value })}
            />
          </div>

          <Textarea 
            label="Detailed Scope Statement" 
            placeholder="Record fiber route pathways, camera coordinates, or diagnostic benchmarks..." 
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsProjectModalOpen(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
              Instantiate Dossier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: PROJECT DETAIL EXPLORER ----------------- */}
      {selectedProject && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`File Details: ${selectedProject.projectNumber}`}
          size="xl"
        >
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedProject.name}</h4>
              <p className="text-xs text-slate-500 font-sans">{selectedProject.description}</p>
            </div>

            {/* Sub-panels for project integration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Costing & Expenses */}
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Costing Metrics & Profit Audit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-lg">
                      <div>
                        <p className="text-[9px] text-slate-400">Budget</p>
                        <p className="font-mono font-bold">KES {selectedProject.budget?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">Total Expenses</p>
                        <p className="font-mono font-bold">KES {selectedProject.totalProjectCost?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">Profit Margin</p>
                        <p className={`font-mono font-bold ${selectedProject.profitMargin >= 50 ? "text-emerald-500" : "text-amber-500"}`}>{selectedProject.profitMargin}%</p>
                      </div>
                    </div>

                    <form onSubmit={handleAddExpense} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono">Record Real-time Field Expense</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Select 
                          label="Cost Domain" 
                          options={[
                            { value: "LABOUR", label: "Splicing/Field Labour" },
                            { value: "TRANSPORT", label: "Field transit / logistics" },
                            { value: "EQUIPMENT", label: "Optical splitters/hardware" },
                            { value: "OTHER", label: "Miscellaneous overheads" }
                          ]}
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        />
                        <Input 
                          label="Cost (KES)" 
                          type="number"
                          placeholder="e.g. 15000"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <Input 
                        label="Description" 
                        placeholder="e.g. Splicing contractor daily rate" 
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        required
                      />
                      <Button variant="primary" size="xs" type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
                        Post Real-time Expense
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Material Allocation (Integrates with Inventory!) */}
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Material Allocation & Stock Propagation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    {selectedProject.materials?.length > 0 && (
                      <div className="space-y-2">
                        {selectedProject.materials.map((mat: any) => (
                          <div key={mat.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2 border border-slate-200/40 dark:border-slate-800">
                            <div className="flex justify-between font-bold">
                              <span>{mat.productName}</span>
                              <span className="font-mono text-[10px] text-slate-400">{mat.sku}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono text-slate-500">
                              <div>
                                <p>Required</p>
                                <p className="font-bold text-slate-850 dark:text-slate-100">{mat.quantityRequired}</p>
                              </div>
                              <div>
                                <p>Issued</p>
                                <p className="font-bold text-slate-850 dark:text-slate-100">{mat.quantityIssued}</p>
                              </div>
                              <div>
                                <p>Used</p>
                                <p className="font-bold text-slate-850 dark:text-slate-100">{mat.quantityUsed}</p>
                              </div>
                              <div>
                                <p>Returned</p>
                                <p className="font-bold text-slate-850 dark:text-slate-100">{mat.quantityReturned}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                              <Button variant="outline" size="xs" onClick={() => handleMaterialAction(mat.id, "ISSUE", 1)}>
                                Issue 1 Unit
                              </Button>
                              <Button variant="outline" size="xs" onClick={() => handleMaterialAction(mat.id, "USE", 1)}>
                                Mark 1 Used
                              </Button>
                              <Button variant="outline" size="xs" onClick={() => handleMaterialAction(mat.id, "RETURN", 1)}>
                                Return 1 Unit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleAllocateMaterial} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono">Reserve Material from Stock Pools</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Select 
                          label="Target Product" 
                          options={[
                            { value: "prod-1", label: "Mikrotik hEX gr3 Gigabit Router" },
                            { value: "prod-2", label: "Ubiquiti UniFi AC Lite AP" },
                            { value: "prod-3", label: "Hikvision 5MP Dome IP Camera" }
                          ]}
                          value={materialForm.productId}
                          onChange={(e) => setMaterialForm({ ...materialForm, productId: e.target.value })}
                        />
                        <Input 
                          label="Qty to Reserve" 
                          type="number"
                          placeholder="e.g. 5"
                          value={materialForm.quantityRequired}
                          onChange={(e) => setMaterialForm({ ...materialForm, quantityRequired: e.target.value })}
                          required
                        />
                      </div>
                      <Button variant="primary" size="xs" type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
                        Allocate Material Stock
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Specialized Fields: Fibre installation, CCTV, or Certificate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Specialized Form Domain */}
              {selectedProject.projectType === "FIBRE_INSTALLATION" && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Fibre Connection Telemetry Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateFibreRecord} className="space-y-3 text-xs">
                      <Input 
                        label="Route Details (Path description)" 
                        placeholder="e.g. Pole 42 -> Basement A -> Server Cabinet" 
                        value={fibreForm.routeDetails}
                        onChange={(e) => setFibreForm({ ...fibreForm, routeDetails: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          label="Cable Length (meters)" 
                          type="number" 
                          placeholder="e.g. 150" 
                          value={fibreForm.cableLength}
                          onChange={(e) => setFibreForm({ ...fibreForm, cableLength: e.target.value })}
                          required
                        />
                        <Input 
                          label="Optical Signal (dBm)" 
                          placeholder="e.g. -19.4" 
                          value={fibreForm.signalTestResults}
                          onChange={(e) => setFibreForm({ ...fibreForm, signalTestResults: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          label="ONT Serial Number" 
                          placeholder="e.g. ONT-HW-2026" 
                          value={fibreForm.ontSerialNumber}
                          onChange={(e) => setFibreForm({ ...fibreForm, ontSerialNumber: e.target.value })}
                          required
                        />
                        <Input 
                          label="Router Assigned" 
                          placeholder="e.g. Mikrotik hEX gr3" 
                          value={fibreForm.router}
                          onChange={(e) => setFibreForm({ ...fibreForm, router: e.target.value })}
                          required
                        />
                      </div>
                      <Button variant="primary" size="xs" type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold border-none">
                        Lock Fibre Telemetry Record
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {selectedProject.projectType === "CCTV_INSTALLATION" && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Surveillance Layout Grid Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCctvRecord} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          label="Camera Quantity" 
                          type="number" 
                          placeholder="e.g. 12" 
                          value={cctvForm.cameraQuantity}
                          onChange={(e) => setCctvForm({ ...cctvForm, cameraQuantity: e.target.value })}
                          required
                        />
                        <Input 
                          label="Camera Type Details" 
                          placeholder="e.g. IP Dome 5MP Weatherproof" 
                          value={cctvForm.cameraType}
                          onChange={(e) => setCctvForm({ ...cctvForm, cameraType: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          label="NVR/DVR Model" 
                          placeholder="e.g. Hikvision NVR 16-Ch" 
                          value={cctvForm.dvrNvrModel}
                          onChange={(e) => setCctvForm({ ...cctvForm, dvrNvrModel: e.target.value })}
                          required
                        />
                        <Input 
                          label="Storage Retention Size" 
                          placeholder="e.g. 4TB Surveillance HDD" 
                          value={cctvForm.storageCapacity}
                          onChange={(e) => setCctvForm({ ...cctvForm, storageCapacity: e.target.value })}
                          required
                        />
                      </div>
                      <Button variant="primary" size="xs" type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold border-none">
                        Lock CCTV Parameters
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Generate Completion Certificate */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Aesthetic Quality & Completion Cert</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCertificate} className="space-y-3 text-xs">
                    <Input 
                      label="Scope Work Completed Summary" 
                      placeholder="e.g. Laying of drop cables and core splicing complete." 
                      value={certForm.workCompleted}
                      onChange={(e) => setCertForm({ ...certForm, workCompleted: e.target.value })}
                      required
                    />
                    <Input 
                      label="Equipment Handed Over List" 
                      placeholder="e.g. 1x Router (S/N: 77890)" 
                      value={certForm.equipmentInstalled}
                      onChange={(e) => setCertForm({ ...certForm, equipmentInstalled: e.target.value })}
                      required
                    />
                    <Input 
                      label="Client Approval Officer Name" 
                      placeholder="e.g. John Wambua" 
                      value={certForm.customerApprovalName}
                      onChange={(e) => setCertForm({ ...certForm, customerApprovalName: e.target.value })}
                      required
                    />
                    <Button variant="primary" size="xs" type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
                      Issue & Sign Certificate
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Celcom Networks ERP Project File</span>
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close File
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ----------------- MODAL: CREATE SITE SURVEY ----------------- */}
      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title="Register Site Inspection Dossier"
        size="lg"
      >
        <form onSubmit={handleCreateSurvey} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Corporate Client Entity" 
              value={surveyForm.customerName}
              onChange={(e) => setSurveyForm({ ...surveyForm, customerName: e.target.value })}
              required
            />
            <Input 
              label="Physical Location Coordinates" 
              placeholder="e.g. Ring Road Westlands, Block C" 
              value={surveyForm.location}
              onChange={(e) => setSurveyForm({ ...surveyForm, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="GPS Coordinates (Latitude, Longitude)" 
              placeholder="e.g. -1.2644, 36.8044" 
              value={surveyForm.gpsCoordinates}
              onChange={(e) => setSurveyForm({ ...surveyForm, gpsCoordinates: e.target.value })}
              required
            />
            <Input 
              label="Inspection Date" 
              type="date"
              value={surveyForm.surveyDate}
              onChange={(e) => setSurveyForm({ ...surveyForm, surveyDate: e.target.value })}
              required
            />
          </div>

          <Textarea 
            label="Specific Requirements Discovered" 
            placeholder="Describe fiber conduit gaps, splicing racks, or power specifications..." 
            value={surveyForm.requirements}
            onChange={(e) => setSurveyForm({ ...surveyForm, requirements: e.target.value })}
            required
          />

          <Textarea 
            label="Telemetry Splicing Recommendations" 
            placeholder="e.g. Utilize existing riser route in Basement B with armored sleeves." 
            value={surveyForm.recommendations}
            onChange={(e) => setSurveyForm({ ...surveyForm, recommendations: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Estimated Labour Budget (KES)" 
              type="number"
              placeholder="e.g. 15000"
              value={surveyForm.estimatedLabourCost}
              onChange={(e) => setSurveyForm({ ...surveyForm, estimatedLabourCost: e.target.value })}
              required
            />
            <Select 
              label="Assigned Lead Splicer" 
              options={[
                { value: "Joseph Kariuki", label: "Joseph Kariuki" },
                { value: "David Mwangi", label: "David Mwangi" },
                { value: "Samuel Ndung'u", label: "Samuel Ndung'u" }
              ]}
              value={surveyForm.surveyTechnician}
              onChange={(e) => setSurveyForm({ ...surveyForm, surveyTechnician: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsSurveyModalOpen(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
              Save Inspect File
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: CREATE TASK ----------------- */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Assign Technical Duty Task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <Select 
            label="Select Active Project" 
            options={projects.map(p => ({ value: p.id, label: `${p.projectNumber} - ${p.name}` }))}
            value={taskForm.projectId}
            onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
            required
          />

          <Select 
            label="Assigned Engineer" 
            options={[
              { value: "Joseph Kariuki", label: "Joseph Kariuki" },
              { value: "David Mwangi", label: "David Mwangi" },
              { value: "Samuel Ndung'u", label: "Samuel Ndung'u" }
            ]}
            value={taskForm.assignedEmployee}
            onChange={(e) => setTaskForm({ ...taskForm, assignedEmployee: e.target.value })}
          />

          <Input 
            label="Duty Description" 
            placeholder="e.g. laying of armored drop patch fiber conduits" 
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input 
              label="Start Date" 
              type="date" 
              value={taskForm.startDate}
              onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
              required
            />
            <Input 
              label="Due Date" 
              type="date" 
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              required
            />
          </div>

          <Select 
            label="SLA Priority Severity" 
            options={[
              { value: "LOW", label: "LOW Severity" },
              { value: "MEDIUM", label: "MEDIUM Severity" },
              { value: "HIGH", label: "HIGH Severity" },
              { value: "CRITICAL", label: "CRITICAL SLA Override" }
            ]}
            value={taskForm.priority}
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
              Dispatch Duty
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: CREATE SLA CONTRACT ----------------- */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Issue New Broadband Service Agreement (SLA)"
        size="lg"
      >
        <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Input 
              label="Corporate Client Entity" 
              value={contractForm.customerName}
              onChange={(e) => setContractForm({ ...contractForm, customerName: e.target.value })}
              required
            />
            <Select 
              label="SLA Premium Tier" 
              options={[
                { value: "ANNUAL_PREMIUM", label: "Gold SLA - Premium Support" },
                { value: "ANNUAL_STANDARD", label: "Silver SLA - Standard Support" },
                { value: "MONTHLY_FIBER", label: "Bronze SLA - Home Fiber" }
              ]}
              value={contractForm.contractType}
              onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input 
              label="Monthly SLA Billing (KES)" 
              type="number"
              placeholder="e.g. 25000"
              value={contractForm.monthlyFee}
              onChange={(e) => setContractForm({ ...contractForm, monthlyFee: e.target.value })}
              required
            />
            <Input 
              label="Agreement Start Date" 
              type="date"
              value={contractForm.startDate}
              onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input 
              label="Agreement Term End Date" 
              type="date"
              value={contractForm.endDate}
              onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
              required
            />
            <Input 
              label="SLA Renewal Evaluation Date" 
              type="date"
              value={contractForm.monthlyFee} // bind as fallback, or simple string input
              onChange={(e) => setContractForm({ ...contractForm, monthlyFee: e.target.value })}
              required
            />
          </div>

          <Textarea 
            label="Inclusions Scope of Services" 
            placeholder="Record response limits, physical fiber splicing SLA hours, backups, or telemetry protocols..." 
            value={contractForm.servicesIncluded}
            onChange={(e) => setContractForm({ ...contractForm, servicesIncluded: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsContractModalOpen(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
              Sign SLA Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------- MODAL: CREATE JOB CARD ----------------- */}
      <Modal
        isOpen={isJobCardModalOpen}
        onClose={() => setIsJobCardModalOpen(false)}
        title="Issue Field Technical intervention Job Card"
        size="lg"
      >
        <form onSubmit={handleCreateJobCard} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Input 
              label="Client Legal Entity" 
              value={jobCardForm.customerName}
              onChange={(e) => setJobCardForm({ ...jobCardForm, customerName: e.target.value })}
              required
            />
            <Input 
              label="Dispatched Intervention Date" 
              type="date"
              value={jobCardForm.date}
              onChange={(e) => setJobCardForm({ ...jobCardForm, date: e.target.value })}
              required
            />
          </div>

          <Textarea 
            label="Issue Logged Diagnostics" 
            placeholder="e.g. Sub-segment fiber packet loss, faulty optical transmitter" 
            value={jobCardForm.issue}
            onChange={(e) => setJobCardForm({ ...jobCardForm, issue: e.target.value })}
            required
          />

          <Textarea 
            label="Resolution Corrective Actions Completed" 
            placeholder="e.g. Core splicing secured, re-testing signal levels." 
            value={jobCardForm.workDone}
            onChange={(e) => setJobCardForm({ ...jobCardForm, workDone: e.target.value })}
            required
          />

          <Input 
            label="Consumables Spliced / Issued" 
            placeholder="e.g. 1x armor-plated optical sleeve, 5m drop cable" 
            value={jobCardForm.materialsUsed}
            onChange={(e) => setJobCardForm({ ...jobCardForm, materialsUsed: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Select 
              label="Assigned Lead Technician" 
              options={[
                { value: "David Mwangi", label: "David Mwangi" },
                { value: "Joseph Kariuki", label: "Joseph Kariuki" },
                { value: "Samuel Ndung'u", label: "Samuel Ndung'u" }
              ]}
              value={jobCardForm.technician}
              onChange={(e) => setJobCardForm({ ...jobCardForm, technician: e.target.value })}
            />
            <Input 
              label="Customer Approval Sign-off Name" 
              placeholder="e.g. John Wambua" 
              value={jobCardForm.customerSignature}
              onChange={(e) => setJobCardForm({ ...jobCardForm, customerSignature: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsJobCardModalOpen(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none">
              Sign & Lock Job Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ProjectsPage;
