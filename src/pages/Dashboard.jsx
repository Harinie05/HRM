import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../api";

export default function Dashboard() {
  const [holidays, setHolidays] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalRoles: 0
  });

  // ========================= FETCH HOLIDAYS =========================
  const fetchHolidays = async () => {
    try {
      const res = await api.get("/holidays/list");
      setHolidays(res.data || []);
    } catch {
      console.error("Failed to load holidays");
    }
  };

  // ========================= FETCH DASHBOARD DATA =========================
  const fetchDashboardData = async () => {
    try {
      const tenant_db = 'nutryah'; // Default tenant database name
      
      // Fetch employees from users endpoint
      let totalEmployees = 0;
      try {
        const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`);
        totalEmployees = (usersRes.data?.users || []).length;
      } catch {
        console.log('No employee data found');
      }
      
      // Fetch departments
      let totalDepartments = 0;
      try {
        const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`);
        totalDepartments = (deptRes.data?.departments || []).length;
      } catch {
        console.log('No department data found');
      }
      
      // Fetch roles
      let totalRoles = 0;
      try {
        const rolesRes = await api.get(`/hospitals/roles/${tenant_db}/list`);
        totalRoles = (rolesRes.data?.roles || []).length;
      } catch {
        console.log('No roles data found');
      }
      
      console.log('Dashboard data:', { totalEmployees, totalDepartments, totalRoles });
      
      setDashboardData({
        totalEmployees,
        totalDepartments,
        totalRoles
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchDashboardData();
  }, []);

  // Calendar Logic
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    if (month === 0) setYear((y) => y - 1);
  };

  const nextMonth = () => {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    if (month === 11) setYear((y) => y + 1);
  };

  const getHolidayForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return holidays.find((h) => h.date === dateStr);
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-[#F7F9FB] min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-[#0D3B66] mb-6">
            HRM Dashboard
          </h1>

          {/* ================== TOP CARDS ================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">TOTAL EMPLOYEES</p>
              <p className="text-3xl font-bold">{dashboardData.totalEmployees}</p>
            </div>
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">TOTAL DEPARTMENTS</p>
              <p className="text-3xl font-bold">{dashboardData.totalDepartments}</p>
            </div>
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">TOTAL ROLES</p>
              <p className="text-3xl font-bold">{dashboardData.totalRoles}</p>
            </div>
          </div>

          {/* ================= HOLIDAY BUTTON ================= */}
          <button
            onClick={() => setShowCalendar((v) => !v)}
            className="bg-[#0D3B66] text-white px-5 py-2 rounded-xl shadow hover:bg-[#0b3154]"
          >
            Holiday Gallery
          </button>

          {/* ================= PROFESSIONAL CALENDAR ================= */}
          {showCalendar && (
            <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border">
              {/* Calendar header */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={prevMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ‹
                </button>
                <h2 className="text-xl font-semibold">
                  {new Date(year, month).toLocaleString("en-US", {
                    month: "long",
                  })}{" "}
                  {year}
                </h2>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 text-center font-medium text-gray-600 mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={i}></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const holiday = getHolidayForDate(day);

                  return (
                    <div
                      key={day}
                      className={`p-3 h-20 border rounded-lg relative ${
                        holiday ? "bg-blue-50 border-blue-300" : "bg-white"
                      } hover:shadow`}
                    >
                      <span className="font-semibold">{day}</span>
                      {holiday && (
                        <>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-xs text-blue-700 mt-1 font-medium truncate">
                            {holiday.name}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
