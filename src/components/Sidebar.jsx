import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  UserPlus,
  UserCheck,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(true);
  const [openRecruitmentMenu, setOpenRecruitmentMenu] = useState(false);

  return (
    <div className="h-screen w-64 bg-[#F4F8FF] border-r border-gray-200 p-4 sticky top-0 overflow-y-auto">

      {/* Title */}
      <h1 className="text-xl font-bold text-[#0D3B66] mb-6">HRM Standard</h1>

      <nav className="space-y-2 text-[#1E2A3B]">

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname === "/dashboard" ? "bg-blue-100 font-semibold" : ""
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        {/* User Management */}
        <div>
          <button
            onClick={() => setOpenUserMenu(!openUserMenu)}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-blue-100"
          >
            <span className="flex items-center space-x-3">
              <Users size={20} />
              <span>User Management</span>
            </span>

            {openUserMenu ? <ChevronDown /> : <ChevronRight />}
          </button>

          {/* Submenu */}
          {openUserMenu && (
            <div className="ml-10 mt-2 space-y-2">
              <Link
                to="/departments"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/departments"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Departments
              </Link>

              <Link
                to="/roles"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/roles"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Roles
              </Link>

              <Link
                to="/users"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/users"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Users
              </Link>
            </div>
          )}
        </div>

        {/* TOP-LEVEL MENU: Organization Setup */}
        <Link
          to="/organization"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/organization")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <Building2 size={20} />
          <span>Organization Setup</span>
        </Link>

        {/* Recruitment & Onboarding */}
        <div>
          <button
            onClick={() => setOpenRecruitmentMenu(!openRecruitmentMenu)}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-blue-100"
          >
            <span className="flex items-center space-x-3">
              <UserPlus size={20} />
              <span>Recruitment & Onboarding</span>
            </span>
            {openRecruitmentMenu ? <ChevronDown /> : <ChevronRight />}
          </button>

          {openRecruitmentMenu && (
            <div className="ml-10 mt-2 space-y-2">
              <Link
                to="/recruitment-master"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/recruitment-master"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Master Dashboard
              </Link>

              <Link
                to="/job-requisition"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/job-requisition"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Job Requisition
              </Link>

              <Link
                to="/recruitment-setup"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/recruitment-setup"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Recruitment Setup
              </Link>

              <Link
                to="/ats"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/ats"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                ATS
              </Link>

              <Link
                to="/offers"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/offers"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Offers
              </Link>

              <Link
                to="/onboarding"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/onboarding"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Onboarding
              </Link>
            </div>
          )}
        </div>

        {/* EIS (Employee Information System) */}
        <Link
          to="/eis"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname === "/eis"
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <UserCheck size={20} />
          <span>EIS (Employee Information System)</span>
        </Link>

      </nav>
    </div>
  );
}
