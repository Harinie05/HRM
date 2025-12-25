import { useEffect, useState } from "react";
import {
  RotateCcw,
  RefreshCcw,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Header({ isSidebarCollapsed }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔹 Dynamic hospital info
  const hospitalName =
    localStorage.getItem("hospital_name") || "Your Hospital Name";
  const hospitalTagline =
    localStorage.getItem("hospital_tagline") ||
    "Smart • Secure • NABH-Standard";

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
      className="fixed top-0 left-0 right-0 z-30 h-16
      bg-[#3B5BDB] text-white
      flex items-center justify-between
      shadow-md transition-all duration-300"
      style={{ 
        paddingLeft: isSidebarCollapsed ? "88px" : "280px",
        paddingRight: "24px"
      }}
    >
      {/* 🔵 Left: Hospital name */}
      <div className="leading-tight">
        <h1 className="text-lg font-semibold tracking-wide">
          {hospitalName}
        </h1>
        <p className="text-sm text-blue-200 font-medium">
          {hospitalTagline}
        </p>
      </div>

      {/* 🔵 Right controls */}
      <div className="flex items-center gap-3">

        {/* Date + Time */}
        <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm">
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
          <span>{formattedDate}</span>
          <span className="opacity-60">•</span>
          <span>{formattedTime}</span>
        </div>

        {/* Sync */}
        <button
          onClick={handleSync}
          className="flex items-center gap-2
          bg-white/10 hover:bg-white/20
          px-4 py-2 rounded-full text-sm transition"
        >
          <RotateCcw size={16} />
          <span className="hidden md:inline">Sync</span>
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2
          bg-white/10 hover:bg-white/20
          px-4 py-2 rounded-full text-sm transition"
        >
          <RefreshCcw size={16} />
          <span className="hidden md:inline">Refresh</span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3
            bg-white/10 hover:bg-white/20
            px-3 py-1.5 rounded-full transition"
          >
            <div
              className="h-9 w-9 rounded-full bg-blue-200
              text-[#3B5BDB] flex items-center justify-center
              font-bold text-sm"
            >
              {userInitial}
            </div>

            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold leading-none">
                {userName}
              </p>
              <p className="text-xs text-blue-200">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-56
              bg-white text-gray-800
              rounded-xl shadow-lg overflow-hidden"
            >
              <div className="px-4 py-3 border-b">
                <p className="font-semibold text-sm">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
                <p className="text-xs text-blue-600">{userRole}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2
                px-4 py-2 text-sm text-red-600
                hover:bg-red-50 transition"
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
