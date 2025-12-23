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
  Clock,
  DollarSign,
  Target,
  GraduationCap,
  Shield,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(true);
  const [openRecruitmentMenu, setOpenRecruitmentMenu] = useState(false);
  const [openAttendanceMenu, setOpenAttendanceMenu] = useState(false);

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

        {/* Attendance & Biometric */}
        <div>
          <button
            onClick={() => setOpenAttendanceMenu(!openAttendanceMenu)}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-blue-100"
          >
            <span className="flex items-center space-x-3">
              <Clock size={20} />
              <span>Attendance & Biometric</span>
            </span>
            {openAttendanceMenu ? <ChevronDown /> : <ChevronRight />}
          </button>

          {openAttendanceMenu && (
            <div className="ml-10 mt-2 space-y-2">
              <Link
                to="/shift-roster"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/shift-roster"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Shift & Roster
              </Link>

              <Link
                to="/attendance/logs"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/attendance/logs"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
                Attendance Capture & Logs
              </Link>

              <Link
                to="/attendance/rules"
                className={`block hover:text-blue-700 ${
                  location.pathname === "/attendance/rules"
                    ? "font-bold text-blue-700"
                    : ""
                }`}
              >
              Attendance Rules, Policy & Locations
              </Link>

            </div>
          )}
        </div>

        {/* Leave Management */}
        <Link
          to="/leave"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/leave")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <Clock size={20} />
          <span>Leave Management</span>
        </Link>

        {/* Payroll Management */}
        <Link
          to="/payroll"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/payroll")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <DollarSign size={20} />
          <span>Payroll Management</span>
        </Link>

        {/* HR Operations & Workforce Management */}
        <Link
          to="/hr"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/hr")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <Users size={20} />
          <span>HR Operations & Workforce Management</span>
        </Link>

        {/* Performance Management (PMS) */}
        <Link
          to="/pms"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/pms")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <Target size={20} />
          <span>Performance Management (PMS)</span>
        </Link>

        {/* Training & Development */}
        <Link
          to="/training"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/training")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <GraduationCap size={20} />
          <span>Training & Development</span>
        </Link>

        {/* Compliance Module */}
        <Link
          to="/compliance"
          className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 ${
            location.pathname.startsWith("/compliance")
              ? "bg-blue-100 font-semibold text-blue-700"
              : ""
          }`}
        >
          <Shield size={20} />
          <span>Compliance Module</span>
        </Link>

      </nav>
    </div>
  );
}
