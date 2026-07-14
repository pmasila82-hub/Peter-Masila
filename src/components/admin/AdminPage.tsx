import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  ShieldAlert, 
  FileCheck2, 
  Settings2, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Trash2, 
  RefreshCw, 
  Search, 
  Building2, 
  Info, 
  Lock,
  Globe,
  MapPin,
  Mail,
  Phone,
  Hash,
  Coins,
  Percent,
  CheckCircle2,
  AlertTriangle,
  UserCheck
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

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  role: string;
}

interface CompanyProfile {
  name: string;
  address: string;
  kraPin: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  vatRate: number;
  currency: string;
}

interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  contactPerson: string;
  status: "ACTIVE" | "INACTIVE";
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  id: string;
  slug: string;
  description: string;
}

export function AdminPage() {
  const { accessToken } = useAuth();
  const { showNotification } = useNotifications();

  // Active view tab state
  const [activeTab, setActiveTab] = useState<"users" | "permissions" | "audit" | "settings">("users");

  // Loading States
  const [usersLoading, setUsersLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, string[]>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: "Celcom Networks Limited",
    address: "Westlands, Nairobi, Kenya",
    kraPin: "P051234567A",
    contactEmail: "info@celcomnetworks.co.ke",
    contactPhone: "+254 20 1234567",
    website: "www.celcomnetworks.co.ke",
    vatRate: 16.0,
    currency: "KES"
  });
  const [branches, setBranches] = useState<Branch[]>([]);

  // Search & Filters
  const [userQuery, setUserQuery] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditModuleFilter, setAuditModuleFilter] = useState("ALL");

  // Modal controls
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [auditPage, setAuditPage] = useState(1);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);

  // Form states
  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "VIEWER",
    password: "",
    isActive: true
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  const [branchForm, setBranchForm] = useState({
    code: "",
    name: "",
    location: "",
    contactPerson: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });
  const [branchFormErrors, setBranchFormErrors] = useState<Record<string, string>>({});

  // -----------------------------------------------------------------
  // API ACTIONS
  // -----------------------------------------------------------------

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        showNotification("Failed to fetch users", data.message || "An error occurred", "error");
      }
    } catch (e) {
      showNotification("Failed to fetch users", "Could not connect to the API server", "error");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    setMatrixLoading(true);
    try {
      const res = await fetch("/api/v1/admin/roles-permissions", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
        setPermissions(data.permissions);
        setPermissionMatrix(data.matrix);
      }
    } catch (e) {
      showNotification("Permission Sync Unreachable", "Error fetching dynamic security configuration grids.", "error");
    } finally {
      setMatrixLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/v1/admin/audit-logs", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      showNotification("Audit Trail Unreachable", "Could not retrieve system audit logging frames.", "error");
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const profileRes = await fetch("/api/v1/admin/company-profile", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setCompanyProfile(profileData.profile);
      }

      const branchesRes = await fetch("/api/v1/admin/branches", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const branchesData = await branchesRes.json();
      if (branchesData.success) {
        setBranches(branchesData.branches);
      }
    } catch (e) {
      showNotification("Settings Fetch Failed", "Failed to retrieve company profiles or branch specifications.", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Run on Tab Shifts
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "permissions") {
      fetchRolePermissions();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    } else if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab, accessToken]);

  // -----------------------------------------------------------------
  // USER OPERATIONS
  // -----------------------------------------------------------------

  const handleOpenUserModal = (usr: AdminUser | null = null) => {
    setEditingUser(usr);
    setUserFormErrors({});
    if (usr) {
      setUserForm({
        email: usr.email,
        firstName: usr.firstName,
        lastName: usr.lastName,
        phoneNumber: usr.phoneNumber || "",
        role: usr.role,
        password: "", // Leave blank for no change
        isActive: usr.isActive
      });
    } else {
      setUserForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "VIEWER",
        password: "",
        isActive: true
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!userForm.firstName.trim()) errors.firstName = "First name is required.";
    if (!userForm.lastName.trim()) errors.lastName = "Last name is required.";
    if (!userForm.email.trim() || !userForm.email.includes("@")) errors.email = "Valid administrative email is required.";
    if (!editingUser && !userForm.password) {
      errors.password = "Initial system password is required for new accounts.";
    }

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    const payload = { ...userForm };
    if (editingUser && !payload.password) {
      delete (payload as any).password;
    }

    try {
      const url = editingUser ? `/api/v1/admin/users/${editingUser.id}` : "/api/v1/admin/users";
      const method = editingUser ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          editingUser ? "Account Configured" : "Staff Account Registered",
          data.message,
          "success"
        );
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        showNotification("Action Failed", data.message || "Could not write credentials.", "error");
      }
    } catch (e) {
      showNotification("Connectivity Error", "Could not submit credentials to full-stack engine.", "error");
    }
  };

  const handleDeactivateUser = async (usr: AdminUser) => {
    if (!window.confirm(`Are you sure you want to deactivate administrative access for ${usr.firstName} ${usr.lastName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${usr.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Account Suspended", `${usr.firstName}'s access de-provisioned successfully.`, "success");
        fetchUsers();
      } else {
        showNotification("Suspension Failed", data.message, "error");
      }
    } catch (e) {
      showNotification("Connectivity Error", "Could not send deactivation command.", "error");
    }
  };

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm(prev => ({ ...prev, password: pass }));
    showNotification("Password Compiled", "A high-entropy password was compiled into the state.", "info");
  };

  // -----------------------------------------------------------------
  // PERMISSION OPERATIONS
  // -----------------------------------------------------------------

  const handleTogglePermission = (roleName: string, slug: string) => {
    setPermissionMatrix(prev => {
      const current = prev[roleName] || [];
      const updated = current.includes(slug)
        ? current.filter(s => s !== slug)
        : [...current, slug];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSaveRolePermissions = async (roleName: string) => {
    try {
      const res = await fetch(`/api/v1/admin/roles-permissions/${roleName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ permissions: permissionMatrix[roleName] })
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Security Matrix Saved", `Successfully compiled role access flags for ${roleName}.`, "success");
      } else {
        showNotification("Configuration Error", data.message, "error");
      }
    } catch (e) {
      showNotification("Database Frame Unreachable", "Failed to update role clearance.", "error");
    }
  };

  // -----------------------------------------------------------------
  // COMPANY & BRANCH OPERATIONS
  // -----------------------------------------------------------------

  const handleUpdateCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/admin/company-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(companyProfile)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Profile Written", "Corporate ERP profile specifications updated successfully.", "success");
      } else {
        showNotification("Update Failed", data.message, "error");
      }
    } catch (e) {
      showNotification("Server Link Broken", "Failed to write company settings profile.", "error");
    }
  };

  const handleOpenBranchModal = (br: Branch | null = null) => {
    setEditingBranch(br);
    setBranchFormErrors({});
    if (br) {
      setBranchForm({
        code: br.code,
        name: br.name,
        location: br.location,
        contactPerson: br.contactPerson,
        status: br.status
      });
    } else {
      setBranchForm({
        code: "",
        name: "",
        location: "",
        contactPerson: "",
        status: "ACTIVE"
      });
    }
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!branchForm.code.trim()) errors.code = "Unique Branch Code (e.g. NBO-HQ) is required.";
    if (!branchForm.name.trim()) errors.name = "Branch Name is required.";
    if (!branchForm.location.trim()) errors.location = "Physical street location is required.";
    if (!branchForm.contactPerson.trim()) errors.contactPerson = "Branch administrator name is required.";

    if (Object.keys(errors).length > 0) {
      setBranchFormErrors(errors);
      return;
    }

    try {
      const url = editingBranch ? `/api/v1/admin/branches/${editingBranch.id}` : "/api/v1/admin/branches";
      const method = editingBranch ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(branchForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Branch Roster Written", data.message, "success");
        setIsBranchModalOpen(false);
        fetchSettings();
      } else {
        showNotification("Setup Error", data.message, "error");
      }
    } catch (e) {
      showNotification("Gateway Error", "Failed to compile branch registry details.", "error");
    }
  };

  const handleDeleteBranch = async (branchId: string, name: string) => {
    if (!window.confirm(`Remove branch location "${name}" from enterprise directory? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/branches/${branchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Location Purged", "Branch was successfully removed from settings.", "success");
        fetchSettings();
      }
    } catch (e) {
      showNotification("Gateway Error", "Failed to request location deletion.", "error");
    }
  };

  // -----------------------------------------------------------------
  // MEMOIZED CALCS: FILTERS, SORTS & PAGINATION
  // -----------------------------------------------------------------

  const filteredUsers = useMemo(() => {
    return users.filter(usr => {
      const match = userQuery.toLowerCase();
      return (
        usr.firstName.toLowerCase().includes(match) ||
        usr.lastName.toLowerCase().includes(match) ||
        usr.email.toLowerCase().includes(match) ||
        usr.role.toLowerCase().includes(match) ||
        (usr.phoneNumber && usr.phoneNumber.includes(match))
      );
    });
  }, [users, userQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userRowsPerPage;
    return filteredUsers.slice(start, start + userRowsPerPage);
  }, [filteredUsers, userPage, userRowsPerPage]);

  const filteredAudits = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase());
      
      const matchesModule = 
        auditModuleFilter === "ALL" || log.module === auditModuleFilter;

      return matchesSearch && matchesModule;
    });
  }, [auditLogs, auditSearch, auditModuleFilter]);

  const paginatedAudits = useMemo(() => {
    const start = (auditPage - 1) * auditRowsPerPage;
    return filteredAudits.slice(start, start + auditRowsPerPage);
  }, [filteredAudits, auditPage, auditRowsPerPage]);

  // -----------------------------------------------------------------
  // TABLE COLUMNS SCHEMAS
  // -----------------------------------------------------------------

  const userColumns: Column<AdminUser>[] = [
    { key: "name", header: "Legal Staff Name", render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-sky-600">
          {row.firstName[0]}{row.lastName[0]}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">{row.firstName} {row.lastName}</h4>
          <p className="text-[10px] text-slate-400">{row.phoneNumber || "No telephone"}</p>
        </div>
      </div>
    )},
    { key: "email", header: "Email Address" },
    { key: "role", header: "Assigned ERP Role", render: (row) => (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
        {row.role}
      </span>
    )},
    { key: "isActive", header: "Status Flags", render: (row) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
        row.isActive 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      }`}>
        <span className={`h-1 w-1 rounded-full ${row.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
        {row.isActive ? "ACTIVE" : "DISABLED"}
      </span>
    )},
    { key: "createdAt", header: "Created On", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: "actions", header: "Actions", render: (row) => (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="xs" 
          onClick={() => handleOpenUserModal(row)}
          title="Edit configs"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {row.isActive && (
          <Button 
            variant="outline" 
            size="xs" 
            className="text-rose-400 hover:text-rose-300 border-rose-950/20"
            onClick={() => handleDeactivateUser(row)}
            title="Deactivate security clearance"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )}
  ];

  const auditColumns: Column<AuditLog>[] = [
    { key: "timestamp", header: "Timestamp", render: (row) => (
      <span className="text-[10px] text-slate-400 font-mono">
        {new Date(row.timestamp).toLocaleString()}
      </span>
    )},
    { key: "userEmail", header: "Operator", render: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{row.userEmail}</span>
        <span className="text-[9px] text-slate-500">ID: {row.userId}</span>
      </div>
    )},
    { key: "action", header: "Event Code", render: (row) => (
      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
        {row.action}
      </span>
    )},
    { key: "module", header: "Module Target", render: (row) => (
      <span className="text-[10px] font-bold text-sky-400 tracking-wide font-mono">
        {row.module}
      </span>
    )},
    { key: "details", header: "Audit Scope Details", render: (row) => (
      <span className="text-slate-400 font-sans tracking-normal whitespace-pre-wrap">
        {row.details}
      </span>
    )}
  ];

  const branchColumns: Column<Branch>[] = [
    { key: "code", header: "Code", render: (row) => <span className="font-mono font-bold text-sky-400">{row.code}</span> },
    { key: "name", header: "Office / Branch Name", render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</span> },
    { key: "location", header: "Physical Location", render: (row) => <span className="text-slate-400 font-sans">{row.location}</span> },
    { key: "contactPerson", header: "Contact Person", render: (row) => <span className="text-slate-300 font-sans font-medium">{row.contactPerson}</span> },
    { key: "status", header: "Status", render: (row) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
        row.status === "ACTIVE" 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      }`}>
        {row.status}
      </span>
    )},
    { key: "actions", header: "Actions", render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="xs" onClick={() => handleOpenBranchModal(row)}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="xs" className="text-rose-400 hover:text-rose-300" onClick={() => handleDeleteBranch(row.id, row.name)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      
      {/* -------------------------------------------------------------
          MODULE BANNER HEADER
         ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="h-6 w-6 text-sky-500" />
            Administration Controls
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system configurations, manage corporate branches, map role permissions matrix and inspect audit security logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "users" && (
            <Button variant="primary" size="sm" onClick={() => handleOpenUserModal()} leftIcon={<Plus className="h-4 w-4" />}>
              Create User Account
            </Button>
          )}
          {activeTab === "settings" && (
            <Button variant="primary" size="sm" onClick={() => handleOpenBranchModal()} leftIcon={<Plus className="h-4 w-4" />}>
              Add Branch
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (activeTab === "users") fetchUsers();
              else if (activeTab === "permissions") fetchRolePermissions();
              else if (activeTab === "audit") fetchAuditLogs();
              else if (activeTab === "settings") fetchSettings();
              showNotification("Roster Synced", "Live configurations re-downloaded successfully.", "success");
            }}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Re-sync
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUB NAVIGATION SUB-TABS
         ------------------------------------------------------------- */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/50">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "users"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          User Registry
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "permissions"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          Security Clearance Grid
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "audit"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          Compliance Audit Trails
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          ERP Settings & Branches
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB CONTROLLERS VIEWPORT
         ------------------------------------------------------------- */}

      {/* 1. USER REGISTRY TAB */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search staff, email, role or phone..."
                value={userQuery}
                onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="text-xs text-slate-500 self-center">
              Active clearance records: <span className="font-bold text-sky-400">{filteredUsers.length}</span>
            </div>
          </div>

          <Table 
            columns={userColumns} 
            data={paginatedUsers} 
            isLoading={usersLoading} 
            emptyMessage="No administrative users matched query settings."
          />

          {filteredUsers.length > 0 && (
            <Pagination 
              currentPage={userPage}
              totalPages={Math.ceil(filteredUsers.length / userRowsPerPage)}
              totalRecords={filteredUsers.length}
              rowsPerPage={userRowsPerPage}
              onPageChange={setUserPage}
              onRowsPerPageChange={(rows) => { setUserRowsPerPage(rows); setUserPage(1); }}
            />
          )}
        </div>
      )}

      {/* 2. SECURITY CLEARANCE GRID (ROLE-PERMISSION MATRIX) */}
      {activeTab === "permissions" && (
        <Card className="border-slate-200 dark:border-slate-800/80">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-sky-400 animate-pulse" />
              Corporate Authorization Matrices
            </CardTitle>
            <CardDescription>
              Assign distinct functional permission slugs directly to standard system roles. Changes propagate instantly across all active sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {matrixLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-sky-500" />
                Retrieving active permissions matrix rules...
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-sans border-r border-slate-100 dark:border-slate-800/40 w-1/4">
                      Security Scope Slugs
                    </th>
                    {roles.map(r => (
                      <th key={r.id} className="p-4 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tight text-center border-r border-slate-100 dark:border-slate-800/40">
                        <div className="flex flex-col items-center gap-1">
                          <span title={r.description}>{r.name}</span>
                          <Button variant="outline" size="xxs" className="mt-1.5" onClick={() => handleSaveRolePermissions(r.name)}>
                            Save
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {permissions.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? "bg-slate-50/10 dark:bg-slate-900/5" : "bg-transparent"}>
                      <td className="p-4 border-r border-slate-100 dark:border-slate-800/40">
                        <h4 className="font-mono text-xs font-bold text-sky-400 tracking-tight">{p.slug}</h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5">{p.description}</p>
                      </td>
                      {roles.map(r => {
                        const hasPerm = (permissionMatrix[r.name] || []).includes(p.slug);
                        return (
                          <td key={`${r.id}-${p.id}`} className="p-4 text-center border-r border-slate-100 dark:border-slate-800/40">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              onChange={() => handleTogglePermission(r.name, p.slug)}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. COMPLIANCE AUDIT TRAILS */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search audit actions, emails, specific changes details..."
                value={auditSearch}
                onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <Select
                label=""
                options={[
                  { value: "ALL", label: "All Operational Modules" },
                  { value: "AUTHENTICATION", label: "Authentication & Sessions" },
                  { value: "USER_MANAGEMENT", label: "User Registry Modifications" },
                  { value: "PERMISSIONS_MATRIX", label: "Clearance Grid Modifications" },
                  { value: "TECHNICAL_OPS", label: "GPON Telemetry Ops" },
                  { value: "FINANCE_HR", label: "Ledger / Payroll Runs" },
                  { value: "ADMIN_SYSTEM", label: "Corporate Settings Modifications" }
                ]}
                value={auditModuleFilter}
                onChange={(e) => { setAuditModuleFilter(e.target.value); setAuditPage(1); }}
              />
            </div>
          </div>

          <Table 
            columns={auditColumns} 
            data={paginatedAudits} 
            isLoading={auditLoading} 
            emptyMessage="No administrative log statements match criteria."
          />

          {filteredAudits.length > 0 && (
            <Pagination 
              currentPage={auditPage}
              totalPages={Math.ceil(filteredAudits.length / auditRowsPerPage)}
              totalRecords={filteredAudits.length}
              rowsPerPage={auditRowsPerPage}
              onPageChange={setAuditPage}
              onRowsPerPageChange={(rows) => { setAuditRowsPerPage(rows); setAuditPage(1); }}
            />
          )}
        </div>
      )}

      {/* 4. SETTINGS & BRANCHES TAB */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* Company Profile Configuration Card */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200 dark:border-slate-800/80">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/50">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-sky-400" />
                  Corporate Company Profile
                </CardTitle>
                <CardDescription>
                  Modify general metadata used in invoicing structures and KRA tax filings.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {settingsLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading settings...</div>
                ) : (
                  <form onSubmit={handleUpdateCompanySettings} className="space-y-4">
                    <Input 
                      label="Company Legal Name" 
                      value={companyProfile.name} 
                      onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })} 
                      required
                    />
                    <Input 
                      label="Physical Registered HQ Address" 
                      value={companyProfile.address} 
                      onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })} 
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Kenyan KRA PIN" 
                        value={companyProfile.kraPin} 
                        onChange={(e) => setCompanyProfile({ ...companyProfile, kraPin: e.target.value })} 
                        required
                      />
                      <Input 
                        label="Standard VAT %" 
                        type="number" 
                        step="0.1"
                        value={companyProfile.vatRate} 
                        onChange={(e) => setCompanyProfile({ ...companyProfile, vatRate: parseFloat(e.target.value) })} 
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Billing Currency" 
                        value={companyProfile.currency} 
                        onChange={(e) => setCompanyProfile({ ...companyProfile, currency: e.target.value })} 
                        required
                      />
                      <Input 
                        label="Website URL" 
                        value={companyProfile.website} 
                        onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })} 
                        required
                      />
                    </div>
                    <Input 
                      label="Corporate Support Email" 
                      type="email"
                      value={companyProfile.contactEmail} 
                      onChange={(e) => setCompanyProfile({ ...companyProfile, contactEmail: e.target.value })} 
                      required
                    />
                    <Input 
                      label="Corporate Phone Contact" 
                      value={companyProfile.contactPhone} 
                      onChange={(e) => setCompanyProfile({ ...companyProfile, contactPhone: e.target.value })} 
                      required
                    />
                    <Button variant="primary" size="sm" type="submit" className="w-full">
                      Write Profile Specifications
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Branches list card */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 dark:border-slate-800/80">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/50">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-sky-400" />
                  Branch Locations Directory
                </CardTitle>
                <CardDescription>
                  Enterprise list of physical office hubs, drop nodes and technician units.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table 
                  columns={branchColumns} 
                  data={branches} 
                  isLoading={settingsLoading} 
                  emptyMessage="No physical branches registered under this corporate account."
                />
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          REUSABLE MODAL: USER CREATE/EDIT FORM
         ------------------------------------------------------------- */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? "Configure Staff Clearance" : "Provision New Administrative Staff"}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsUserModalOpen(false)}>
              Cancel Setup
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveUser}>
              Write Credentials
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="First Name" 
              placeholder="e.g. Samuel" 
              required 
              value={userForm.firstName}
              onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
              error={userFormErrors.firstName}
            />
            <Input 
              label="Last Name" 
              placeholder="e.g. Ndwiga" 
              required 
              value={userForm.lastName}
              onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
              error={userFormErrors.lastName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Staff Email Address" 
              type="email"
              placeholder="e.g. s.ndwiga@celcomnetworks.co.ke" 
              required 
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              error={userFormErrors.email}
              disabled={!!editingUser}
            />
            <Input 
              label="Telephone Contact" 
              placeholder="e.g. +254700112233" 
              value={userForm.phoneNumber}
              onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select 
              label="Enterprise Role Placement" 
              options={[
                { value: "SUPER_ADMIN", label: "SUPER_ADMIN - Full Root" },
                { value: "MANAGING_DIRECTOR", label: "MANAGING_DIRECTOR - Executive Oversight" },
                { value: "ACCOUNTANT", label: "ACCOUNTANT - Ledgers & Invoices" },
                { value: "HR_MANAGER", label: "HR_MANAGER - Personnel & Payroll" },
                { value: "SALES", label: "SALES - Prospects & Subscriptions" },
                { value: "PROCUREMENT", label: "PROCUREMENT - Suppliers & LPOs" },
                { value: "STORE_MANAGER", label: "STORE_MANAGER - Assets & Inventory" },
                { value: "TECHNICIAN", label: "TECHNICIAN - GPON & Attenuation" },
                { value: "CUSTOMER_SUPPORT", label: "CUSTOMER_SUPPORT - Support & Tickets" },
                { value: "VIEWER", label: "VIEWER - Read-Only Auditor" }
              ]}
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            />
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    label={editingUser ? "Set Password (leave blank to retain)" : "System Default Password"}
                    type="text"
                    placeholder="Provide a password or generate secure..." 
                    required={!editingUser}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    error={userFormErrors.password}
                  />
                </div>
                <Button variant="outline" size="sm" type="button" className="h-[38px] mb-0.5" onClick={generateSecurePassword}>
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {editingUser && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Checkbox 
                label="Clearance Status (If unchecked, account is immediately disabled)" 
                checked={userForm.isActive}
                onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* -------------------------------------------------------------
          REUSABLE MODAL: BRANCH SETUP FORM
         ------------------------------------------------------------- */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? "Configure Branch Specifications" : "Register New Branch Location"}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBranch}>
              Register Branch
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Unique Branch Code" 
              placeholder="e.g. NBO-HQ" 
              required 
              value={branchForm.code}
              onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              error={branchFormErrors.code}
              disabled={!!editingBranch}
            />
            <Input 
              label="Branch Name" 
              placeholder="e.g. Nairobi Head Office" 
              required 
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              error={branchFormErrors.name}
            />
          </div>

          <Input 
            label="Street Address / Physical Coordinates" 
            placeholder="e.g. 6th Floor, Westlands Commercial Centre, Nairobi" 
            required 
            value={branchForm.location}
            onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
            error={branchFormErrors.location}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Branch Manager / Contact Person" 
              placeholder="e.g. James Kamau" 
              required 
              value={branchForm.contactPerson}
              onChange={(e) => setBranchForm({ ...branchForm, contactPerson: e.target.value })}
              error={branchFormErrors.contactPerson}
            />
            <Select 
              label="Status" 
              options={[
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "INACTIVE", label: "INACTIVE" }
              ]}
              value={branchForm.status}
              onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value as "ACTIVE" | "INACTIVE" })}
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default AdminPage;
