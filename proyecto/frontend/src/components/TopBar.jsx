import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { Sun, Moon, User, LogOut, Menu } from "lucide-react";
import * as DropdownMenu from "./ui/DropdownMenu";
import { BASE_URL, fetchWithToken } from "../api";

export default function TopBar({ periodSelector, onMenuToggle }) {
  const { dark, toggle } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [profileImageUrl, setProfileImageUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetchWithToken("teachers/profile", token);
        if (res.ok) {
          const data = await res.json();
          if (data.profile_image_url) {
            setProfileImageUrl(
              data.profile_image_url.startsWith("http")
                ? data.profile_image_url
                : `${BASE_URL}${data.profile_image_url}`
            );
          }
        }
      } catch {}
    })();
  }, [getToken]);

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        >
          <Menu size={20} />
        </button>
        <div className="w-48">{periodSelector}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <button className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profileImageUrl || user?.profileImageUrl ? (
                  <img
                    src={profileImageUrl || user?.profileImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {user?.firstName?.[0] || user?.username?.[0] || "U"}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                {user?.firstName || user?.username || "User"}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={() => navigate("/profile")}>
              <User size={15} /> Profile
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onClick={() => signOut()} danger>
              <LogOut size={15} /> Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
