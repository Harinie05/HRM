import { useEffect, useState } from "react";
import {
  RotateCcw,
  RefreshCcw,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Header({ isSidebarCollapsed, onMobileMenuToggle }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔹 Dynamic hospital info
  const hospitalName = localStorage.getItem("hospital_name") || "Your Hospital Name";
  const hospitalTagline = localStorage.getItem("hospital_tagline") || "Smart • Secure • NABH-Standard";

  // 🔹 User info
  const userEmail = localStorage.getItem("email") || "user@mail.com";
  const userName =
    localStorage.getItem("user_name") || userEmail.split("@")[0];
  const userRole = localStorage.getItem("role_name") || "Employee";
  const userInitial = userName.charAt(0).toUpperCase();

  // 🔹 Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // 🔄 Sync → reload ONLY current page data
  const handleSync = () => {
    window.dispatchEvent(new Event("page-sync"));
  };

  // 🔁 Refresh → reload entire app
  const handleRefresh = () => {
    window.location.reload();
  };

  // 🔓 Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-14 sm:h-16
      text-white
      flex items-center justify-between
      shadow-md transition-all duration-300 px-3 sm:px-6"
      style={{ 
        backgroundColor: 'var(--header-bg, #3B5BDB)',
        paddingLeft: window.innerWidth >= 1024 ? (isSidebarCollapsed ? "88px" : "280px") : "16px",
        paddingRight: window.innerWidth >= 768 ? "24px" : "16px"
      }}
    >
      {/* 🔵 Left: Hospital name */}
      <div className="leading-tight min-w-0 flex-1">
        <h1 className="text-sm sm:text-lg font-semibold tracking-wide truncate">
          {hospitalName}
        </h1>
        <p className="text-xs sm:text-sm text-blue-200 font-medium hidden sm:block">
          {hospitalTagline}
        </p>
      </div>

      {/* 🔵 Right controls */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center
          bg-white/10 hover:bg-white/20
          w-10 h-10 rounded-full transition min-h-[44px]"
        >
          <Menu size={18} />
        </button>

        {/* Date + Time */}
        <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm">
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
          <span>{formattedDate}</span>
          <span className="opacity-60">•</span>
          <span>{formattedTime}</span>
        </div>

        {/* Sync */}
        <button
          onClick={handleSync}
          className="flex items-center gap-1 sm:gap-2
          bg-white/10 hover:bg-white/20
          px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition min-h-[44px]"
        >
          <RotateCcw size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Sync</span>
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 sm:gap-2
          bg-white/10 hover:bg-white/20
          px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition min-h-[44px]"
        >
          <RefreshCcw size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Refresh</span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 sm:gap-3
            bg-white/10 hover:bg-white/20
            px-2 sm:px-3 py-1.5 rounded-full transition min-h-[44px]"
          >
            <div
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-blue-200
              text-[#3B5BDB] flex items-center justify-center
              font-bold text-xs sm:text-sm flex-shrink-0"
            >
              {userInitial}
            </div>

            <div className="text-left hidden lg:block min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {userName}
              </p>
              <p className="text-xs text-blue-200 truncate">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`transition-transform sm:w-4 sm:h-4 ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-48 sm:w-56
              bg-white text-primary
              rounded-xl shadow-lg overflow-hidden z-50"
            >
              <div className="px-3 sm:px-4 py-3 border-b">
                <p className="font-semibold text-sm truncate text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                <p className="text-xs text-blue-600">{userRole}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2
                px-3 sm:px-4 py-2 text-sm text-red-600
                hover:bg-red-50 transition min-h-[44px]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
