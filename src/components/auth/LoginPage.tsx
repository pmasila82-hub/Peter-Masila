import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { Cpu, Eye, EyeOff, ShieldAlert, KeyRound } from "lucide-react";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const { showNotification } = useNotifications();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all required credentials.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showNotification("Welcome Back", "Security access granted. Initiating ERP sync...", "success");
    } else {
      setErrorMsg(result.message);
      showNotification("Access Denied", result.message, "error");
    }
  };

  const loadDemoCredentials = (role: "admin" | "accountant" | "technician") => {
    if (role === "admin") {
      setEmail("admin@celcomnetworks.co.ke");
      setPassword("AdminSecurePassword2026!");
    } else if (role === "accountant") {
      setEmail("accounting@celcomnetworks.co.ke");
      setPassword("Accountant2026!");
    } else {
      setEmail("noc@celcomnetworks.co.ke");
      setPassword("Technician2026!");
    }
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Dynamic Background Glow Vectors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Celcom Networks Branded Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-sky-500 dark:bg-sky-600 text-white p-3 rounded-2xl shadow-xl shadow-sky-500/20 mb-2">
            <Cpu className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans text-slate-900 dark:text-slate-100 uppercase">
            Celcom Networks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise Resource Planning Core Portal
          </p>
        </div>

        {/* Security Core Login Card */}
        <Card borderAccent className="shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-sky-500" />
              Staff Authentication
            </CardTitle>
            <CardDescription>
              Provide your corporate credentials to gain access.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
              <Input
                label="Corporate Email Address"
                type="email"
                placeholder="e.g. employee@celcomnetworks.co.ke"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                id="login-email"
              />

              <div className="relative">
                <Input
                  label="Security Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  id="login-password"
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

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate("forgot-password")}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-500 hover:underline cursor-pointer transition bg-transparent border-none p-0"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full text-xs font-bold uppercase tracking-wider py-2.5 mt-2 shadow-lg shadow-sky-500/10"
                isLoading={loading}
                id="login-submit-btn"
              >
                Establish Access Node
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <div className="text-xs text-slate-500">
              New to the operations department?{" "}
              <button
                onClick={() => onNavigate("register")}
                className="font-bold text-sky-600 hover:text-sky-500 hover:underline cursor-pointer transition bg-transparent border-none p-0"
              >
                Register Staff Account
              </button>
            </div>

            {/* Quick Demo Assist Sandbox Credentials */}
            <div className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 p-3 rounded-xl space-y-2 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                Sandbox Credentials Assist
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => loadDemoCredentials("admin")}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Super Admin
                </button>
                <button
                  onClick={() => loadDemoCredentials("accountant")}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Accountant
                </button>
                <button
                  onClick={() => loadDemoCredentials("technician")}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Technician
                </button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Static Regulatory Disclaimer */}
        <p className="text-[10px] text-center text-slate-400 max-w-xs mx-auto">
          Secured by corporate-grade cryptographic PBKDF2 layers. Authorized staff logging under Communications Authority of Kenya guidelines only.
        </p>
      </div>
    </div>
  );
}
