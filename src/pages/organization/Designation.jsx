import { useEffect, useState } from "react";
import api from "../../api";

export default function DesignationList() {
  const [roles, setRoles] = useState([]);
  const tenant_db = localStorage.getItem("tenant_db");

  const fetchRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      

      {/* CARD */}
      <div className="bg-white rounded-xl shadow p-6">

        {/* CARD TITLE (added this) */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Designation List
        </h3>

        <table className="min-w-full border rounded-lg">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border text-left">Role Name</th>
              <th className="p-3 border text-left">Description</th>
              <th className="p-3 border text-center">Permissions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((role, idx) => (
              <tr key={role.id} className="border text-sm">
                <td className="p-3 border text-center">{idx + 1}</td>
                <td className="p-3 border">{role.name}</td>
                <td className="p-3 border">{role.description || "—"}</td>
                <td className="p-3 border text-center">
                  {role.permissions ? role.permissions.length : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {roles.length === 0 && (
          <p className="text-center text-gray-500 py-6">No roles found.</p>
        )}
      </div>
    </div>
  );
}
