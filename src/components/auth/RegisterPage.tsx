import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { Cpu, Eye, EyeOff, ShieldAlert, ArrowLeft, UserPlus } from "lucide-react";

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useAuth();
  const { showNotification } = useNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "VIEWER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rolesOptions = [
    { value: "SUPER_ADMIN", label: "Super Admin (Root access)" },
    { value: "MANAGING_DIRECTOR", label: "Managing Director" },
    { value: "ACCOUNTANT", label: "Accountant (Finance & VAT)" },
    { value: "HR_MANAGER", label: "HR Manager (Staff & Payroll)" },
    { value: "SALES", label: "Sales Executive" },
    { value: "PROCUREMENT", label: "Procurement Officer" },
    { value: "STORE_MANAGER", label: "Store & Inventory Manager" },
    { value: "TECHNICIAN", label: "GPON Fiber Technician" },
    { value: "CUSTOMER_SUPPORT", label: "Customer Support (SLA)" },
    { value: "VIEWER", label: "Viewer (Read-only auditor)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      showNotification(
        "Staff Registered",
        `Welcome ${formData.firstName}! Account successfully provisioned with ${formData.role} credentials.`,
        "success"
      );
    } else {
      setErrorMsg(result.message);
      showNotification("Registration Refused", result.message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        
        {/* Navigation back trigger */}
        <button
          onClick={() => onNavigate("login")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer transition bg-transparent border-none p-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portal authentication
        </button>

        {/* Core Card */}
        <Card borderAccent className="shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-sky-500" />
              Staff Account Registration
            </CardTitle>
            <CardDescription>
              Deploy a new employee profile with role-based access tokens.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. Pamela"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  id="reg-firstname"
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Masila"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  id="reg-lastname"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Corporate Email Address"
                  type="email"
                  required
                  placeholder="e.g. pmasila82@celcomnetworks.co.ke"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  id="reg-email"
                />
                <Input
                  label="Contact Phone Number"
                  placeholder="e.g. +254700000000"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  id="reg-phone"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Access Password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    id="reg-password"
                    description="Cryptographically hashed server-side"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-9 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Select
                  label="Assigned System Role"
                  options={rolesOptions}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  id="reg-role"
                  description="Defines your access capabilities"
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full text-xs font-bold uppercase tracking-wider py-2.5 mt-2 shadow-lg shadow-sky-500/10"
                isLoading={loading}
                id="reg-submit-btn"
              >
                Provision Account Credentials
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <div className="text-xs text-slate-500">
              Already have an employee account?{" "}
              <button
                onClick={() => onNavigate("login")}
                className="font-bold text-sky-600 hover:text-sky-500 hover:underline cursor-pointer transition bg-transparent border-none p-0"
              >
                Authenticate Here
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
export default RegisterPage;
