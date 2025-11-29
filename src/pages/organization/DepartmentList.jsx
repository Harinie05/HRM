import { useEffect, useState } from "react";
import api from "../../api";


export default function OrgDepartments() {
  const [departments, setDepartments] = useState([]);
  const tenant_db = localStorage.getItem("tenant_db");

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.log("Error loading departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Department List
      </h2>

      

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border text-left">Name</th>
              <th className="p-3 border text-left">Description</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((dept, index) => (
              <tr key={dept.id} className="border text-sm">
                <td className="p-3 border text-center">{index + 1}</td>
                <td className="p-3 border">{dept.name}</td>
                <td className="p-3 border">
                  {dept.description || "—"}
                </td>
              </tr>
            ))}

            {departments.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-gray-500 text-sm"
                >
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
