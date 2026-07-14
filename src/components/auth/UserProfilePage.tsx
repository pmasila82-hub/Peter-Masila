import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { User, Shield, Phone, Mail, Clock, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";

export function UserProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showNotification } = useNotifications();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive system security roles and visual badges
  const getRoleDescription = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Complete root access to ERP directories and OLT optic headends.";
      case "MANAGING_DIRECTOR":
        return "Executive operational intelligence, ledger reports, and billing audits.";
      case "ACCOUNTANT":
        return "Handles VAT compliance, general double-entry ledgers, and financial metrics.";
      case "HR_MANAGER":
        return "Manages payroll slips, staff registries, and corporate tax compliance.";
      case "SALES":
        return "Registers subscriber accounts and generates installation work orders.";
      case "TECHNICIAN":
        return "Physical ODF fiber splicing and GPON signal telemetry management.";
      default:
        return "General administrative workspace views.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      setErrorMsg("First name and Last name are required.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const result = await updateProfile(firstName, lastName, phoneNumber);
    setSaving(false);

    if (result.success) {
      showNotification("Profile Synchronized", "Your personal staff record has been updated successfully.", "success");
    } else {
      setErrorMsg(result.message);
      showNotification("Sync Failed", result.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header banner with ambient background glow */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-5 px-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <User className="h-5.5 w-5.5 text-sky-500" />
            My Employee Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal contact details and view active security credentials assigned to your account.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security Access Summary */}
        <div className="lg:col-span-5 space-y-6">
          <Card borderAccent>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg">
                  {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    {user?.firstName} {user?.lastName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Staff Identity Reference
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-3">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-mono truncate">{user?.email}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{user?.phoneNumber || "No contact phone configured."}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Status: <strong className="text-emerald-500 uppercase">ACTIVE</strong></span>
                </div>
              </div>

              {/* Security Authorization Matrix Panel */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Security Authorization Matrix
                  </span>
                </div>
                
                <span className="inline-flex px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-950/50 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wide">
                  {user?.role}
                </span>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {getRoleDescription(user?.role || "VIEWER")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Details Form */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-sky-500" />
                Personal Profile Record
              </CardTitle>
              <CardDescription>
                Updates to these details will synchronize across all statutory reports and logs immediately.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" id="profile-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    id="profile-firstname"
                  />
                  <Input
                    label="Last Name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    id="profile-lastname"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Corporate Email Address"
                    type="email"
                    disabled
                    value={user?.email || ""}
                    description="Email address locks to your employee directory and cannot be changed."
                    id="profile-email"
                  />
                  <Input
                    label="Primary Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +254711223344"
                    description="Include country code (e.g., +254 for Kenya)"
                    id="profile-phone"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs px-6 py-2 shadow-md shadow-sky-500/10"
                    isLoading={saving}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    id="profile-submit-btn"
                  >
                    Synchronize Contact Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default UserProfilePage;
