import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, BookOpen, Users, ClipboardList, GraduationCap,
  FileText, Calendar, Menu as MenuIcon, X, Moon, Sun, ChevronDown, LogOut, User
} from "lucide-react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { BASE_URL, fetchWithToken } from "../api";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/classrooms", icon: BookOpen, label: "Classrooms" },
  { to: "/students", icon: Users, label: "Students" },
  { to: "/activities", icon: ClipboardList, label: "Activities" },
  { to: "/grades", icon: GraduationCap, label: "Grades" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/periods", icon: Calendar, label: "Periods" },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className="block">
      {({ isActive }) => (
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Icon size={20} />
          <span>{label}</span>
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
      )}
    </NavLink>
  );
}

export default function Layout({ children, periodSelector }) {
  const { dark, toggle } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [profileFocus, setProfileFocus] = useState({ x: 50, y: 50, zoom: 1 });

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetchWithToken("teachers/profile", token);
        if (res.ok) {
          const data = await res.json();
          if (data.profile_image_url) {
            const fullUrl = data.profile_image_url.startsWith("http")
              ? data.profile_image_url
              : `${BASE_URL}${data.profile_image_url}`;
            setProfileImageUrl(fullUrl);
          }
        }
      } catch {}
    })();
  }, [getToken]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("profileFocus");
      if (saved) setProfileFocus(JSON.parse(saved));
    } catch {}
  }, []);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-brand-50/50 dark:from-brand-950/50 to-transparent">
        <h1 className="text-xl font-extrabold text-transparent bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-center tracking-tight">
          Eficient Class
        </h1>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-0.5">
          Aula Eficiente
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pb-2">
          Main Menu
        </p>
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
          Period
        </p>
        {periodSelector}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-500 dark:text-gray-400"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-brand-600" />}
          <span className="text-xs">{dark ? "Light" : "Dark"}</span>
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profileImageUrl || user?.profileImageUrl ? (
                <div
                  className="w-full h-full"
                  style={{
                    transform: `scale(${profileFocus.zoom || 1})`,
                    transformOrigin: `${profileFocus.x}% ${profileFocus.y}%`,
                  }}
                >
                  <img
                    src={profileImageUrl || user?.profileImageUrl}
                    alt=""
                    className="w-full h-full pointer-events-none"
                    style={{ objectFit: "cover" }}
                    onError={(e) => { e.target.style.display = "none"; e.target.parentElement.style.display = "none"; }}
                  />
                </div>
              ) : (
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {user?.firstName?.[0] || user?.username?.[0] || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {user?.firstName || user?.username || "User"}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => { navigate("/profile"); setUserMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.aside
            initial={false}
            animate={{
              x: 0,
              width: window.innerWidth < 1024 ? (sidebarOpen ? 280 : 0) : 280,
            }}
            className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden ${
              window.innerWidth < 1024 ? (sidebarOpen ? "" : "hidden") : ""
            }`}
            style={{ width: window.innerWidth < 1024 && !sidebarOpen ? 0 : 280 }}
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 lg:hidden flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MenuIcon size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text">
            EC
          </h1>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Dark mode toggle floating */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-110 active:scale-95"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-brand-600" />}
      </button>
    </div>
  );
}
