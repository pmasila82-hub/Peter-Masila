import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../ui/Notifications";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { ShieldAlert, ArrowLeft, KeyRound, MailCheck, ClipboardCopy } from "lucide-react";

interface ForgotPasswordPageProps {
  onNavigate: (page: string, resetToken?: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { forgotPassword } = useAuth();
  const { showNotification } = useNotifications();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sandboxToken, setSandboxToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please provide your registered corporate email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSandboxToken(null);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccessMsg("If this account exists in our registers, a secure bypass token has been logged.");
      showNotification("Recovery Request Issued", "Password reset token generated successfully.", "success");
      
      if (result.resetToken) {
        setSandboxToken(result.resetToken);
      }
    } else {
      setErrorMsg(result.message);
      showNotification("Bypass Failed", result.message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background radial overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Nav trigger */}
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
              Reset Account Password
            </CardTitle>
            <CardDescription>
              We will generate a cryptographic access bypass token to authorize your override.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                <MailCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="font-bold">Reset Token Issued</p>
                  <p className="mt-0.5 font-medium leading-relaxed">{successMsg}</p>
                </div>
              </div>
            )}

            {!successMsg ? (
              <form onSubmit={handleSubmit} className="space-y-4" id="forgot-password-form">
                <Input
                  label="Registered Corporate Email"
                  type="email"
                  required
                  placeholder="e.g. employee@celcomnetworks.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="forgot-email"
                />

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full text-xs font-bold uppercase tracking-wider py-2.5 mt-2 shadow-lg shadow-sky-500/10"
                  isLoading={loading}
                  id="forgot-submit-btn"
                >
                  Generate Security Reset Token
                </Button>
              </form>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Sandbox Assist Display */}
                {sandboxToken ? (
                  <div className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 block">
                      Sandbox Override Console
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Since this is our local sandbox workspace environment, we captured the cryptographic token right here for you:
                    </p>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
                      <code className="text-xs font-mono select-all truncate text-sky-500 font-bold flex-1">
                        {sandboxToken}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sandboxToken);
                          showNotification("Token Copied", "Reset token copied to clipboard.", "success");
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-lg cursor-pointer transition shrink-0"
                        title="Copy to clipboard"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full font-bold text-[11px] py-2"
                      onClick={() => onNavigate("reset-password", sandboxToken)}
                    >
                      Bypass Directly to Reset Form
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    Check your command line console output inside the Dev Environment to see the logged reset token bypass, or contact your System Administrator.
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setSuccessMsg(null);
                    setSandboxToken(null);
                  }}
                >
                  Submit Another Email Address
                </Button>
              </div>
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
export default ForgotPasswordPage;
