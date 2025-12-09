import { useState, useEffect } from "react";
import api from "../../api";

export default function Shift() {
  const tenant_db = localStorage.getItem("tenant_db");

  // ---------------------- STATE ----------------------
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeShifts, setEmployeeShifts] = useState([]);

  const [showShiftList, setShowShiftList] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewMode, setViewMode] = useState("weekly"); 
  const [currentDate, setCurrentDate] = useState(new Date());

  // ---------------- SUCCESS POPUP STATE ----------------
  const [showSuccess, setShowSuccess] = useState(false);

  // ---------- HELPER: GET MONDAY ----------
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  // ---------- WEEK RANGE ----------
  const getFullWeek = (date) => {
    const monday = getMonday(date);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        display: d.getDate(),
      });
    }
    return week;
  };

  const businessWeek = getFullWeek(currentDate);

  // ---------- FETCH DATA ----------
  const fetchShifts = async () => {
    console.log('Fetching shifts...');
    try {
      const res = await api.get(`/shifts/${tenant_db}/list`);
      console.log('Shifts fetched:', res.data);
      setShifts(res.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    }
  };

  const fetchEmployees = async () => {
    console.log('Fetching employees...');
    try {
      const res = await api.get(`/employees/${tenant_db}/list`);
      console.log('Employees fetched:', res.data);
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchEmployeeShifts = async () => {
    console.log('Fetching employee shift mappings...');
    try {
      const res = await api.get(`/shifts/${tenant_db}/employee-mapping`);
      console.log('Employee shifts fetched:', res.data);
      setEmployeeShifts(res.data.mappings || []);
    } catch (err) {
      console.error('Error fetching employee shifts:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
    fetchEmployeeShifts();
  }, []);

  // ---------------------- SAVE SHIFT ----------------------
  const saveShift = async () => {
    if (!shiftName || !startTime || !endTime) {
      return alert("All fields required!");
    }

    console.log('Saving shift:', { name: shiftName, start_time: startTime, end_time: endTime });
    try {
      await api.post(`/shifts/${tenant_db}/create`, {
        name: shiftName,
        start_time: startTime,
        end_time: endTime,
      });
      console.log('Shift saved successfully');

      // Show success popup
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);

      setShiftName("");
      setStartTime("");
      setEndTime("");
      fetchShifts();
    } catch (err) {
      console.error('Error saving shift:', err);
      alert("Failed to save shift");
    }
  };

  // ---------------------- ASSIGN SHIFT ----------------------
  const assignShift = async () => {
    if (!selectedEmployee || !selectedShift || !dateFrom || !dateTo) {
      return alert("All fields required!");
    }

    console.log('Assigning shift:', { employee_id: selectedEmployee, shift_id: selectedShift, from_date: dateFrom, to_date: dateTo });
    try {
      await api.post(`/shifts/${tenant_db}/assign`, {
        employee_id: selectedEmployee,
        shift_id: selectedShift,
        from_date: dateFrom,
        to_date: dateTo,
      });
      console.log('Shift assigned successfully');

      setShowAssignModal(false);
      fetchEmployeeShifts();
    } catch (err) {
      console.error('Error assigning shift:', err);
      alert("Assignment Failed");
    }
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === "weekly" ? 7 : 1));
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === "weekly" ? 7 : 1));
    setCurrentDate(d);
  };

  // ---------------------- UI ----------------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ---------------- SUCCESS POPUP ---------------- */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
          <div className="bg-white px-8 py-4 rounded-xl shadow-lg border text-center">
            <p className="text-green-600 font-semibold text-lg">Shift Saved!</p>
          </div>
        </div>
      )}

      {/* ---------------- CREATE SHIFT ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Create Shift</h2>
            <p className="text-gray-500 text-sm">Setup shift timings for your employees.</p>
          </div>

          <button
            className="px-5 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 text-sm"
            onClick={() => setShowShiftList(true)}
          >
            View All Shifts
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 items-center">
          <input
            type="text"
            placeholder="Shift Name"
            className="border rounded-lg p-2 text-sm"
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
          />

          <input
            type="time"
            className="border rounded-lg p-2 text-sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <input
            type="time"
            className="border rounded-lg p-2 text-sm"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={saveShift}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- SHIFT LIST POPUP ---------------- */}
      {showShiftList && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Shifts</h3>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setShowShiftList(false)}
              >
                ✕
              </button>
            </div>

            {shifts.length === 0 ? (
              <p className="text-gray-500 text-sm">No shifts created yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="border rounded-lg px-4 py-3 text-sm flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-gray-500 text-xs">{s.start_time} – {s.end_time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- EMPLOYEE SHIFT MAPPING ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Employee Shift Mapping</h2>

          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
          >
            Assign Shift
          </button>
        </div>

        {/* ----------- DATE BAR ----------- */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-white shadow-sm">
            <button onClick={prevPeriod} className="text-blue-600">⟨</button>
            <span className="text-gray-700">
              {businessWeek[0].display} {businessWeek[0].label} – {businessWeek[6].display} {businessWeek[6].label}
            </span>
            <button onClick={nextPeriod} className="text-blue-600">⟩</button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("weekly")}
              className={`px-4 py-2 rounded-lg text-sm border ${
                viewMode === "weekly" ? "bg-blue-50 border-blue-500 text-blue-600" : ""
              }`}
            >
              Weekly
            </button>

            <button
              onClick={() => setViewMode("daily")}
              className={`px-4 py-2 rounded-lg text-sm border ${
                viewMode === "daily" ? "bg-blue-50 border-blue-500 text-blue-600" : ""
              }`}
            >
              Daily
            </button>
          </div>
        </div>

        {/* ---------------- WEEK GRID ---------------- */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="border p-3 text-left">Employee</th>

                {viewMode === "weekly" &&
                  businessWeek.map((d) => (
                    <th key={d.date} className="border p-3 text-center">
                      {d.label} {d.display}
                    </th>
                  ))}

                {viewMode === "daily" && (
                  <th className="border p-3 text-center">
                    {currentDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border">
                  <td className="p-3 border bg-gray-50 font-medium">{emp.name}</td>

                  {/* WEEK MODE */}
                  {viewMode === "weekly" &&
                    businessWeek.map((d) => {
                      const shift = employeeShifts.find(
                        (es) =>
                          es.employee_id === emp.id &&
                          d.date >= es.from_date &&
                          d.date <= es.to_date
                      );

                      return (
                        <td key={d.date} className="border p-2 text-center">
                          {shift ? (
                            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg">
                              {shift.shift_name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}

                  {/* DAILY MODE */}
                  {viewMode === "daily" &&
                    (() => {
                      const d = currentDate.toISOString().split("T")[0];
                      const shift = employeeShifts.find(
                        (es) =>
                          es.employee_id === emp.id &&
                          d >= es.from_date &&
                          d <= es.to_date
                      );

                      return (
                        <td className="border p-2 text-center">
                          {shift ? (
                            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg">
                              {shift.shift_name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- ASSIGN MODAL ---------------- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[450px] shadow-xl space-y-4">

            <h2 className="text-xl font-semibold">Assign Shift</h2>

            <select
              className="border p-3 rounded-xl w-full"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <select
              className="border p-3 rounded-xl w-full"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
            >
              <option value="">Select Shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex gap-4">
              <input
                type="date"
                className="border p-3 rounded-xl w-1/2"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="border p-3 rounded-xl w-1/2"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={assignShift}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Assign
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
