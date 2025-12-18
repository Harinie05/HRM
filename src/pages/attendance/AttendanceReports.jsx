import { useState } from "react";
import api from "../../api";

export default function AttendanceReports() {
  const [report, setReport] = useState([]);

  const loadDaily = async () => {
    const res = await api.get("/api/attendance/reports/daily");
    setReport(res.data);
  };

  const loadMonthly = async () => {
    const res = await api.get("/api/attendance/reports/monthly");
    setReport(res.data);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Attendance → Attendance Reports
      </h2>

      <div className="flex gap-2 mb-4">
        <button onClick={loadDaily} className="btn-primary">
          Daily Report
        </button>
        <button onClick={loadMonthly} className="btn-secondary">
          Monthly Report
        </button>
      </div>

      <pre className="bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(report, null, 2)}
      </pre>
    </div>
  );
}
