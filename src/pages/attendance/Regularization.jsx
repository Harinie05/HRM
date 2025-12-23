import { useEffect, useState } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Regularization() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const res = await api.get("/api/attendance/regularizations/");
    setRequests(res.data);
  };

  const approve = async (id) => {
    await api.patch(`/api/attendance/regularizations/${id}/approve`);
    loadRequests();
  };

  const reject = async (id) => {
    await api.patch(`/api/attendance/regularizations/${id}/reject`);
    loadRequests();
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Attendance → Regularization Requests
          </h2>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Issue</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td>{r.employee_id}</td>
                    <td>{r.punch_date}</td>
                    <td>{r.issue_type}</td>
                    <td>{r.reason}</td>
                    <td>{r.status}</td>
                    <td className="flex gap-2">
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => approve(r.id)}
                            className="btn-success"
                          >
                            ✔
                          </button>
                          <button
                            onClick={() => reject(r.id)}
                            className="btn-danger"
                          >
                            ✖
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
