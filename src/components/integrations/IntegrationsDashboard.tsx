import React, { useState, useEffect, useMemo } from "react";
import {
  Cable,
  Activity,
  Key,
  FileCode,
  Terminal,
  Settings,
  RefreshCw,
  Play,
  Send,
  Wifi,
  HardDrive,
  MapPin,
  Mail,
  MessageSquare,
  Database,
  Code,
  Plus,
  Trash,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Sliders,
  Copy,
  ChevronRight
} from "lucide-react";

import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { Input, Select, Textarea, Checkbox } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { LoadingScreen } from "../ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";

export default function IntegrationsDashboard() {
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<"health" | "sandboxes" | "credentials" | "templates" | "logs">("health");

  // API Data States
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<any>(null);
  const [healthStatuses, setHealthStatuses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Pinging Loading State
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Sandboxes State
  const [mpesaPhone, setMpesaPhone] = useState("+254712345678");
  const [mpesaAmount, setMpesaAmount] = useState("2500");
  const [mpesaAcct, setMpesaAcct] = useState("CEL-89403");
  const [lastCheckoutId, setLastCheckoutId] = useState<string>("");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const [msgChannel, setMsgChannel] = useState<"SMS" | "WHATSAPP">("SMS");
  const [msgRecipient, setMsgRecipient] = useState("+254712345678");
  const [msgTemplateId, setMsgTemplateId] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);

  const [mtUsername, setMtUsername] = useState("james_thika");
  const [mtSpeed, setMtSpeed] = useState("Celcom Home 15Mbps");
  const [mtAction, setMtAction] = useState<"ACTIVATE" | "SUSPEND">("ACTIVATE");
  const [mtLoading, setMtLoading] = useState(false);
  const [mtCliLogs, setMtCliLogs] = useState<string[]>([]);

  const [backupName, setBackupName] = useState("ledger_db_backup_july.sql");
  const [backupSize, setBackupSize] = useState("12.4");
  const [backupLoading, setBackupLoading] = useState(false);

  const [geoAddress, setGeoAddress] = useState("Mombasa Road OLT Gateway");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<any>(null);

  // Templates CRUD State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    channel: "SMS" as "SMS" | "WHATSAPP" | "EMAIL",
    triggerEvent: "",
    subject: "",
    bodyTemplate: "",
    variables: [] as string[],
  });

  // Mask toggles
  const [showSecretKeys, setShowSecretKeys] = useState(false);

  // Fetch all endpoints
  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = {
        "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
        "Content-Type": "application/json"
      };

      const [healthRes, credsRes, logsRes, jobsRes, tempsRes] = await Promise.all([
        fetch("/api/v1/integrations/health", { headers }),
        fetch("/api/v1/integrations/credentials", { headers }),
        fetch("/api/v1/integrations/audit-logs", { headers }),
        fetch("/api/v1/integrations/jobs", { headers }),
        fetch("/api/v1/integrations/templates", { headers })
      ]);

      const healthData = await healthRes.json();
      const credsData = await credsRes.json();
      const logsData = await logsRes.json();
      const jobsData = await jobsRes.json();
      const tempsData = await tempsRes.json();

      if (healthData.success) setHealthStatuses(healthData.health);
      if (credsData.success) setCredentials(credsData.credentials);
      if (logsData.success) setAuditLogs(logsData.logs);
      if (jobsData.success) setJobs(jobsData.jobs);
      if (tempsData.success) {
        setTemplates(tempsData.templates);
        if (tempsData.templates.length > 0 && !msgTemplateId) {
          setMsgTemplateId(tempsData.templates[0].id);
        }
      }
    } catch (err: any) {
      showNotification("Fetch Error", "Could not synchronize integrations store endpoints.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Auto sync background jobs periodically
    const timer = setInterval(() => fetchAllData(true), 15000);
    return () => clearInterval(timer);
  }, []);

  // Diagnostic Ping trigger
  const handlePing = async (id: string) => {
    setPingingId(id);
    try {
      const res = await fetch(`/api/v1/integrations/health/${id}/ping`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success) {
        // update local health state
        setHealthStatuses(prev => prev.map(h => h.id === id ? data.status : h));
        showNotification(
          "Diagnostics Complete",
          `Ping status for ${data.status.name} returned ${data.status.status} (${data.status.latencyMs}ms)`,
          data.status.status === "ONLINE" ? "success" : "warning"
        );
        fetchAllData(true);
      } else {
        showNotification("Diagnostic Failed", data.error || "Permission Denied", "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Failed to compile gateway ping diagnostic.", "error");
    } finally {
      setPingingId(null);
    }
  };

  // Run or retry memory job
  const handleRunJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/v1/integrations/jobs/${jobId}/run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          "Job Dispatched",
          `Background job [${data.job.taskName}] updated to: ${data.job.status}`,
          data.job.status === "COMPLETED" ? "success" : "warning"
        );
        fetchAllData(true);
      } else {
        showNotification("Dispatcher Failed", data.error || "Execution error", "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Failed to contact background scheduler.", "error");
    }
  };

  // Credentials form update
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/integrations/credentials", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials);
        showNotification("Credentials Written", "Successfully updated secure gateway parameters", "success");
        fetchAllData(true);
      } else {
        showNotification("Save Failed", data.error || "Permission Denied", "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Failed to update configurations securely.", "error");
    }
  };

  // Template CRUD handlers
  const handleOpenTemplateModal = (temp?: any) => {
    if (temp) {
      setTemplateForm({
        id: temp.id,
        name: temp.name,
        channel: temp.channel,
        triggerEvent: temp.triggerEvent,
        subject: temp.subject || "",
        bodyTemplate: temp.bodyTemplate,
        variables: temp.variables || [],
      });
    } else {
      setTemplateForm({
        id: "",
        name: "",
        channel: "SMS",
        triggerEvent: "CUSTOM_EVENT",
        subject: "",
        bodyTemplate: "",
        variables: ["customerName"],
      });
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.bodyTemplate || !templateForm.triggerEvent) {
      showNotification("Incomplete Template", "Please specify a name, event trigger, and body format.", "error");
      return;
    }

    try {
      // Auto-extract double braces variables from string
      const regex = /\{\{([^}]+)\}\}/g;
      let match;
      const extractedVars: string[] = [];
      while ((match = regex.exec(templateForm.bodyTemplate)) !== null) {
        const v = match[1].trim();
        if (!extractedVars.includes(v)) extractedVars.push(v);
      }

      const payload = {
        ...templateForm,
        variables: extractedVars,
      };

      const res = await fetch("/api/v1/integrations/templates", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Template Saved", "Trigger configuration written to templates engine.", "success");
        setIsTemplateModalOpen(false);
        fetchAllData(true);
      } else {
        showNotification("Failed to Save", data.error || "Access Denied", "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Could not connect to Templates microservice.", "error");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification profile?")) return;
    try {
      const res = await fetch(`/api/v1/integrations/templates/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Template Deleted", "Template profile removed cleanly", "success");
        fetchAllData(true);
      } else {
        showNotification("Failed to Delete", data.error || "Access Denied", "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Could not contact templates microservice.", "error");
    }
  };

  // -----------------------------------------------------------------
  // SANDBOX SIMULATIONS HANDLERS
  // -----------------------------------------------------------------
  const handleTriggerStk = async () => {
    setMpesaLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/actions/mpesa-stk", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: mpesaPhone,
          amount: mpesaAmount,
          accountCode: mpesaAcct
        })
      });
      const data = await res.json();
      if (data.checkoutId) {
        setLastCheckoutId(data.checkoutId);
        showNotification("STK Pushed", data.message, "success");
        fetchAllData(true);
      } else {
        showNotification("STK Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Gateway Error", "Failed to dispatch STK push command", "error");
    } finally {
      setMpesaLoading(false);
    }
  };

  const handleSimulateWebhook = async (success: boolean) => {
    if (!lastCheckoutId) {
      showNotification("No checkout request", "Please trigger an STK Push first to acquire a checkout ID", "warning");
      return;
    }
    setWebhookLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/actions/mpesa-webhook", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          checkoutId: lastCheckoutId,
          success
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          success ? "Payment Reconciled" : "Callback Processed",
          data.message,
          success ? "success" : "info"
        );
        fetchAllData(true);
      } else {
        showNotification("Callback Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Webhook Error", "Could not simulate incoming webhook packet", "error");
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgTemplateId) {
      showNotification("Select Template", "Please select a template to format the dispatch body.", "warning");
      return;
    }
    setMsgLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/actions/send-message", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel: msgChannel,
          recipient: msgRecipient,
          templateId: msgTemplateId
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          "Outbound Dispatched",
          `Message queued. Simulated compiled body: "${data.compiledBody.substring(0, 45)}..."`,
          "success"
        );
        fetchAllData(true);
      } else {
        showNotification("Dispatch Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Dispatch Error", "Could not connect to Outbound API.", "error");
    } finally {
      setMsgLoading(false);
    }
  };

  const handleMikrotikSync = async () => {
    setMtLoading(true);
    setMtCliLogs([]);
    try {
      const res = await fetch("/api/v1/integrations/actions/mikrotik-sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: mtUsername,
          speed: mtSpeed,
          action: mtAction
        })
      });
      const data = await res.json();
      if (data.success) {
        setMtCliLogs(data.cliLogs || []);
        showNotification(
          "RouterOS Configured",
          `OLT subscribers synced successfully. CLI commands executed cleanly.`,
          "success"
        );
        fetchAllData(true);
      } else {
        showNotification("Sync Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Sync Error", "Could not connect to RouterOS API.", "error");
    } finally {
      setMtLoading(false);
    }
  };

  const handleCloudBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/actions/cloud-backup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: backupName,
          fileSizeMb: backupSize
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          "Backup Transmitted",
          `Secure block binary written to storage key: ${data.objectKey}`,
          "success"
        );
        fetchAllData(true);
      } else {
        showNotification("Backup Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Backup Error", "Cloud Storage API connection failed.", "error");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleGeocode = async () => {
    setGeoLoading(true);
    setGeoCoords(null);
    try {
      const res = await fetch("/api/v1/integrations/actions/geocode", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("celcom_access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: geoAddress
        })
      });
      const data = await res.json();
      if (data.resolvedAddress) {
        setGeoCoords(data.coordinates);
        showNotification(
          "Coordinates Geocoded",
          `Successfully mapped address to Google Maps Platform coordinates: ${data.coordinates.lat}, ${data.coordinates.lng}`,
          "success"
        );
        fetchAllData(true);
      } else {
        showNotification("Geocoding Failed", data.error, "error");
      }
    } catch (err) {
      showNotification("Geocoding Error", "Failed to contact Google Maps API.", "error");
    } finally {
      setGeoLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen type="full" />;
  }

  return (
    <div className="space-y-6">
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-5 px-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-500">
            <Cable className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              External Integrations Module
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gateway interfaces, secure parameters settings, notifications templates, and live diagnostics playground.
            </p>
          </div>
        </div>
        <div className="relative z-10 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => fetchAllData()}>
            Force Sync
          </Button>
        </div>
      </div>

      {/* Tabs Layout Button Rail */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("health")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "health"
              ? "border-sky-500 text-sky-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Activity className="h-4 w-4" />
          API Health & Diagnostics
        </button>
        <button
          onClick={() => setActiveTab("sandboxes")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "sandboxes"
              ? "border-sky-500 text-sky-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Terminal className="h-4 w-4" />
          Integration Sandboxes
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "credentials"
              ? "border-sky-500 text-sky-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Key className="h-4 w-4" />
          Secure API Keyring
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "templates"
              ? "border-sky-500 text-sky-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileCode className="h-4 w-4" />
          Templates Engine
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-sky-500 text-sky-500"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Audit Trail & Jobs
        </button>
      </div>

      {/* TAB CONTENT MODULES */}
      
      {/* 1. HEALTH AND DIAGNOSTICS */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {healthStatuses.map((hs) => {
              const isOnline = hs.status === "ONLINE";
              const isDegraded = hs.status === "DEGRADED";
              return (
                <Card key={hs.id} borderAccent={isOnline}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {hs.category === "PAYMENT" && <Database className="h-4 w-4 text-sky-500" />}
                        {hs.category === "EMAIL" && <Mail className="h-4 w-4 text-violet-500" />}
                        {hs.category === "SMS" && <MessageSquare className="h-4 w-4 text-emerald-500" />}
                        {hs.category === "WHATSAPP" && <MessageSquare className="h-4 w-4 text-green-500" />}
                        {hs.category === "ROUTER" && <Wifi className="h-4 w-4 text-amber-500" />}
                        {hs.category === "MAPS" && <MapPin className="h-4 w-4 text-red-500" />}
                        {hs.category === "STORAGE" && <HardDrive className="h-4 w-4 text-indigo-500" />}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        isOnline 
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                          : isDegraded 
                            ? "bg-amber-950/40 text-amber-400 border-amber-900/50" 
                            : "bg-red-950/40 text-red-400 border-red-900/50"
                      }`}>
                        {hs.status}
                      </span>
                    </div>
                    <CardTitle className="mt-3 text-sm font-bold tracking-tight">{hs.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-semibold text-slate-400">{hs.category} GATEWAY</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Response Latency:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {hs.status === "OFFLINE" ? "—" : `${hs.latencyMs} ms`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Uptime SLA:</span>
                      <span className="font-mono font-bold text-emerald-500">{hs.uptimePercentage}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 p-2 rounded line-clamp-2 h-11">
                      "{hs.responseMessage}"
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Checked: {new Date(hs.lastChecked).toLocaleTimeString()}</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handlePing(hs.id)}
                      isLoading={pingingId === hs.id}
                      className="px-2"
                    >
                      Ping Test
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-mono">7 / 7</h3>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Active Integrations</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-sky-500/10 p-3 rounded-xl text-sky-500 border border-sky-500/20">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-mono">112 ms</h3>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Mean Response Latency</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-violet-500/10 p-3 rounded-xl text-violet-500 border border-violet-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-mono">99.88%</h3>
                  <p className="text-xs text-slate-400 uppercase font-semibold">System SLA Reliability</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. INTEGRATION SANDBOXES */}
      {activeTab === "sandboxes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Sandbox Forms List */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SANDBOX A: Safaricom M-Pesa C2B / B2C */}
            <Card borderAccent>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-500" />
                  Safaricom M-Pesa Daraja Gateway Sandbox
                </CardTitle>
                <CardDescription>
                  Simulate dynamic Safaricom billing. Trigger customers STK pushes and receive API callbacks directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Kenyan Mobile Number"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g. +254712345678"
                  />
                  <Input
                    label="Transaction Amount (KES)"
                    type="number"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    placeholder="e.g. 2500"
                  />
                  <Input
                    label="Broadband Account Reference"
                    value={mpesaAcct}
                    onChange={(e) => setMpesaAcct(e.target.value)}
                    placeholder="e.g. CEL-89403"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTriggerStk}
                    isLoading={mpesaLoading}
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                  >
                    Simulate STK Push (API)
                  </Button>
                </div>

                {lastCheckoutId && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Acquired Checkout ID:</span>
                      <span className="font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">
                        {lastCheckoutId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Safaricom Daraja API acts asynchronously. Trigger the webhook callbacks below to simulate the customer entering their PIN (Success) or canceling the request.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5"
                        onClick={() => handleSimulateWebhook(true)}
                        isLoading={webhookLoading}
                      >
                        Callback: Success (Reconcile Invoice)
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-red-500 border-red-500/20 hover:bg-red-500/5"
                        onClick={() => handleSimulateWebhook(false)}
                        isLoading={webhookLoading}
                      >
                        Callback: Cancelled by User
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SANDBOX B: SMS / WhatsApp Dispatcher */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  Omnichannel Notification Dispatch Box
                </CardTitle>
                <CardDescription>
                  Simulate SMS (Africa's Talking) and WhatsApp Business template notifications with real parameter compiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Channel Protocol"
                    options={[
                      { value: "SMS", label: "Sms Gateway (AfricasTalking)" },
                      { value: "WHATSAPP", label: "WhatsApp Cloud API" },
                    ]}
                    value={msgChannel}
                    onChange={(e) => setMsgChannel(e.target.value as any)}
                  />
                  <Input
                    label="Recipient Address"
                    value={msgRecipient}
                    onChange={(e) => setMsgRecipient(e.target.value)}
                    placeholder="e.g. +254712345678"
                  />
                  <Select
                    label="Choose Template Profile"
                    options={templates
                      .filter((t) => t.channel === msgChannel || (msgChannel === "SMS" && t.channel === "SMS"))
                      .map((t) => ({ value: t.id, label: `${t.name} (${t.channel})` }))}
                    value={msgTemplateId}
                    onChange={(e) => setMsgTemplateId(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendMessage}
                    isLoading={msgLoading}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Simulate Dispatch Alert
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SANDBOX C: MikroTik RouterOS Core Sync */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-amber-500" />
                  MikroTik RouterOS OLT Subscriber Sync
                </CardTitle>
                <CardDescription>
                  Synchronize active GPON broadband subscribers PPPoE profiles, speed caps, and block filters on the OLT core.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="PPPoE Subscriber Username"
                    value={mtUsername}
                    onChange={(e) => setMtUsername(e.target.value)}
                  />
                  <Select
                    label="Bandwidth Profile Cap"
                    options={[
                      { value: "Celcom Home 15Mbps", label: "Home Base (15Mbps)" },
                      { value: "Celcom Business 30Mbps", label: "Business Premium (30Mbps)" },
                      { value: "Celcom Dedicated 100Mbps", label: "Dedicated Fiber (100Mbps)" },
                    ]}
                    value={mtSpeed}
                    onChange={(e) => setMtSpeed(e.target.value)}
                  />
                  <Select
                    label="Operational Action"
                    options={[
                      { value: "ACTIVATE", label: "ACTIVATE (Provision)" },
                      { value: "SUSPEND", label: "SUSPEND (Block traffic)" },
                    ]}
                    value={mtAction}
                    onChange={(e) => setMtAction(e.target.value as any)}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMikrotikSync}
                    isLoading={mtLoading}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Sync RouterOS Configuration
                  </Button>
                </div>

                {mtCliLogs.length > 0 && (
                  <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
                    <p className="text-amber-500 font-bold flex items-center gap-1.5 pb-1 border-b border-slate-800">
                      <Terminal className="h-3.5 w-3.5" /> Terminal RouterOS Session (CLI)
                    </p>
                    {mtCliLogs.map((log, idx) => (
                      <p key={idx} className={log.startsWith("/") ? "text-sky-400" : "text-slate-400"}>
                        {log.startsWith("/") ? "[admin@mombasa_rd_olt] > " : ""}{log}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SANDBOX D: Google Maps Platform Geocoder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Google Maps Platform Address Geocoder
                </CardTitle>
                <CardDescription>
                  Geocode subscriber installation addresses to resolve exact latitude & longitude coordinates for network GPON outage mapping.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    label="Installation Address Query"
                    value={geoAddress}
                    onChange={(e) => setGeoAddress(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGeocode}
                    isLoading={geoLoading}
                    leftIcon={<MapPin className="h-3.5 w-3.5" />}
                  >
                    Geocode Coordinates
                  </Button>

                  {geoCoords && (
                    <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-mono font-semibold">
                      <CheckCircle className="h-4 w-4" />
                      Lat: {geoCoords.lat.toFixed(6)}, Lng: {geoCoords.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Secondary Sandboxes: Backup Storage, Quick status */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Cloud Storage Backer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-indigo-500" />
                  R2/S3 Backups Simulator
                </CardTitle>
                <CardDescription>
                  Transmit daily database dump backups of the general double-entry book ledger.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Target Dump SQL File"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                />
                <Input
                  label="Est. File Size (MB)"
                  type="number"
                  value={backupSize}
                  onChange={(e) => setBackupSize(e.target.value)}
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCloudBackup}
                  isLoading={backupLoading}
                  className="w-full"
                  leftIcon={<Database className="h-3.5 w-3.5" />}
                >
                  Initiate Secure Upload
                </Button>
              </CardContent>
            </Card>

            {/* Quick Webhook Help Box */}
            <Card className="bg-sky-950/20 border-sky-900/50">
              <CardContent className="p-5 space-y-3 text-xs text-sky-400">
                <h4 className="font-bold flex items-center gap-1.5 text-sky-300">
                  <Code className="h-4 w-4" /> Webhook Architecture
                </h4>
                <p>
                  ERP integrations are designed with a stateless event architecture. Webhooks listen at:
                </p>
                <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] text-sky-300 border border-sky-900/50 overflow-x-auto select-all">
                  POST /api/v1/integrations/actions/mpesa-webhook
                </div>
                <p className="text-[11px] text-sky-500 leading-relaxed">
                  Incoming payload formats match Safaricom C2B API body schemes. When parsed, transaction registers sync instantly to double-entry general accounts ledger structures.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {/* 3. SECURE API PARAMETERS KEYRING */}
      {activeTab === "credentials" && (
        <form onSubmit={handleSaveCredentials} className="space-y-6">
          <Card borderAccent>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-sky-500" />
                  API Credential Parameters Keyring
                </CardTitle>
                <CardDescription>
                  Manage OAuth credentials, host connections, API keys, and secure verify tokens for Celcom ERP gateway integrations.
                </CardDescription>
              </div>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setShowSecretKeys(!showSecretKeys)}
                type="button"
                leftIcon={showSecretKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              >
                {showSecretKeys ? "Mask Parameters" : "Show Parameters"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
              
              {/* SECTION A: Safaricom M-Pesa */}
              {credentials?.mpesa && (
                <div className="space-y-4 pt-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Database className="h-4 w-4 text-sky-500" /> Safaricom Daraja M-Pesa API Keyring
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Consumer Key"
                      type={showSecretKeys ? "text" : "password"}
                      value={credentials.mpesa.consumerKey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        mpesa: { ...credentials.mpesa, consumerKey: e.target.value }
                      })}
                    />
                    <Input
                      label="Consumer Secret"
                      type={showSecretKeys ? "text" : "password"}
                      value={credentials.mpesa.consumerSecret}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        mpesa: { ...credentials.mpesa, consumerSecret: e.target.value }
                      })}
                    />
                    <Input
                      label="STK Passkey"
                      type={showSecretKeys ? "text" : "password"}
                      value={credentials.mpesa.passkey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        mpesa: { ...credentials.mpesa, passkey: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Shortcode / Paybill"
                        value={credentials.mpesa.shortcode}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          mpesa: { ...credentials.mpesa, shortcode: e.target.value }
                        })}
                      />
                      <Select
                        label="Gateway Mode"
                        options={[
                          { value: "sandbox", label: "Sandbox Test" },
                          { value: "production", label: "Production Live" },
                        ]}
                        value={credentials.mpesa.mode}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          mpesa: { ...credentials.mpesa, mode: e.target.value as any }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: SMTP Relay */}
              {credentials?.smtp && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-500" /> SMTP Mail Outbound Relay
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="SMTP Server Hostname"
                      value={credentials.smtp.host}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        smtp: { ...credentials.smtp, host: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="SMTP Port"
                        type="number"
                        value={credentials.smtp.port}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          smtp: { ...credentials.smtp, port: Number(e.target.value) }
                        })}
                      />
                      <Select
                        label="Security TLS/SSL"
                        options={[
                          { value: "true", label: "Secure SSL/TLS" },
                          { value: "false", label: "None / Plain text" },
                        ]}
                        value={String(credentials.smtp.secure)}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          smtp: { ...credentials.smtp, secure: e.target.value === "true" }
                        })}
                      />
                    </div>
                    <Input
                      label="SMTP Relay Username"
                      value={credentials.smtp.username}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        smtp: { ...credentials.smtp, username: e.target.value }
                      })}
                    />
                    <Input
                      label="Sender Address Header (From Email)"
                      value={credentials.smtp.fromEmail}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        smtp: { ...credentials.smtp, fromEmail: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* SECTION C: SMS Gateway */}
              {credentials?.sms && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" /> SMS Bulk Gateway
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="API Gateway URL"
                      value={credentials.sms.apiUrl}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        sms: { ...credentials.sms, apiUrl: e.target.value }
                      })}
                    />
                    <Input
                      label="API Access Key"
                      type={showSecretKeys ? "text" : "password"}
                      value={credentials.sms.apiKey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        sms: { ...credentials.sms, apiKey: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Alphanumeric Sender ID"
                        value={credentials.sms.senderId}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          sms: { ...credentials.sms, senderId: e.target.value }
                        })}
                      />
                      <Select
                        label="Partner Telecom Provider"
                        options={[
                          { value: "AfricasTalking", label: "Africa's Talking" },
                          { value: "Twilio", label: "Twilio API" },
                          { value: "Advanta", label: "Advanta Africa" },
                        ]}
                        value={credentials.sms.provider}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          sms: { ...credentials.sms, provider: e.target.value as any }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION D: MikroTik RouterOS API */}
              {credentials?.mikrotik && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-amber-500" /> MikroTik RouterOS Gateway
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Router WAN IP / Host"
                      value={credentials.mikrotik.host}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        mikrotik: { ...credentials.mikrotik, host: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Port"
                        type="number"
                        value={credentials.mikrotik.port}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          mikrotik: { ...credentials.mikrotik, port: Number(e.target.value) }
                        })}
                      />
                      <Select
                        label="Enable API Bridge"
                        options={[
                          { value: "true", label: "BRIDGE ACTIVE" },
                          { value: "false", label: "DISABLED" },
                        ]}
                        value={String(credentials.mikrotik.apiEnabled)}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          mikrotik: { ...credentials.mikrotik, apiEnabled: e.target.value === "true" }
                        })}
                      />
                    </div>
                    <Input
                      label="Router Access User"
                      value={credentials.mikrotik.username}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        mikrotik: { ...credentials.mikrotik, username: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* SECTION E: Google Maps Platform */}
              {credentials?.googleMaps && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" /> Google Maps API Keyring
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Google Maps API Key"
                      type={showSecretKeys ? "text" : "password"}
                      value={credentials.googleMaps.apiKey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        googleMaps: { ...credentials.googleMaps, apiKey: e.target.value }
                      })}
                    />
                    <Input
                      label="Map Custom ID"
                      value={credentials.googleMaps.mapId}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        googleMaps: { ...credentials.googleMaps, mapId: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* SECTION F: Cloud Storage Backer */}
              {credentials?.cloudStorage && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-indigo-500" /> Cloud Backup Storage Keyring
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Access Key ID"
                      value={credentials.cloudStorage.accessKeyId}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        cloudStorage: { ...credentials.cloudStorage, accessKeyId: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="S3 Bucket Name"
                        value={credentials.cloudStorage.bucketName}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          cloudStorage: { ...credentials.cloudStorage, bucketName: e.target.value }
                        })}
                      />
                      <Select
                        label="Provider"
                        options={[
                          { value: "CLOUDFLARE_R2", label: "Cloudflare R2" },
                          { value: "AWS_S3", label: "Amazon Web Services S3" },
                        ]}
                        value={credentials.cloudStorage.provider}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          cloudStorage: { ...credentials.cloudStorage, provider: e.target.value as any }
                        })}
                      />
                    </div>
                    <Input
                      label="Storage Endpoint Endpoint Host"
                      value={credentials.cloudStorage.endpoint}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        cloudStorage: { ...credentials.cloudStorage, endpoint: e.target.value }
                      })}
                    />
                    <Input
                      label="Region"
                      value={credentials.cloudStorage.region}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        cloudStorage: { ...credentials.cloudStorage, region: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-900/40 p-5 px-6 border-t border-slate-200 dark:border-slate-800/80 flex justify-end gap-3 z-10 relative">
              <Button type="submit" variant="primary" size="md">
                Commit Secure Parameter Updates
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* 4. TEMPLATES CONSOLE */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl">
            <p className="text-xs text-slate-500">
              Notification template formats. Double braces variables (e.g. <code>{"{{customerName}}"}</code>) compile during dynamic dispatches.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenTemplateModal()}
            >
              Add Template Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((temp) => (
              <Card key={temp.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      temp.channel === "SMS"
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                        : temp.channel === "WHATSAPP"
                          ? "bg-green-950/40 text-green-400 border-green-900/50"
                          : "bg-violet-950/40 text-violet-400 border-violet-900/50"
                    }`}>
                      {temp.channel} CHANNEL
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {temp.id}</span>
                  </div>
                  <CardTitle className="mt-2.5 text-sm font-bold tracking-tight">{temp.name}</CardTitle>
                  <CardDescription className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">
                    Trigger Event: {temp.triggerEvent}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  {temp.subject && (
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Subj: <span className="font-normal font-sans">{temp.subject}</span>
                    </p>
                  )}
                  <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 font-sans text-slate-600 dark:text-slate-400 leading-relaxed min-h-24 select-all">
                    {temp.bodyTemplate}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {temp.variables?.map((v: string) => (
                      <span key={v} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">
                        {v}
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
                  <Button variant="outline" size="xs" onClick={() => handleOpenTemplateModal(temp)}>
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/5"
                    size="xs"
                    onClick={() => handleDeleteTemplate(temp.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. AUDIT TRAIL AND JOBS */}
      {activeTab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* BACKGROUND JOBS MANAGER (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-500 animate-spin-slow" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-sans">
                  Background Scheduler Queue
                </h3>
                <p className="text-[10px] text-slate-400">Memory queue loop processes and retry triggers</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {jobs.length === 0 ? (
                <EmptyState
                  title="Queue empty"
                  description="Memory task queue scheduler has no active or history log jobs."
                />
              ) : (
                jobs.map((job) => {
                  const isDone = job.status === "COMPLETED";
                  const isFail = job.status === "FAILED";
                  const isPending = job.status === "PENDING";
                  return (
                    <Card key={job.id} className="shadow-none border-slate-200/80 dark:border-slate-800/80">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDone 
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                              : isFail 
                                ? "bg-red-950/40 text-red-400 border-red-900/50" 
                                : "bg-amber-950/40 text-amber-400 border-amber-900/50"
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Retries: {job.retryCount}/{job.maxRetries}</span>
                        </div>
                        <CardTitle className="mt-2 text-xs font-bold leading-none">{job.taskName}</CardTitle>
                        <CardDescription className="text-[9px] font-mono font-semibold text-slate-400 uppercase mt-0.5">
                          Service: {job.service} | ID: {job.id}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 pb-3 text-xs space-y-2">
                        {job.logs?.length > 0 && (
                          <div className="bg-slate-950 p-2 rounded-lg font-mono text-[9px] text-slate-300 space-y-1">
                            {job.logs.slice(-3).map((l: string, idx: number) => (
                              <p key={idx} className="line-clamp-2">
                                &gt; {l}
                              </p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400">
                        <span>Attempt: {new Date(job.nextAttemptAt).toLocaleTimeString()}</span>
                        {isPending && (
                          <Button variant="outline" size="xs" className="px-2" onClick={() => handleRunJob(job.id)}>
                            Force Process
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* AUDIT LOG TABLE (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-sky-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-sans">
                    Integrations Audit Trail
                  </h3>
                  <p className="text-[10px] text-slate-400">Audit logs mapping third-party API dispatches</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="min-w-full text-xs text-left divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 uppercase tracking-wider font-semibold font-sans text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No audit events parsed.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isSuccess = log.status === "SUCCESS";
                      const isRetry = log.status === "RETRY_TRIGGERED";
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                          <td className="p-3 whitespace-nowrap font-mono text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3 whitespace-nowrap font-bold">{log.service}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              isSuccess 
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                                : isRetry 
                                  ? "bg-amber-950/40 text-amber-400 border-amber-900/50" 
                                  : "bg-red-950/40 text-red-400 border-red-900/50"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-400 text-[11px] max-w-44 truncate" title={log.actor}>
                            {log.actor.split(" (")[0]}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -----------------------------------------------------------------
          REUSABLE MODAL: NOTIFICATION TEMPLATE CRUD
         ----------------------------------------------------------------- */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={templateForm.id ? "Edit Notification Profile" : "Register Notification Profile"}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(false)}>
              Cancel Setup
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTemplate}>
              Commit Template Setup
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Profile Name"
              placeholder="e.g. PPPoE Account Suspended Notice"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              required
            />
            <Select
              label="Integration Trigger Event Slug"
              options={[
                { value: "MPESA_C2B_CALLBACK", label: "M-Pesa Payment Received" },
                { value: "BILLING_SUSPENSION", label: "Broadband Suspension Alert" },
                { value: "INVOICE_GENERATED", label: "Invoice Generation Alert" },
                { value: "CUSTOMER_OTP", label: "Client OTP Verification" },
                { value: "CUSTOM_EVENT", label: "Custom Manual Alert" },
              ]}
              value={templateForm.triggerEvent}
              onChange={(e) => setTemplateForm({ ...templateForm, triggerEvent: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Target Notification Channel"
              options={[
                { value: "SMS", label: "SMS Bulk Protocol" },
                { value: "WHATSAPP", label: "Meta WhatsApp Cloud API" },
                { value: "EMAIL", label: "SMTP Corporate Outbound Mail" },
              ]}
              value={templateForm.channel}
              onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as any })}
            />
            {templateForm.channel === "EMAIL" && (
              <Input
                label="Corporate Mail Subject Line"
                placeholder="e.g. Invoice Ref: {{invoiceNumber}}"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              />
            )}
          </div>

          <Textarea
            label="Template Body Format"
            placeholder="Dear {{customerName}}, your account {{accountCode}} is active. KES {{amount}} paid. Refs: {{transactionRef}}"
            value={templateForm.bodyTemplate}
            onChange={(e) => setTemplateForm({ ...templateForm, bodyTemplate: e.target.value })}
            description="Extracts variables dynamically using standard double curly-brackets (e.g. {{customerName}}, {{accountCode}}, {{amount}}, {{transactionRef}}, {{invoiceNumber}}, {{dueDate}})"
            required
            rows={5}
          />
        </div>
      </Modal>

    </div>
  );
}
