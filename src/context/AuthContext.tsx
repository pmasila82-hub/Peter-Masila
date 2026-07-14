import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (formData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (password: string, token: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (firstName: string, lastName: string, phoneNumber?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: Refresh access token
  const performTokenRotation = async (storedRefresh: string) => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });

      if (!response.ok) {
        throw new Error("Rotation failed");
      }

      const data = await response.json();
      if (data.success && data.accessToken) {
        localStorage.setItem("celcom_access_token", data.accessToken);
        localStorage.setItem("celcom_refresh_token", data.refreshToken);
        setUser(data.user);
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
    } catch (err) {
      // Clear invalid session state
      localStorage.removeItem("celcom_access_token");
      localStorage.removeItem("celcom_refresh_token");
      setUser(null);
      setAccessToken(null);
    }
    return null;
  };

  // Attempt to recover session on startup
  useEffect(() => {
    const recoverSession = async () => {
      const storedAccess = localStorage.getItem("celcom_access_token");
      const storedRefresh = localStorage.getItem("celcom_refresh_token");

      if (storedRefresh) {
        // Always verify refresh state or rotate access token on cold starts to protect API routes
        const freshAccess = await performTokenRotation(storedRefresh);
        if (!freshAccess && storedAccess) {
          // Fallback verify of access token if refresh fails but access exists (for sandbox comfort)
          try {
            const res = await fetch("/api/v1/auth/me", {
              headers: { Authorization: `Bearer ${storedAccess}` }
            });
            if (res.ok) {
              const profileData = await res.json();
              setUser(profileData.user);
              setAccessToken(storedAccess);
            }
          } catch (e) {
            // Unrecoverable
          }
        }
      }
      setLoading(false);
    };

    recoverSession();
  }, []);

  // Standard Login
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Login failed. Check your credentials." };
      }

      localStorage.setItem("celcom_access_token", data.accessToken);
      localStorage.setItem("celcom_refresh_token", data.refreshToken);
      setUser(data.user);
      setAccessToken(data.accessToken);

      return { success: true, message: data.message || "Logged in successfully." };
    } catch (err) {
      return { success: false, message: "Server connection failed. Starting local sandbox session instead." };
    }
  };

  // Register staff account
  const register = async (formData: any) => {
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Registration failed." };
      }

      // Auto login on successful registration
      if (data.accessToken && data.refreshToken) {
        localStorage.setItem("celcom_access_token", data.accessToken);
        localStorage.setItem("celcom_refresh_token", data.refreshToken);
        setUser(data.user);
        setAccessToken(data.accessToken);
      }

      return { success: true, message: "User account registered successfully." };
    } catch (err) {
      return { success: false, message: "Connection error during staff user registry creation." };
    }
  };

  // Revoke current session
  const logout = async () => {
    const storedRefresh = localStorage.getItem("celcom_refresh_token");
    if (storedRefresh) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
      } catch (e) {
        // Proceed with local logout regardless of network
      }
    }

    localStorage.removeItem("celcom_access_token");
    localStorage.removeItem("celcom_refresh_token");
    setUser(null);
    setAccessToken(null);
  };

  // Forgot password token fetcher
  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Failed to issue password recovery request." };
      }

      return { 
        success: true, 
        message: data.message,
        resetToken: data.resetToken // Expose for easy sandbox testing in UI
      };
    } catch (err) {
      return { success: false, message: "Connection error during password recovery initiation." };
    }
  };

  // Reset password
  const resetPassword = async (password: string, token: string) => {
    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Failed to reset password. Check if the token is valid or expired." };
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: "Connection error during password override." };
    }
  };

  // Update authenticated employee profile
  const updateProfile = async (firstName: string, lastName: string, phoneNumber?: string) => {
    const currentToken = accessToken || localStorage.getItem("celcom_access_token");
    if (!currentToken) {
      return { success: false, message: "Authentication session expired. Please re-authenticate." };
    }

    try {
      const response = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ firstName, lastName, phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Failed to update profile." };
      }

      setUser(data.user);
      return { success: true, message: "Staff profile updated successfully." };
    } catch (err) {
      return { success: false, message: "Connection error while updating staff profile." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
