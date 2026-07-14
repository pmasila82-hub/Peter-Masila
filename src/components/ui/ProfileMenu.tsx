import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, Shield, ChevronDown } from "lucide-react";

interface ProfileMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export function ProfileMenu({ user, onLogout, onProfileClick }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Profile Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer select-none text-left"
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md">
          {user.name.charAt(0)}
        </div>
        <div className="hidden sm:flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
            {user.name}
          </span>
          <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase leading-none">
            {user.role}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1">
          {/* User brief header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">{user.email}</p>
          </div>

          {/* Action List items */}
          <div className="p-1 flex flex-col gap-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onProfileClick) onProfileClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-lg text-left cursor-pointer transition"
            >
              <User className="h-4 w-4 text-slate-400" />
              My Employee Profile
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-lg text-left cursor-pointer transition"
            >
              <Shield className="h-4 w-4 text-slate-400" />
              Security Permissions
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-lg text-left cursor-pointer transition"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              User Settings
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {/* Logout Action */}
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-left cursor-pointer transition font-bold"
            >
              <LogOut className="h-4 w-4" />
              Log out Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
