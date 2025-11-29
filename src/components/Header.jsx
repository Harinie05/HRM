import { useEffect, useState } from "react";
import { RotateCcw, RefreshCcw, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [time, setTime] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Get user info from localStorage
  const userEmail = localStorage.getItem("email") || "User";
  const userName = localStorage.getItem("user_name") || userEmail.split("@")[0];
  const userRole = localStorage.getItem("role_name") || "Employee";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#0D3B66] p-4 flex justify-between items-center text-white shadow-md">

      <h2 className="text-2xl font-bold">NUTRYAH HRM</h2>

      <div className="flex items-center space-x-6">

        {/* Time with dot */}
        <span className="text-lg bg-green-500 px-3 py-1 rounded-full text-white">
          ● {time}
        </span>

        {/* Sync Button */}
        <button className="bg-blue-600 px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <RotateCcw size={18} className="mr-2" /> Sync
        </button>

        {/* Refresh Button */}
        <button className="bg-blue-600 px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <RefreshCcw size={18} className="mr-2" /> Refresh
        </button>

        {/* Profile with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 hover:bg-blue-700 p-2 rounded-lg transition-colors"
          >
            <div className="bg-white text-[#0D3B66] rounded-full h-10 w-10 flex items-center justify-center font-bold">
              {userInitial}
            </div>
            <div className="text-left">
              <p className="font-semibold">{userName}</p>
              <p className="text-xs text-gray-300">{userRole}</p>
            </div>
            <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              <div className="p-3 border-b">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
                <p className="text-xs text-blue-600">{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}