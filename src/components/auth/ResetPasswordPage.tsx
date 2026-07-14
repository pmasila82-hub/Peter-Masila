import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { ShieldAlert, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
  initialToken?: string;
}

export function ResetPasswordPage({ onNavigate, initialToken = "" }: ResetPasswordPageProps) {
  const { resetPassword } = useAuth();
  const { showNotification } = useNotifications();

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password || !confirmPassword) {
      setErrorMsg("Please provide both the security token and your new password.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Security passwords do not match. Re-check spelling.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await resetPassword(password, token);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      showNotification("Credentials Overridden", "Password updated successfully in database directories.", "success");
    } else {
      setErrorMsg(result.message);
      showNotification("Reset Rejected", result.message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => onNavigate("login")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer transition bg-transparent border-none p-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portal authentication
        </button>

        {/* Card */}
        <Card borderAccent className="shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-sky-500" />
              Set New Account Password
            </CardTitle>
            <CardDescription>
              Verify your security reset token to complete the password override.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="inline-flex bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-3 rounded-full mb-1">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Credentials Updated Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your new credentials have been locked. Please authenticate using your corporate email and new password.
                </p>
                <Button
                  variant="primary"
                  className="w-full text-xs font-bold py-2.5"
                  onClick={() => onNavigate("login")}
                >
                  Authenticate Session
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="reset-password-form">
                <Input
                  label="Reset Token Code"
                  required
                  placeholder="Paste your hex token code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  id="reset-token-input"
                  description="Issued after initiating forgot password"
                />

                <div className="relative">
                  <Input
                    label="New Security Password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="reset-password-input"
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

                <Input
                  label="Confirm New Security Password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  id="reset-confirm-input"
                />

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full text-xs font-bold uppercase tracking-wider py-2.5 mt-2 shadow-lg shadow-sky-500/10"
                  isLoading={loading}
                  id="reset-submit-btn"
                >
                  Write New Access Credentials
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <button
              onClick={() => onNavigate("login")}
              className="text-xs font-bold text-sky-600 hover:text-sky-500 hover:underline cursor-pointer transition bg-transparent border-none p-0"
            >
              Back to Authentication Hub
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
export default ResetPasswordPage;
