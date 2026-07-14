import React, { useState, useEffect, useMemo } from "react";
import { 
  Radio, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  Cpu, 
  Sliders, 
  Activity, 
  Layers, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  Info,
  Calendar,
  X,
  CreditCard,
  Sparkles,
  FileDown,
  Wifi,
  MapPin,
  FileText,
  User,
  ShieldAlert,
  Server,
  Settings,
  Tv,
  ArrowRight,
  Gauge
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea, Checkbox } from "../ui/Input";
import { Table, Column } from "../ui/Table";
import { useNotifications } from "../ui/Notifications";
import { Charts } from "../ui/Charts";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";

// Interface definitions reflecting the backend types
interface CRMCustomer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
}

interface InternetPackage {
  id: string;
  name: string;
  bandwidth: string;
  downloadSpeed: string;
  uploadSpeed: string;
  monthlyPrice: number;
  installationFee: number;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ISPSubscriber {
  id: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  installationAddress: string;
  gpsCoordinates: string;
  phoneNumber: string;
  email: string;
  connectionDate: string;
  packageId: string;
  packageName: string;
  monthlyPrice: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISCONNECTED" | "CANCELLED";
  pppoeUsername?: string;
  pppoePassword?: string;
  ipType: "DYNAMIC" | "STATIC";
  staticIpAddress?: string;
  ontMac?: string;
  oltPort?: string;
  connectionType: "FIBER" | "WIRELESS" | "COPPER";
}

interface Installation {
  id: string;
  installationNumber: string;
  subscriberId: string;
  customerName: string;
  technicianName: string;
  installationDate: string;
  location: string;
  equipmentUsed: string[];
  materialsUsed: string;
  installationCost: number;
  status: "SCHEDULED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

interface RouterAssignment {
  id: string;
  serialNumber: string;
  macAddress: string;
  deviceModel: string;
  installationDate: string;
  subscriberId: string;
  subscriberName: string;
  warrantyEndDate: string;
  notes?: string;
}

interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  subscriberId: string;
  customerName: string;
  packageName: string;
  amount: number;
  dueDate: string;
  billingPeriod: string;
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  createdAt: string;
}

interface NetworkDevice {
  id: string;
  name: string;
  deviceType: "MIKROTIK" | "UBIQUITI" | "RADIUS_SERVER";
  ipAddress: string;
  connectionStatus: "ONLINE" | "OFFLINE" | "ERROR";
  apiUsername?: string;
  lastSync: string;
  logs: { timestamp: string; type: "INFO" | "WARNING" | "ERROR"; message: string }[];
}

export function ISPPage() {
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "subscribers" | "packages" | "installations" | "equipment" | "billing" | "network" | "portal" | "reports"
  >("dashboard");

  // Server state data
  const [subscribers, setSubscribers] = useState<ISPSubscriber[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [assignments, setAssignments] = useState<RouterAssignment[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<CRMCustomer[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Loading/running indicators
  const [loading, setLoading] = useState(false);
  const [billingRunning, setBillingRunning] = useState(false);
  const [networkSyncing, setNetworkSyncing] = useState(false);

  // Modal control
  const [activeModal, setActiveModal] = useState<
    "add-subscriber" | "edit-subscriber" | "manage-status" | "add-package" | "edit-package" | "update-installation" | "assign-equipment" | "add-device" | "view-receipt" | null
  >(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selection states for modification modals
  const [selectedSubscriber, setSelectedSubscriber] = useState<ISPSubscriber | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<InternetPackage | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);

  // Client Portal simulator states
  const [portalSubId, setPortalSubId] = useState("SUB-001");
  const [portalData, setPortalData] = useState<any>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [speedResult, setSpeedResult] = useState<{ dl: number; ul: number; ping: number } | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("0722000000");

  // FORM CONTROLS
  // 1. Subscriber Form
  const [subscriberForm, setSubscriberForm] = useState({
    customerId: "",
    installationAddress: "",
    gpsCoordinates: "-1.2921, 36.8219",
    phoneNumber: "",
    email: "",
    packageId: "",
    pppoeUsername: "",
    pppoePassword: "",
    ipType: "DYNAMIC" as "DYNAMIC" | "STATIC",
    staticIpAddress: "",
    ontMac: "",
    oltPort: "OLT-NBO-01 / Slot 1 / Port 1",
    connectionType: "FIBER" as "FIBER" | "WIRELESS" | "COPPER"
  });

  // 2. Package Form
  const [packageForm, setPackageForm] = useState({
    name: "",
    bandwidth: "20 Mbps",
    downloadSpeed: "20 Mbps",
    uploadSpeed: "20 Mbps",
    monthlyPrice: 4500,
    installationFee: 3000,
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });

  // 3. Status change Form
  const [statusChangeForm, setStatusChangeForm] = useState({
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED" | "DISCONNECTED" | "CANCELLED",
    reason: ""
  });

  // 4. Installation Update Form
  const [installationForm, setInstallationForm] = useState({
    status: "SCHEDULED" as "SCHEDULED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    technicianName: "",
    equipmentUsedRaw: "",
    materialsUsed: "",
    installationCost: 3000,
    notes: ""
  });

  // 5. Router assignment Form
  const [equipmentForm, setEquipmentForm] = useState({
    serialNumber: "",
    deviceModel: "MikroTik hAP ac2 Dualband",
    macAddress: "",
    subscriberId: "",
    notes: ""
  });

  // 6. Network Device Form
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    deviceType: "MIKROTIK" as "MIKROTIK" | "UBIQUITI" | "RADIUS_SERVER",
    ipAddress: "",
    apiUsername: "admin_celcom",
    apiPassword: ""
  });

  // 7. Monthly billing generator Form
  const [billingPeriodInput, setBillingPeriodInput] = useState("July 2026");

  // Fetch all necessary data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      };

      // Fetch active CRM customers to register subscribers
      const resCust = await fetch("/api/v1/crm/customers", { headers });
      const dataCust = await resCust.json();
      if (dataCust.success) setCrmCustomers(dataCust.customers);

      // Fetch stats
      const resStats = await fetch("/api/v1/isp/stats", { headers });
      const dataStats = await resStats.json();
      if (dataStats.success) setStats(dataStats.stats);

      // Fetch packages
      const resPkgs = await fetch("/api/v1/isp/packages", { headers });
      const dataPkgs = await resPkgs.json();
      if (dataPkgs.success) {
        setPackages(dataPkgs.packages);
        if (dataPkgs.packages.length > 0 && !subscriberForm.packageId) {
          setSubscriberForm(prev => ({ ...prev, packageId: dataPkgs.packages[0].id }));
        }
      }

      // Fetch subscribers
      const resSubs = await fetch("/api/v1/isp/subscribers", { headers });
      const dataSubs = await resSubs.json();
      if (dataSubs.success) setSubscribers(dataSubs.subscribers);

      // Fetch installations
      const resInst = await fetch("/api/v1/isp/installations", { headers });
      const dataInst = await resInst.json();
      if (dataInst.success) setInstallations(dataInst.installations);

      // Fetch assignments
      const resRa = await fetch("/api/v1/isp/equipment-assignments", { headers });
      const dataRa = await resRa.json();
      if (dataRa.success) setAssignments(dataRa.assignments);

      // Fetch invoices
      const resInvs = await fetch("/api/v1/isp/invoices", { headers });
      const dataInvs = await resInvs.json();
      if (dataInvs.success) setInvoices(dataInvs.invoices);

      // Fetch network devices
      const resDevs = await fetch("/api/v1/isp/devices", { headers });
      const dataDevs = await resDevs.json();
      if (dataDevs.success) setDevices(dataDevs.devices);

    } catch (e) {
      showNotification("Communication Failure", "Could not reach ISP modules on server. Check backend connections.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  // Handle subscriber selection to load client portal
  const loadPortalData = async (subId: string) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      };
      const res = await fetch(`/api/v1/isp/portal/${subId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setPortalData(data.portalData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "portal" && portalSubId) {
      loadPortalData(portalSubId);
    }
  }, [activeTab, portalSubId]);

  // Form Submission Handlers
  const handleAddSubscriberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberForm.customerId) return showNotification("Validation Failed", "Please select a customer.", "error");
    if (!subscriberForm.installationAddress) return showNotification("Validation Failed", "Please enter installation address.", "error");

    try {
      const selectedCust = crmCustomers.find(c => c.id === subscriberForm.customerId);
      const payload = {
        ...subscriberForm,
        customerName: selectedCust ? selectedCust.companyName : "Celcom Client",
        phoneNumber: subscriberForm.phoneNumber || (selectedCust ? selectedCust.phone : ""),
        email: subscriberForm.email || (selectedCust ? selectedCust.email : "")
      };

      const res = await fetch("/api/v1/isp/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Subscriber Activated", "Subscriber registered. A physical installation has been auto-scheduled.", "success");
        setActiveModal(null);
        loadAllData();
      } else {
        showNotification("Creation Failed", data.message || "Error registering subscriber.", "error");
      }
    } catch (err) {
      showNotification("Error", "Server error processing client registration.", "error");
    }
  };

  const handleUpdateSubscriberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscriber) return;

    try {
      const res = await fetch(`/api/v1/isp/subscribers/${selectedSubscriber.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(subscriberForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Updated Successfully", "Subscriber details have been committed.", "success");
        setActiveModal(null);
        setSelectedSubscriber(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Could not complete subscriber details update.", "error");
    }
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscriber) return;
    if (!statusChangeForm.reason.trim()) return showNotification("Reason Required", "Please describe why this state change is authorized.", "warning");

    try {
      const res = await fetch(`/api/v1/isp/subscribers/${selectedSubscriber.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(statusChangeForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("SLA Status Changed", `Client shifted to ${statusChangeForm.status} profile successfully.`, "success");
        setActiveModal(null);
        setSelectedSubscriber(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Could not submit status authorization change.", "error");
    }
  };

  const handleAddPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name) return showNotification("Validation Error", "Package Name is required.", "error");

    try {
      const res = await fetch("/api/v1/isp/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(packageForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Package Added", `${packageForm.name} tariff is now live for subscriptions.`, "success");
        setActiveModal(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Failed to register internet tariff.", "error");
    }
  };

  const handleEditPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      const res = await fetch(`/api/v1/isp/packages/${selectedPackage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(packageForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Package Updated", `${packageForm.name} specifications altered successfully.`, "success");
        setActiveModal(null);
        setSelectedPackage(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Failed to commit package adjustments.", "error");
    }
  };

  const handleUpdateInstallationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallation) return;

    try {
      const equipmentUsed = installationForm.equipmentUsedRaw
        ? installationForm.equipmentUsedRaw.split(",").map(e => e.trim())
        : [];

      const payload = {
        status: installationForm.status,
        technicianName: installationForm.technicianName,
        equipmentUsed,
        materialsUsed: installationForm.materialsUsed,
        installationCost: installationForm.installationCost
      };

      const res = await fetch(`/api/v1/isp/installations/${selectedInstallation.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Installation Saved", `Status set to ${installationForm.status}. Subscriptions activated if completed.`, "success");
        setActiveModal(null);
        setSelectedInstallation(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Failed to update fiber splice workflow status.", "error");
    }
  };

  const handleAssignEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentForm.serialNumber) return showNotification("Validation Error", "Device Serial is required.", "error");
    if (!equipmentForm.subscriberId) return showNotification("Validation Error", "Subscriber link is required.", "error");

    try {
      const selectedSub = subscribers.find(s => s.id === equipmentForm.subscriberId);
      const payload = {
        ...equipmentForm,
        subscriberName: selectedSub ? selectedSub.customerName : "Unlinked Subscriber"
      };

      const res = await fetch("/api/v1/isp/equipment-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Equipment Handed Over", `Serial ${equipmentForm.serialNumber} allocated successfully.`, "success");
        setActiveModal(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Failed to write hardware assignment logs.", "error");
    }
  };

  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.name || !deviceForm.ipAddress) return showNotification("Validation Error", "Device Name and IP are required.", "error");

    try {
      const res = await fetch("/api/v1/isp/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(deviceForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Core Node Connected", `Device ${deviceForm.name} registered on API tunnels.`, "success");
        setActiveModal(null);
        loadAllData();
      }
    } catch (err) {
      showNotification("Error", "Could not register node endpoints.", "error");
    }
  };

  const triggerRecurringBillingRun = async () => {
    setBillingRunning(true);
    try {
      const res = await fetch("/api/v1/isp/billing/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({ billingPeriod: billingPeriodInput })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Billing Run Completed", data.message || "Monthly subscription invoices compiled.", "success");
        loadAllData();
      } else {
        showNotification("Run Blocked", data.message || "Recurring run had duplicate issues.", "warning");
      }
    } catch (err) {
      showNotification("Error", "Failed to trigger automated subscription invoices.", "error");
    } finally {
      setBillingRunning(false);
    }
  };

  const triggerNetworkDeviceSync = (deviceId: string) => {
    setNetworkSyncing(true);
    showNotification("Syncing Queues", "Connecting to MikroTik API simple queues...", "info");
    
    setTimeout(async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        };
        // Add log entry to the device
        await fetch(`/api/v1/isp/devices/${deviceId}/logs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            type: "INFO",
            message: `Manual GPON synchronization triggered by admin staff. Connected simple queues. Attenuation within bounds.`
          })
        });
        showNotification("MikroTik Synced", "All active subscriber PPPoE tunnels mapped to OLT bandwidth constraints successfully.", "success");
        loadAllData();
      } catch (err) {
        console.error(err);
      } finally {
        setNetworkSyncing(false);
      }
    }, 1500);
  };

  // CLIENT PORTAL SIMULATOR FUNCTIONS
  const runSpeedTestSim = () => {
    setSpeedTesting(true);
    setSpeedResult(null);
    setTimeout(() => {
      const pkgPrice = portalData?.subscriber?.monthlyPrice || 3000;
      let targetDl = 15;
      if (pkgPrice > 30000) targetDl = 100;
      else if (pkgPrice > 8000) targetDl = 50;
      else if (pkgPrice > 4000) targetDl = 30;

      setSpeedResult({
        dl: Number((targetDl - Math.random() * 2).toFixed(1)),
        ul: Number((targetDl - Math.random() * 2).toFixed(1)),
        ping: Math.floor(2 + Math.random() * 5)
      });
      setSpeedTesting(false);
      showNotification("Speed Test Completed", "Broadband optical signal verified.", "success");
    }, 2000);
  };

  const processMpesaPayment = (invoiceId: string, amount: number) => {
    setPayingInvoiceId(invoiceId);
    showNotification("M-Pesa STK Push Sent", `KES ${amount.toLocaleString()} requested on your device. Enter your PIN to complete.`, "info");
    
    setTimeout(async () => {
      try {
        // Simple bridge to sales payment endpoint to mark it paid
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        };
        await fetch("/api/v1/sales/payments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            customerId: portalData?.subscriber?.customerId,
            amount,
            paymentMethod: "MPESA",
            transactionReference: "MPESA-" + Math.floor(100000 + Math.random() * 900000),
            invoiceNumber: invoices.find(i => i.id === invoiceId)?.invoiceNumber || "INV-SUB-01",
          })
        });

        showNotification("M-Pesa Payment Received", "Invoice status set to PAID. Double-entry transaction logs written.", "success");
        loadPortalData(portalSubId);
        loadAllData();
      } catch (err) {
        console.error(err);
      } finally {
        setPayingInvoiceId(null);
      }
    }, 2500);
  };

  // Filters subscriber roster based on query/status
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      const textMatches = 
        sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.pppoeUsername || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusMatches = statusFilter === "ALL" || sub.status === statusFilter;
      return textMatches && statusMatches;
    });
  }, [subscribers, searchQuery, statusFilter]);

  // Helpers for editing forms
  const openEditSubscriberModal = (sub: ISPSubscriber) => {
    setSelectedSubscriber(sub);
    setSubscriberForm({
      customerId: sub.customerId,
      installationAddress: sub.installationAddress,
      gpsCoordinates: sub.gpsCoordinates,
      phoneNumber: sub.phoneNumber,
      email: sub.email,
      packageId: sub.packageId,
      pppoeUsername: sub.pppoeUsername || "",
      pppoePassword: sub.pppoePassword || "",
      ipType: sub.ipType,
      staticIpAddress: sub.staticIpAddress || "",
      ontMac: sub.ontMac || "",
      oltPort: sub.oltPort || "",
      connectionType: sub.connectionType
    });
    setActiveModal("edit-subscriber");
  };

  const openStatusChangeModal = (sub: ISPSubscriber) => {
    setSelectedSubscriber(sub);
    setStatusChangeForm({
      status: sub.status as any,
      reason: ""
    });
    setActiveModal("manage-status");
  };

  const openEditPackageModal = (pkg: InternetPackage) => {
    setSelectedPackage(pkg);
    setPackageForm({
      name: pkg.name,
      bandwidth: pkg.bandwidth,
      downloadSpeed: pkg.downloadSpeed,
      uploadSpeed: pkg.uploadSpeed,
      monthlyPrice: pkg.monthlyPrice,
      installationFee: pkg.installationFee,
      description: pkg.description,
      status: pkg.status
    });
    setActiveModal("edit-package");
  };

  const openUpdateInstallationModal = (ins: Installation) => {
    setSelectedInstallation(ins);
    setInstallationForm({
      status: ins.status,
      technicianName: ins.technicianName,
      equipmentUsedRaw: ins.equipmentUsed.join(", "),
      materialsUsed: ins.materialsUsed,
      installationCost: ins.installationCost,
      notes: ins.notes || ""
    });
    setActiveModal("update-installation");
  };

  // CSV Report Generator
  const triggerCsvReportDownload = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Subscriber ID,Account Code,Customer,Package,Status,Price,Connection Type,IP Type,Static IP,MAC Address\n";
    
    subscribers.forEach(s => {
      csvContent += `"${s.id}","${s.accountNumber}","${s.customerName}","${s.packageName}","${s.status}","${s.monthlyPrice}","${s.connectionType}","${s.ipType}","${s.staticIpAddress || "N/A"}","${s.ontMac || "N/A"}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `celcom_isp_subscribers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("CSV Report Generated", "Subscriber roster saved to desktop.", "success");
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 px-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="h-5 w-5 text-sky-500 animate-pulse" />
            Celcom Networks ISP Control Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Core internet operations: GPON splitters, billing cycles, subscriber credentials, and technician assignment.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 relative z-10 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={loading ? "animate-spin" : ""} />} onClick={loadAllData}>
            Sync Operations
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
            setSubscriberForm({
              customerId: crmCustomers[0]?.id || "",
              installationAddress: "",
              gpsCoordinates: "-1.2921, 36.8219",
              phoneNumber: "",
              email: "",
              packageId: packages[0]?.id || "",
              pppoeUsername: "",
              pppoePassword: "CelcomPassSecure",
              ipType: "DYNAMIC",
              staticIpAddress: "",
              ontMac: "",
              oltPort: "OLT-NBO-01 / Slot 1 / Port 1",
              connectionType: "FIBER"
            });
            setActiveModal("add-subscriber");
          }}>
            Register Subscriber
          </Button>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border">
        {[
          { id: "dashboard", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
          { id: "subscribers", label: "Subscribers", icon: <Radio className="h-4 w-4" /> },
          { id: "packages", label: "Internet Tariffs", icon: <Sliders className="h-4 w-4" /> },
          { id: "installations", label: "Splicing & Deployments", icon: <Wrench className="h-4 w-4" /> },
          { id: "equipment", label: "Hardware Trackers", icon: <Server className="h-4 w-4" /> },
          { id: "billing", label: "Monthly Billings", icon: <DollarSign className="h-4 w-4" /> },
          { id: "network", label: "Network Synclink", icon: <Wifi className="h-4 w-4" /> },
          { id: "portal", label: "Client Portal Demo", icon: <Tv className="h-4 w-4" /> },
          { id: "reports", label: "SLA Reports", icon: <FileText className="h-4 w-4" /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer
              ${activeTab === t.id 
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/10" 
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}
            `}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      {loading ? (
        <Card className="p-12 text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Querying GPON databases and network gateways...</p>
        </Card>
      ) : (
        <>
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              {/* Dynamic KPI Widget Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase font-semibold text-[10px] tracking-wider text-slate-500">Active Connections</CardDescription>
                    <CardTitle className="text-2xl font-bold flex items-center justify-between mt-1">
                      {stats.activeSubscribers}
                      <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase font-sans">SLA Ok</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-slate-500">Out of {stats.totalSubscribers} registered nodes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase font-semibold text-[10px] tracking-wider text-slate-500">Monthly Billing Value (MRC)</CardDescription>
                    <CardTitle className="text-2xl font-bold flex items-center justify-between mt-1 text-slate-900 dark:text-slate-100">
                      KES {stats.mrcRevenueKES.toLocaleString()}
                      <span className="text-sky-500"><DollarSign className="h-5 w-5" /></span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-slate-500">Sustained monthly fiber income potential</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase font-semibold text-[10px] tracking-wider text-slate-500">Collected Income (Current Cycle)</CardDescription>
                    <CardTitle className="text-2xl font-bold flex items-center justify-between mt-1 text-emerald-600 dark:text-emerald-400">
                      KES {stats.collectedRevenueKES.toLocaleString()}
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-slate-500">Outstanding: KES {stats.outstandingBalanceKES.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase font-semibold text-[10px] tracking-wider text-slate-500">GPON Gateways (OLT)</CardDescription>
                    <CardTitle className="text-2xl font-bold flex items-center justify-between mt-1">
                      {stats.onlineDevices} / {stats.devicesCount} Online
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-slate-500">RADIUS core & simple queue auth active</p>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics plots */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-sky-500" />
                      Broadband Customer Base Growth
                    </CardTitle>
                    <CardDescription>Visualizing monthly addition of active fiber/wireless subscribers.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Charts 
                      type="area" 
                      data={stats.growthChart} 
                      metrics={[{ key: "active", color: "#0ea5e9", label: "Active Connections" }]}
                      height={220}
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4.5 w-4.5 text-sky-500" />
                      Income Performance by Billing Period
                    </CardTitle>
                    <CardDescription>Monthly realized revenue from recurring broadband leases.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Charts 
                      type="bar" 
                      data={stats.growthChart} 
                      metrics={[{ key: "revenue", color: "#1e3a8a", label: "Gross Receipts (KES)" }]}
                      height={220}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row - Packages Breakdown and Recent Deployments */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <Card className="md:col-span-5">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Package Subscriber Allocation</CardTitle>
                    <CardDescription>Broadband tier densities.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.packagePerformance.map((pkg: any, idx: number) => {
                      const totalC = subscribers.length || 1;
                      const percentage = Math.round((pkg.count / totalC) * 100);
                      return (
                        <div key={`pkg-perf-${idx}`} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{pkg.name}</span>
                            <span className="text-slate-500">{pkg.count} subs ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="md:col-span-7">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Deployments scheduled (In Progress)</CardTitle>
                    <CardDescription>Technician splice allocations.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      {installations.map((ins, i) => (
                        <div key={`recent-ins-${i}`} className="p-4 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{ins.customerName}</p>
                            <div className="flex gap-2 text-slate-400 font-mono text-[10px]">
                              <span>{ins.installationNumber}</span>
                              <span>•</span>
                              <span>{ins.technicianName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono">{ins.installationDate}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              ins.status === "COMPLETED" 
                                ? "bg-emerald-950 text-emerald-400 border-emerald-900" 
                                : "bg-amber-950 text-amber-400 border-amber-900"
                            }`}>
                              {ins.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIBERS DIRECTORY */}
          {activeTab === "subscribers" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Radio className="h-4.5 w-4.5 text-sky-500" />
                    GPON Subscribers Directory
                  </span>
                  <div className="flex gap-2 text-xs">
                    <Button variant="outline" size="sm" onClick={triggerCsvReportDownload} leftIcon={<FileDown className="h-3.5 w-3.5" />}>
                      Export CAK CSV
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Active billing PPPoE accounts and physical fiber/wireless endpoints in Kenya.</CardDescription>
                
                {/* Search / Filter Row */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, sub ID, account or PPPoE username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="w-48">
                    <Select
                      options={[
                        { value: "ALL", label: "All SLA Statuses" },
                        { value: "ACTIVE", label: "Active" },
                        { value: "PENDING", label: "Pending Installation" },
                        { value: "SUSPENDED", label: "Suspended" },
                        { value: "DISCONNECTED", label: "Disconnected" }
                      ]}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        <th className="p-4 pl-6">ID & Account</th>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Broadband Tariff</th>
                        <th className="p-4">IP & PPPoE Access</th>
                        <th className="p-4">SLA Status</th>
                        <th className="p-4">Fiber Node Port</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSubscribers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400">
                            No active broadband subscriptions found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredSubscribers.map((sub, i) => {
                          const statusColors = {
                            ACTIVE: "bg-emerald-950 text-emerald-400 border-emerald-900",
                            PENDING: "bg-blue-950 text-blue-400 border-blue-900",
                            SUSPENDED: "bg-amber-950 text-amber-400 border-amber-900",
                            DISCONNECTED: "bg-red-950 text-red-400 border-red-900",
                            CANCELLED: "bg-slate-950 text-slate-400 border-slate-900"
                          };
                          return (
                            <tr key={`sub-row-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                              <td className="p-4 pl-6 font-mono text-[11px] text-slate-500">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{sub.id}</div>
                                <div className="text-[10px] mt-0.5">{sub.accountNumber}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{sub.customerName}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                                  {sub.installationAddress}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.packageName}</div>
                                <div className="text-slate-500 font-mono text-[10px] mt-0.5">KES {sub.monthlyPrice.toLocaleString()}/mo</div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                                  {sub.pppoeUsername && (
                                    <span className="text-slate-400">PPPoE: <span className="text-slate-200 font-bold">{sub.pppoeUsername}</span></span>
                                  )}
                                  <span className="text-slate-400">
                                    IP: <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-semibold text-slate-600 dark:text-slate-300">{sub.ipType === "STATIC" ? sub.staticIpAddress : "DYNAMIC DHCP"}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusColors[sub.status] || ""}`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-400">
                                <div>{sub.oltPort || "Not Splice-Allocated"}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">MAC: {sub.ontMac || "No ONT Registered"}</div>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button variant="outline" size="sm" className="px-2" onClick={() => openStatusChangeModal(sub)}>
                                    SLA Auth
                                  </Button>
                                  <Button variant="secondary" size="sm" className="px-2" onClick={() => openEditSubscriberModal(sub)}>
                                    Config
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: INTERNET PACKAGES */}
          {activeTab === "packages" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">ISP Billing Tariff Matrix</h3>
                <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
                  setPackageForm({
                    name: "",
                    bandwidth: "20 Mbps",
                    downloadSpeed: "20 Mbps",
                    uploadSpeed: "20 Mbps",
                    monthlyPrice: 4500,
                    installationFee: 3000,
                    description: "",
                    status: "ACTIVE"
                  });
                  setActiveModal("add-package");
                }}>
                  Add Tariff Package
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {packages.map((pkg, idx) => (
                  <Card key={`pkg-card-${idx}`} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          pkg.status === "ACTIVE" 
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900" 
                            : "bg-slate-950 text-slate-400 border-slate-900"
                        }`}>
                          {pkg.status}
                        </span>
                        <Wifi className="h-5 w-5 text-sky-500 animate-pulse" />
                      </div>
                      <CardTitle className="text-base font-bold mt-2">{pkg.name}</CardTitle>
                      <CardDescription className="text-slate-500 text-xs mt-1 min-h-[48px]">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 font-mono text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Symmetric Speed</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{pkg.bandwidth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Download Limit</span>
                        <span>{pkg.downloadSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upload Limit</span>
                        <span>{pkg.uploadSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Installation Fee</span>
                        <span>KES {pkg.installationFee.toLocaleString()}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 text-center">
                        <div className="text-[10px] text-slate-400 font-sans">Monthly Charge</div>
                        <div className="text-lg font-black text-sky-500">
                          KES {pkg.monthlyPrice.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 justify-center gap-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => openEditPackageModal(pkg)}>
                        Modify Specs
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOYMENTS & SPLICING */}
          {activeTab === "installations" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4.5 w-4.5 text-sky-500" />
                    Technician Splice & Installation Workflow
                  </span>
                </CardTitle>
                <CardDescription>Fiber drop splicing, optical ODF mapping, and Wi-Fi CPE allocation tracking.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        <th className="p-4 pl-6">Job Number</th>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Location (Address)</th>
                        <th className="p-4">Allocated Technician</th>
                        <th className="p-4">Splice Date</th>
                        <th className="p-4">Materials Used</th>
                        <th className="p-4">Progress Status</th>
                        <th className="p-4 pr-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {installations.map((ins, idx) => {
                        const statusBadge = {
                          SCHEDULED: "bg-slate-100 text-slate-700 border-slate-300",
                          ASSIGNED: "bg-blue-950 text-blue-400 border-blue-900",
                          IN_PROGRESS: "bg-amber-950 text-amber-400 border-amber-900 animate-pulse",
                          COMPLETED: "bg-emerald-950 text-emerald-400 border-emerald-900",
                          CANCELLED: "bg-red-950 text-red-400 border-red-900"
                        };
                        return (
                          <tr key={`ins-row-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <td className="p-4 pl-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {ins.installationNumber}
                            </td>
                            <td className="p-4 font-bold">{ins.customerName}</td>
                            <td className="p-4 text-slate-500">{ins.location}</td>
                            <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                              {ins.technicianName}
                            </td>
                            <td className="p-4 font-mono text-slate-500">{ins.installationDate}</td>
                            <td className="p-4 text-slate-400">
                              <div className="max-w-[180px] truncate" title={ins.materialsUsed}>
                                {ins.materialsUsed || "Pending hardware scan"}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge[ins.status]}`}>
                                {ins.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <Button variant="outline" size="sm" onClick={() => openUpdateInstallationModal(ins)}>
                                Progress Log
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: HARDWARE TRACKERS */}
          {activeTab === "equipment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Server className="h-4.5 w-4.5 text-sky-500" />
                    CPE Router & Equipment Assignment (Inventory Sync)
                  </span>
                  <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
                    setEquipmentForm({
                      serialNumber: "",
                      deviceModel: "MikroTik hAP ac2 Dualband",
                      macAddress: "",
                      subscriberId: subscribers[0]?.id || "",
                      notes: ""
                    });
                    setActiveModal("assign-equipment");
                  }}>
                    Assign Router to Node
                  </Button>
                </CardTitle>
                <CardDescription>
                  Tracking allocated ONTs, managed routers, and SFP transceiver hardware matched from the central inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        <th className="p-4 pl-6">Equipment Serial</th>
                        <th className="p-4">Device Model</th>
                        <th className="p-4">Physical MAC</th>
                        <th className="p-4">Assigned Subscriber</th>
                        <th className="p-4">Handover Date</th>
                        <th className="p-4">Warranty Expiry</th>
                        <th className="p-4 pr-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {assignments.map((ra, idx) => (
                        <tr key={`ra-row-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 text-[11px]">
                          <td className="p-4 pl-6 font-bold text-sky-500">{ra.serialNumber}</td>
                          <td className="p-4 font-sans font-semibold text-slate-900 dark:text-slate-100">{ra.deviceModel}</td>
                          <td className="p-4 text-slate-500">{ra.macAddress}</td>
                          <td className="p-4 font-sans font-bold text-slate-800 dark:text-slate-200">{ra.subscriberName}</td>
                          <td className="p-4 text-slate-500">{ra.installationDate}</td>
                          <td className="p-4 text-amber-500">{ra.warrantyEndDate}</td>
                          <td className="p-4 pr-6 font-sans">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase">
                              Active Lease
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: MONTHLY RECURRING BILLINGS */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Billing Run Controller Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <Card className="md:col-span-4" borderAccent>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-sky-500" />
                      Recurring Monthly Billing Engine
                    </CardTitle>
                    <CardDescription>
                      Automates the invoice run across all active subscribers. Generates sales ledgers and accounting journal double-entry balances.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Select Billing Period (Month/Year)"
                      placeholder="e.g. July 2026"
                      value={billingPeriodInput}
                      onChange={(e) => setBillingPeriodInput(e.target.value)}
                    />
                    
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2 font-sans">
                      <p className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Info className="h-3.5 w-3.5 text-sky-500" />
                        Automated Ledger Journal mapping:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px] font-mono">
                        <li>Debit: Accounts Receivable (Asset)</li>
                        <li>Credit: ISP Subscription Revenue</li>
                        <li>VAT 16.0% automatically isolated</li>
                      </ul>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      isLoading={billingRunning}
                      leftIcon={<RefreshCw />}
                      onClick={triggerRecurringBillingRun}
                    >
                      Run Automated Invoices
                    </Button>
                  </CardContent>
                </Card>

                {/* Subscription Invoice roster */}
                <Card className="md:col-span-8">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Subscriber Monthly Invoice Records</CardTitle>
                    <CardDescription>Real-time AR statuses.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-sans text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            <th className="p-4 pl-6">Invoice Number</th>
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Period</th>
                            <th className="p-4">Package</th>
                            <th className="p-4">Cycle Amount</th>
                            <th className="p-4">Payment Status</th>
                            <th className="p-4 pr-6 text-right">Document</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {invoices.map((inv, idx) => (
                            <tr key={`inv-row-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                              <td className="p-4 pl-6 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                              <td className="p-4 font-bold">{inv.customerName}</td>
                              <td className="p-4 text-slate-500">{inv.billingPeriod}</td>
                              <td className="p-4 text-slate-400 font-mono">{inv.packageName}</td>
                              <td className="p-4 font-mono font-bold">KES {inv.amount.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                  inv.status === "PAID"
                                    ? "bg-emerald-950 text-emerald-400 border-emerald-900"
                                    : "bg-amber-950 text-amber-400 border-amber-900"
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedInvoice(inv);
                                  setActiveModal("view-receipt");
                                }}>
                                  View Statement
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
            </div>
          )}

          {/* TAB 7: NETWORK INTEGRATION STATUS */}
          {activeTab === "network" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">GPON Headends & RADIUS Gateways</h3>
                <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={() => {
                  setDeviceForm({
                    name: "",
                    deviceType: "MIKROTIK",
                    ipAddress: "",
                    apiUsername: "admin_celcom",
                    apiPassword: ""
                  });
                  setActiveModal("add-device");
                }}>
                  Connect Core Device
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {devices.map((dev, idx) => (
                  <Card key={`dev-card-${idx}`} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs uppercase tracking-wider font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {dev.deviceType}
                        </span>
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold mt-2">{dev.name}</CardTitle>
                      <CardDescription className="font-mono text-[11px] mt-1 text-slate-500">
                        IP Control: {dev.ipAddress}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 font-mono text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">REAL-TIME CONSOLE SYNC</div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-[10px] text-emerald-500 h-24 overflow-y-auto space-y-1.5 font-mono select-none">
                        {dev.logs && dev.logs.map((log, lIdx) => (
                          <div key={`log-${lIdx}`} className="flex gap-1">
                            <span className="text-slate-600 shrink-0">[{log.timestamp.split("T")[1].slice(0, 5)}]</span>
                            <span className={log.type === "WARNING" ? "text-amber-500" : log.type === "ERROR" ? "text-red-500" : "text-emerald-500"}>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 justify-center">
                      <Button
                        variant="secondary"
                        className="w-full"
                        size="sm"
                        isLoading={networkSyncing}
                        onClick={() => triggerNetworkDeviceSync(dev.id)}
                      >
                        Push Simple Queue Configs
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CLIENT PORTAL SIMULATOR */}
          {activeTab === "portal" && (
            <div className="space-y-6">
              {/* Select Subscriber to Simulate */}
              <Card borderAccent>
                <CardHeader className="pb-3 flex flex-row justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-sky-500" />
                      Client Dashboard Viewport (Celcom Subscriber Self-Service)
                    </CardTitle>
                    <CardDescription>
                      Simulate the customer-facing experience. Clients can run fiber latency diagnostics, view bills, and complete MPESA push payments.
                    </CardDescription>
                  </div>
                  <div className="w-64">
                    <Select
                      label="Simulate subscriber:"
                      options={subscribers.map(s => ({ value: s.id, label: s.customerName }))}
                      value={portalSubId}
                      onChange={(e) => setPortalSubId(e.target.value)}
                    />
                  </div>
                </CardHeader>
              </Card>

              {portalData && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Side: Router status, Speed Test, Attenuation */}
                  <div className="md:col-span-7 space-y-6">
                    {/* Welcome banner & Speed test */}
                    <Card className="bg-slate-900 border-slate-800 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                      <CardHeader>
                        <CardDescription className="text-sky-400 font-bold uppercase tracking-wider text-[10px]">Subscriber Self-Service Portal</CardDescription>
                        <CardTitle className="text-xl font-bold mt-1 text-white">
                          Welcome Back, {portalData.subscriber.customerName}
                        </CardTitle>
                        <p className="text-xs text-slate-400">Account Code: {portalData.subscriber.accountNumber} | Dynamic IP Pool Sync</p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-800 py-4 font-mono text-center">
                          <div>
                            <p className="text-slate-500 text-[10px]">CONTRACTED SPEED</p>
                            <p className="text-lg font-bold text-sky-400 mt-1">{portalData.subscriber.packageName.split(" ").slice(-1)[0] || portalData.subscriber.monthlyPrice > 30000 ? "100M" : "30M"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px]">OPTICAL POWER</p>
                            <p className="text-lg font-bold text-emerald-400 mt-1">-18.4 dBm</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px]">CPE CPE MODEL</p>
                            <p className="text-[11px] font-bold text-slate-300 mt-2 truncate" title={portalData.router?.deviceModel}>{portalData.router?.deviceModel || "GPON ONT Dualband"}</p>
                          </div>
                        </div>

                        {/* Interactive Speed Dial Simulator */}
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center">
                          <div className="text-center">
                            <p className="text-xs font-semibold text-slate-400">GPON Local Optical Latency Diagnostic</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Symmetric speed throughput check with Nairobi core gateway.</p>
                          </div>

                          <div className="my-6 relative flex items-center justify-center">
                            {speedTesting ? (
                              <div className="h-28 w-28 rounded-full border-4 border-t-sky-500 border-slate-800 animate-spin flex items-center justify-center">
                                <Gauge className="h-8 w-8 text-sky-500" />
                              </div>
                            ) : speedResult ? (
                              <div className="text-center font-mono space-y-1">
                                <div className="text-2xl font-black text-sky-400">{speedResult.dl} <span className="text-xs">Mbps</span></div>
                                <div className="text-[10px] text-slate-400">Upload: {speedResult.ul} Mbps</div>
                                <div className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-bold border border-emerald-950">Ping: {speedResult.ping}ms</div>
                              </div>
                            ) : (
                              <button
                                onClick={runSpeedTestSim}
                                className="h-24 w-24 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wider flex flex-col items-center justify-center cursor-pointer shadow-lg shadow-sky-600/20"
                              >
                                <Gauge className="h-5 w-5 mb-1" />
                                START TEST
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side: Account statement and payment STK */}
                  <div className="md:col-span-5 space-y-6 font-sans">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Active Lease Ledger Statement</CardTitle>
                        <CardDescription>Pay due invoices instantly with Safaricom M-Pesa.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-slate-400">TOTAL OUTSTANDING BALANCE</p>
                            <p className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                              KES {portalData.invoices.filter((i: any) => i.status === "PENDING").reduce((sum: number, i: any) => sum + i.amount, 0).toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-sky-500 shrink-0" />
                        </div>

                        <div className="space-y-2.5">
                          {portalData.invoices.map((inv: any, idx: number) => (
                            <div key={`pinv-${idx}`} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber} ({inv.billingPeriod})</p>
                                <p className="text-[10px] text-slate-400">Due: {inv.dueDate}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">KES {inv.amount.toLocaleString()}</span>
                                {inv.status === "PAID" ? (
                                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                    PAID
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      placeholder="0722..."
                                      className="w-24 text-[10px] py-1 h-7 border-emerald-500 font-mono text-center"
                                      value={mpesaPhone}
                                      onChange={(e) => setMpesaPhone(e.target.value)}
                                    />
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-500 border-none h-7 px-2 font-semibold"
                                      isLoading={payingInvoiceId === inv.id}
                                      onClick={() => processMpesaPayment(inv.id, inv.amount)}
                                    >
                                      Lipa
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SLA & ATTENUATION REPORTS */}
          {activeTab === "reports" && stats && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">ISP Performance & Statutory SLA Reports</h3>
                <Button variant="outline" size="sm" onClick={triggerCsvReportDownload} leftIcon={<FileDown />}>Export CSV</Button>
              </div>

              {/* Grid of SLA counters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-500">Average Optical Attenuation</CardTitle>
                    <CardTitle className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">-18.45 dBm</CardTitle>
                    <CardDescription className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">SLA THRESHOLD: &lt; -25.0 dBm (PERFECT)</CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-500">Active PPPoE Tunnel Success Ratio</CardTitle>
                    <CardTitle className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">99.82%</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-mono mt-1">RADIUS authentication request logs verified</CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-500">Scheduled Splicing Turnaround Time</CardTitle>
                    <CardTitle className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">42 Hours</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-mono mt-1">From billing activation to completed installation</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Attenuation / Signal map visual mockup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-sky-500" />
                    Broadband Core Optical Signal Distribution
                  </CardTitle>
                  <CardDescription>
                    Monitors attenuation limits (optics health index) per slot segment over the last quarters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Charts 
                    type="line" 
                    data={[
                      { name: "Segment A", active: 18.2, installations: 2 },
                      { name: "Segment B", active: 19.1, installations: 3 },
                      { name: "Segment C", active: 17.5, installations: 2 },
                      { name: "Segment D", active: 18.8, installations: 4 },
                      { name: "Segment E", active: 23.4, installations: 1 },
                      { name: "Segment F", active: 18.0, installations: 3 }
                    ]} 
                    metrics={[{ key: "active", color: "#f43f5e", label: "Signal Level (-dBm)" }]}
                    height={240}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          REUSABLE MODALS FOR ISP FORMS
         ------------------------------------------------------------- */}
      
      {/* 1. Register Subscriber Modal */}
      <Modal
        isOpen={activeModal === "add-subscriber"}
        onClose={() => setActiveModal(null)}
        title="Provision New GPON Broadband Subscriber"
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddSubscriberSubmit}>Activate Subscriber</Button>
          </>
        }
      >
        <form onSubmit={handleAddSubscriberSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select CRM Client Account"
              required
              options={crmCustomers.map(c => ({ value: c.id, label: c.companyName }))}
              value={subscriberForm.customerId}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, customerId: e.target.value })}
            />
            <Select
              label="Select Internet Tariff Package"
              required
              options={packages.map(p => ({ value: p.id, label: `${p.name} (${p.bandwidth})` }))}
              value={subscriberForm.packageId}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, packageId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Physical Installation Address"
              placeholder="e.g. South C Estate, House 4B, Nairobi"
              required
              value={subscriberForm.installationAddress}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, installationAddress: e.target.value })}
            />
            <Input
              label="GPS Lat/Long Coordinates"
              placeholder="e.g. -1.3204, 36.8288"
              value={subscriberForm.gpsCoordinates}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, gpsCoordinates: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Routing Connection Type"
              options={[
                { value: "FIBER", label: "GPON FTTH (Fiber)" },
                { value: "WIRELESS", label: "Ubiquiti PtMP (Wireless)" },
                { value: "COPPER", label: "VDSL (Copper)" }
              ]}
              value={subscriberForm.connectionType}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, connectionType: e.target.value as any })}
            />
            <Input
              label="Contact Phone"
              placeholder="+254 754..."
              value={subscriberForm.phoneNumber}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, phoneNumber: e.target.value })}
            />
            <Input
              label="Administrative Email"
              placeholder="client@gmail.com"
              value={subscriberForm.email}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
            <p className="font-bold text-slate-700 dark:text-slate-300">Optical PPPoE & IP Routing (MikroTik Core Server Config)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PPPoE Server Account Login"
                placeholder="e.g. customer_home_pppoe"
                value={subscriberForm.pppoeUsername}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, pppoeUsername: e.target.value })}
              />
              <Input
                label="PPPoE Secure Password"
                placeholder="CelcomPassSecure"
                value={subscriberForm.pppoePassword}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, pppoePassword: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Addressing Allocation"
                options={[
                  { value: "DYNAMIC", label: "Dynamic (RADIUS Pool)" },
                  { value: "STATIC", label: "Static IP Pool Lease" }
                ]}
                value={subscriberForm.ipType}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, ipType: e.target.value as any })}
              />
              <Input
                label="Static IP (If STATIC)"
                placeholder="e.g. 197.248.88.50"
                disabled={subscriberForm.ipType !== "STATIC"}
                value={subscriberForm.staticIpAddress}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, staticIpAddress: e.target.value })}
              />
              <Input
                label="Optical ONT MAC Address"
                placeholder="e.g. AC:8D:12:F1:C0:BB"
                value={subscriberForm.ontMac}
                onChange={(e) => setSubscriberForm({ ...subscriberForm, ontMac: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* 2. Config/Edit Subscriber Modal */}
      <Modal
        isOpen={activeModal === "edit-subscriber"}
        onClose={() => {
          setActiveModal(null);
          setSelectedSubscriber(null);
        }}
        title={`Configure Subscriber: ${selectedSubscriber?.id}`}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              setActiveModal(null);
              setSelectedSubscriber(null);
            }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleUpdateSubscriberSubmit}>Commit Specs</Button>
          </>
        }
      >
        <form onSubmit={handleUpdateSubscriberSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Physical Installation Address"
              value={subscriberForm.installationAddress}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, installationAddress: e.target.value })}
            />
            <Input
              label="GPS Lat/Long Coordinates"
              value={subscriberForm.gpsCoordinates}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, gpsCoordinates: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="PPPoE Server Account Login"
              value={subscriberForm.pppoeUsername}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, pppoeUsername: e.target.value })}
            />
            <Input
              label="PPPoE Secure Password"
              value={subscriberForm.pppoePassword}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, pppoePassword: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Addressing Allocation"
              options={[
                { value: "DYNAMIC", label: "Dynamic (RADIUS Pool)" },
                { value: "STATIC", label: "Static IP Pool Lease" }
              ]}
              value={subscriberForm.ipType}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, ipType: e.target.value as any })}
            />
            <Input
              label="Static IP (If STATIC)"
              disabled={subscriberForm.ipType !== "STATIC"}
              value={subscriberForm.staticIpAddress}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, staticIpAddress: e.target.value })}
            />
            <Input
              label="Optical ONT MAC Address"
              value={subscriberForm.ontMac}
              onChange={(e) => setSubscriberForm({ ...subscriberForm, ontMac: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* 3. Manage SLA / Change Status Modal */}
      <Modal
        isOpen={activeModal === "manage-status"}
        onClose={() => {
          setActiveModal(null);
          setSelectedSubscriber(null);
        }}
        title={`Authorize Subscriber SLA change: ${selectedSubscriber?.customerName}`}
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              setActiveModal(null);
              setSelectedSubscriber(null);
            }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleStatusChangeSubmit}>Commit SLA status</Button>
          </>
        }
      >
        <form onSubmit={handleStatusChangeSubmit} className="space-y-4 text-xs font-sans">
          <Select
            label="Authorize status state shift:"
            options={[
              { value: "ACTIVE", label: "Active (SLA Enabled)" },
              { value: "SUSPENDED", label: "Suspended (Walled Garden)" },
              { value: "DISCONNECTED", label: "Disconnected (Core Disabled)" },
              { value: "CANCELLED", label: "Cancelled (Contract Expired)" }
            ]}
            value={statusChangeForm.status}
            onChange={(e) => setStatusChangeForm({ ...statusChangeForm, status: e.target.value as any })}
          />

          <Textarea
            label="Provide Authorization Justification / Reason"
            placeholder="Describe why this SLA modification is logged (e.g. Non-payment of June 2026 balance or written cancellation requested by corporate procurement)"
            required
            value={statusChangeForm.reason}
            onChange={(e) => setStatusChangeForm({ ...statusChangeForm, reason: e.target.value })}
          />
        </form>
      </Modal>

      {/* 4. Add Package Modal */}
      <Modal
        isOpen={activeModal === "add-package"}
        onClose={() => setActiveModal(null)}
        title="Add Internet Tariff Package"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddPackageSubmit}>Save Tariff</Button>
          </>
        }
      >
        <form onSubmit={handleAddPackageSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Package/Tariff Name"
            placeholder="e.g. Celcom Home Basic"
            required
            value={packageForm.name}
            onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Bandwidth Description"
              placeholder="e.g. 15 Mbps"
              value={packageForm.bandwidth}
              onChange={(e) => setPackageForm({ ...packageForm, bandwidth: e.target.value })}
            />
            <Input
              label="Download Limit"
              placeholder="15 Mbps"
              value={packageForm.downloadSpeed}
              onChange={(e) => setPackageForm({ ...packageForm, downloadSpeed: e.target.value })}
            />
            <Input
              label="Upload Limit"
              placeholder="15 Mbps"
              value={packageForm.uploadSpeed}
              onChange={(e) => setPackageForm({ ...packageForm, uploadSpeed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monthly Subscription Price (KES)"
              type="number"
              value={packageForm.monthlyPrice}
              onChange={(e) => setPackageForm({ ...packageForm, monthlyPrice: Number(e.target.value) })}
            />
            <Input
              label="Standard Splice/Install Fee (KES)"
              type="number"
              value={packageForm.installationFee}
              onChange={(e) => setPackageForm({ ...packageForm, installationFee: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="Public Package Description"
            placeholder="Specify speed attributes or SLA uptime parameters..."
            value={packageForm.description}
            onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* 5. Edit Package Modal */}
      <Modal
        isOpen={activeModal === "edit-package"}
        onClose={() => {
          setActiveModal(null);
          setSelectedPackage(null);
        }}
        title={`Modify Tariff specs: ${selectedPackage?.name}`}
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              setActiveModal(null);
              setSelectedPackage(null);
            }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleEditPackageSubmit}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={handleEditPackageSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Tariff Name"
            value={packageForm.name}
            onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Bandwidth Description"
              value={packageForm.bandwidth}
              onChange={(e) => setPackageForm({ ...packageForm, bandwidth: e.target.value })}
            />
            <Input
              label="Download Limit"
              value={packageForm.downloadSpeed}
              onChange={(e) => setPackageForm({ ...packageForm, downloadSpeed: e.target.value })}
            />
            <Input
              label="Upload Limit"
              value={packageForm.uploadSpeed}
              onChange={(e) => setPackageForm({ ...packageForm, uploadSpeed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monthly Subscription Price (KES)"
              type="number"
              value={packageForm.monthlyPrice}
              onChange={(e) => setPackageForm({ ...packageForm, monthlyPrice: Number(e.target.value) })}
            />
            <Input
              label="Standard Splice/Install Fee (KES)"
              type="number"
              value={packageForm.installationFee}
              onChange={(e) => setPackageForm({ ...packageForm, installationFee: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="Description"
            value={packageForm.description}
            onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* 6. Update Installation Modal */}
      <Modal
        isOpen={activeModal === "update-installation"}
        onClose={() => {
          setActiveModal(null);
          setSelectedInstallation(null);
        }}
        title={`Splice Progress update: ${selectedInstallation?.installationNumber}`}
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              setActiveModal(null);
              setSelectedInstallation(null);
            }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleUpdateInstallationSubmit}>Commit Progress</Button>
          </>
        }
      >
        <form onSubmit={handleUpdateInstallationSubmit} className="space-y-4 text-xs font-sans">
          <Select
            label="Splicing/Installation Stage Status"
            options={[
              { value: "SCHEDULED", label: "Scheduled (Splicing planned)" },
              { value: "ASSIGNED", label: "Assigned to team" },
              { value: "IN_PROGRESS", label: "Technician on site" },
              { value: "COMPLETED", label: "Completed & Splice Link Verified (Attn tested)" },
              { value: "CANCELLED", label: "Cancelled (Access Denied)" }
            ]}
            value={installationForm.status}
            onChange={(e) => setInstallationForm({ ...installationForm, status: e.target.value as any })}
          />

          <Input
            label="Assigned Lead Technician"
            placeholder="e.g. Esther Wanjiku"
            value={installationForm.technicianName}
            onChange={(e) => setInstallationForm({ ...installationForm, technicianName: e.target.value })}
          />

          <Input
            label="Equipment Serials (Comma separated)"
            placeholder="e.g. ONT-HUAWEI-9920, SN-PATCH-5M"
            value={installationForm.equipmentUsedRaw}
            onChange={(e) => setInstallationForm({ ...installationForm, equipmentUsedRaw: e.target.value })}
          />

          <Textarea
            label="Materials & Cabling Splice Checklist"
            placeholder="e.g. 150m fiber drop cable, micro-ODF splitter block, neat surface mounting..."
            value={installationForm.materialsUsed}
            onChange={(e) => setInstallationForm({ ...installationForm, materialsUsed: e.target.value })}
          />

          <Input
            label="Final Splicing / Dispatch Cost (KES)"
            type="number"
            value={installationForm.installationCost}
            onChange={(e) => setInstallationForm({ ...installationForm, installationCost: Number(e.target.value) })}
          />
        </form>
      </Modal>

      {/* 7. Assign Equipment Modal */}
      <Modal
        isOpen={activeModal === "assign-equipment"}
        onClose={() => setActiveModal(null)}
        title="Assign Hardware Router to Subscriber Link"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAssignEquipmentSubmit}>Commit Handover</Button>
          </>
        }
      >
        <form onSubmit={handleAssignEquipmentSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Device Serial Number (CPE / ONT)"
            placeholder="e.g. SN-UBNT-AP-11022"
            required
            value={equipmentForm.serialNumber}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, serialNumber: e.target.value })}
          />

          <Input
            label="Device MAC Address"
            placeholder="e.g. FC:42:01:A2:FF:10"
            value={equipmentForm.macAddress}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, macAddress: e.target.value })}
          />

          <Input
            label="Device Model Name"
            placeholder="e.g. Ubiquiti UniFi AP AC Lite"
            value={equipmentForm.deviceModel}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, deviceModel: e.target.value })}
          />

          <Select
            label="Map to subscriber connection:"
            required
            options={subscribers.map(s => ({ value: s.id, label: s.customerName }))}
            value={equipmentForm.subscriberId}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, subscriberId: e.target.value })}
          />

          <Textarea
            label="Deployment Notes"
            placeholder="CPE warranty terms or power supply specifications..."
            value={equipmentForm.notes}
            onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* 8. Connect Core Device Modal */}
      <Modal
        isOpen={activeModal === "add-device"}
        onClose={() => setActiveModal(null)}
        title="Connect GPON OLT / RADIUS Device API"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddDeviceSubmit}>Establish Connection</Button>
          </>
        }
      >
        <form onSubmit={handleAddDeviceSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Node / Headend Name"
            placeholder="e.g. Westlands Central MikroTik CCR"
            required
            value={deviceForm.name}
            onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Headend Hardware Type"
              options={[
                { value: "MIKROTIK", label: "MikroTik RouterOS Core" },
                { value: "UBIQUITI", label: "Ubiquiti UISP Gateway" },
                { value: "RADIUS_SERVER", label: "Central RADIUS authorization" }
              ]}
              value={deviceForm.deviceType}
              onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value as any })}
            />
            <Input
              label="Physical Management IP"
              placeholder="e.g. 10.100.1.1"
              required
              value={deviceForm.ipAddress}
              onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="API Tunnels Operator Username"
              value={deviceForm.apiUsername}
              onChange={(e) => setDeviceForm({ ...deviceForm, apiUsername: e.target.value })}
            />
            <Input
              label="API Tunnels Secure Password"
              type="password"
              placeholder="••••••••"
              value={deviceForm.apiPassword}
              onChange={(e) => setDeviceForm({ ...deviceForm, apiPassword: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* 9. View Receipt / Statement Statement */}
      <Modal
        isOpen={activeModal === "view-receipt"}
        onClose={() => {
          setActiveModal(null);
          setSelectedInvoice(null);
        }}
        title="Celcom Networks Lease Statement"
        size="md"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              setActiveModal(null);
              setSelectedInvoice(null);
            }}>Close Dialog</Button>
            <Button variant="primary" size="sm" onClick={() => {
              showNotification("Print Triggered", "Sending statement document metadata to physical dispatch.", "success");
            }} leftIcon={<FileText />}>Print statement</Button>
          </>
        }
      >
        {selectedInvoice && (
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-6 font-sans text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-mono font-bold text-slate-500 uppercase tracking-widest text-[9px]">CELCOM NETWORKS CO. KE</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Waiyaki Way, Westlands, Nairobi, Kenya</p>
                <p className="text-[10px] text-slate-400">PIN: P051100224Z</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  selectedInvoice.status === "PAID"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-900"
                    : "bg-amber-950 text-amber-400 border-amber-900"
                }`}>
                  {selectedInvoice.status}
                </span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{selectedInvoice.invoiceNumber}</p>
                <p className="text-[10px] text-slate-400">Issued: {selectedInvoice.createdAt.split("T")[0]}</p>
              </div>
            </div>

            {/* Billing details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400">BILLED TO:</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedInvoice.customerName}</p>
                <p className="text-slate-500 text-[10px]">Subscriber reference: {selectedInvoice.subscriberId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">BILLING CYCLE PERIOD:</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedInvoice.billingPeriod}</p>
                <p className="text-[10px] text-slate-400">DUE BY: {selectedInvoice.dueDate}</p>
              </div>
            </div>

            {/* Line items */}
            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3 my-2 space-y-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-400 pb-1.5 border-b border-slate-100 dark:border-slate-800/50">
                <span>Description of service</span>
                <span>Unit Price (KES)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-800 dark:text-slate-200 font-semibold">
                <span>Broadband Recurring: {selectedInvoice.packageName} ({selectedInvoice.billingPeriod})</span>
                <span className="font-mono font-bold">KES {selectedInvoice.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 font-mono text-[11px] text-right">
              <div>
                <span className="text-slate-400">Net:</span>
                <span className="text-slate-800 dark:text-slate-200 ml-4 font-bold">KES {Number((selectedInvoice.amount / 1.16).toFixed(2)).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">VAT (16.0%):</span>
                <span className="text-slate-800 dark:text-slate-200 ml-4 font-bold">KES {Number((selectedInvoice.amount * 0.16 / 1.16).toFixed(2)).toLocaleString()}</span>
              </div>
              <div className="text-sm font-bold text-sky-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>TOTAL AMOUNT DUE:</span>
                <span className="ml-4 font-black">KES {selectedInvoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
