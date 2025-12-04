import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Departments() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- EDIT STATE ---
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const tenant_db = localStorage.getItem("tenant_db");

  // ----------------------------
  // PERMISSION HANDLING (ADMIN = FULL ACCESS)
  // ----------------------------
  const canView = isAdmin() || hasPermission("view_departments");
  const canAdd = isAdmin() || hasPermission("add_department");
  const canEdit = isAdmin() || hasPermission("edit_department");
  const canDelete = isAdmin() || hasPermission("delete_department");

  // If user does NOT have view permission → block entire page
  if (!canView) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6 text-center text-red-600 font-semibold text-xl">
            ❌ You do not have permission to view Departments.
          </div>
        </div>
      </div>
    );
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);

      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("List error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    
    if (!canAdd) return alert("You do not have permission to add departments");

    if (!name.trim()) {
      alert("Department name required");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/hospitals/departments/${tenant_db}/create`, {
        name,
        description: desc,
      });

      setName("");
      setDesc("");
      fetchDepartments();
      alert("Department created!");
    } catch (err) {
      alert("Create failed");
      console.error(err);
    }

    setLoading(false);
  };

  const deleteDepartment = async (id) => {
    if (!canDelete)
      return alert("You do not have permission to delete departments");

    if (!window.confirm("Delete this department?")) return;

    try {
      await api.delete(`/hospitals/departments/${tenant_db}/delete/${id}`);
      fetchDepartments();
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">Admin · Departments</div>

          <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                HR & Administrative Departments
              </h1>
              <p className="text-gray-500 mt-1">
                Configure HR, Finance, IT, Operations and other departments.
              </p>
            </div>

            <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                DEPARTMENTS
              </p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {departments.length}
              </p>
              <p className="text-[10px] text-gray-400">
                Mapped across HR, Finance, IT, Operations, etc.
              </p>
            </div>
          </div>

          {/* ================= CREATE SECTION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CREATE CARD (ONLY IF ADD PERMISSION) */}
            {canAdd && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Create department
                </h2>

                <p className="text-gray-500 text-sm mb-4">
                  Add or update organizational departments.
                </p>

                <input
                  type="text"
                  placeholder="Department name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 p-3 rounded-xl w-full mb-4"
                />

                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="border border-gray-300 p-3 rounded-xl w-full mb-4"
                />

                <button
                  onClick={addDepartment}
                  disabled={loading}
                  className="bg-[#0A2540] text-white py-3 px-6 rounded-xl hover:bg-[#061829] transition shadow"
                >
                  {loading ? "Saving..." : "Create department"}
                </button>
              </div>
            )}

            {/* ================= LIST SECTION ================= */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Department list
              </h2>

              <p className="text-gray-500 text-sm mb-3">
                {departments.length} configured department(s).
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="p-3 border">#</th>
                      <th className="p-3 border text-left">Name</th>
                      <th className="p-3 border text-left">Description</th>
                      <th className="p-3 border text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {departments.map((dept, index) => (
                      <tr key={dept.id} className="border text-sm">
                        <td className="p-3 border text-center">{index + 1}</td>
                        <td className="p-3 border">{dept.name}</td>
                        <td className="p-3 border">{dept.description}</td>

                        <td className="p-3 border text-center space-x-3">
                          {/* EDIT BUTTON — only if edit permission */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditing(dept);
                                setEditName(dept.name);
                                setEditDesc(dept.description || "");
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          )}

                          {/* DELETE BUTTON — only if delete permission */}
                          {canDelete && (
                            <button
                              onClick={() => deleteDepartment(dept.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ================= EDIT MODAL ================= */}
          {editing && canEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-96 p-6 rounded-xl shadow-xl">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Edit Department
                </h2>

                <input
                  type="text"
                  className="border p-3 rounded-xl w-full mb-4"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <input
                  type="text"
                  className="border p-3 rounded-xl w-full mb-4"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await api.put(
                          `/hospitals/departments/${tenant_db}/update/${editing.id}`,
                          {
                            name: editName,
                            description: editDesc,
                          }
                        );

                        alert("Updated successfully!");
                        setEditing(null);
                        fetchDepartments();
                      } catch (err) {
                        alert("Update failed");
                        console.error(err);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
