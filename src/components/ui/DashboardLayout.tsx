import React, { useState } from "react";
import { 
  Menu, 
  X, 
  Search, 
  Moon, 
  Sun, 
  Cpu, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DollarSign, 
  Radio, 
  Wrench, 
  Users2,
  FileText,
  Package,
  ShoppingCart,
  Briefcase,
  Cable
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { ProfileMenu } from "./ProfileMenu";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";
import { useAuth } from "../../context/AuthContext";

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNavId?: string;
  breadcrumbs?: BreadcrumbItem[];
  onNavChange?: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function DashboardLayout({
  children,
  activeNavId = "dashboard",
  breadcrumbs = [],
  onNavChange,
  searchQuery = "",
  onSearchChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // ERP Sidebar Links Map (Matching high-level ERP requirements)
  const navItems: NavigationItem[] = [
    { id: "dashboard", label: "Operations Hub", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "subscribers", label: "Broadband Subscribers", icon: <Radio className="h-4 w-4" /> },
    { id: "projects", label: "Projects Module", icon: <Briefcase className="h-4 w-4" /> },
    { id: "crm", label: "CRM Module", icon: <Users2 className="h-4 w-4" /> },
    { id: "inventory", label: "Inventory Module", icon: <Package className="h-4 w-4" /> },
    { id: "procurement", label: "Procurement Module", icon: <ShoppingCart className="h-4 w-4" /> },
    { id: "ledgers", label: "General Ledgers", icon: <BookOpen className="h-4 w-4" /> },
    { id: "billing", label: "Invoicing & Revenue", icon: <DollarSign className="h-4 w-4" /> },
    { id: "payroll", label: "Statutory Payroll", icon: <Users2 className="h-4 w-4" /> },
    { id: "tickets", label: "Support & SLA", icon: <Wrench className="h-4 w-4" /> },
    { id: "reports", label: "Financial Reports", icon: <FileText className="h-4 w-4" /> },
    { id: "integrations", label: "External Integrations", icon: <Cable className="h-4 w-4" /> },
  ];

  if (user?.role === "SUPER_ADMIN" || user?.role === "MANAGING_DIRECTOR") {
    navItems.push({ id: "admin", label: "Administration", icon: <Users className="h-4 w-4" /> });
  }

  // Map user structure from AuthContext securely
  const activeUserProfile = {
    name: user ? `${user.firstName} ${user.lastName}` : "Authenticated Staff",
    email: user?.email || "staff@celcomnetworks.co.ke",
    role: user?.role || "VIEWER",
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* -------------------------------------------------------------
          SIDEBAR: DESKTOP & MOBILE TRANSITIONS
         ------------------------------------------------------------- */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-110 w-64 bg-slate-900 text-slate-100 border-r border-slate-950/80
          transform lg:transform-none lg:opacity-100 lg:relative transition-all duration-300 flex flex-col justify-between
          ${sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar Header: Branding & Exit Button */}
        <div>
          <div className="p-4 px-5 border-b border-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 p-2 rounded-lg text-slate-900 shadow-md">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-widest text-white font-mono">CELCOM ERP</h2>
                <p className="text-[10px] text-slate-400 font-sans">Networks Operations Core</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onNavChange) onNavChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left cursor-pointer transition-all duration-150
                    ${isActive 
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/10 border-l-2 border-sky-400" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}
                  `}
                >
                  <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Service Status indicator */}
        <div className="p-4 px-5 bg-slate-950/40 border-t border-slate-950/20 text-xs text-slate-400 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-sky-400">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Nairobi GPON Tunnel Ok
          </div>
          <p className="text-[10px]">Active Node: NBO-HQ-01</p>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          MAIN VIEW CONTAINER
         ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-w-0">
        
        {/* NAVBAR: Top Control panel */}
        <header className="sticky top-0 z-100 bg-white dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Mobile menu trigger & Breadcrumb mapping */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <Menu className="h-4 w-4" />
            </button>
            
            <div className="hidden md:block min-w-0">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </div>

          {/* Search box, Theme toggler, Profile popup */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Standard ERP Search input */}
            {onSearchChange && (
              <div className="hidden sm:flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 w-56 focus-within:w-64 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-200">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  placeholder="Universal search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
                />
              </div>
            )}

            {/* Theme switch button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-slate-500 dark:text-slate-400 cursor-pointer"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Profile Dropdown */}
            <ProfileMenu 
              user={activeUserProfile} 
              onLogout={logout} 
              onProfileClick={() => onNavChange?.("profile")} 
            />
          </div>
        </header>

        {/* Core Canvas Body */}
        <main className="flex-1 p-6 relative min-w-0">
          {children}
        </main>

        {/* Dynamic Status / Version Footer */}
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <span>&copy; 2026 Celcom Networks Ltd. All Rights Reserved. Kenya.</span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>ENV: <span className="text-amber-500">development</span></span>
            <span>PORT: <span className="text-sky-500">3000</span></span>
            <span>LATENCY: <span className="text-emerald-500">2ms</span></span>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default DashboardLayout;
