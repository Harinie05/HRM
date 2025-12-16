import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeFamily() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();
  const [family, setFamily] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    relationship: "",
    age: "",
    contact: "",
    dependent: false,
  });

  // ---------------- FETCH FAMILY ----------------
  const fetchFamily = async () => {
    try {
      const res = await api.get(`/employee/family/${id}`);
      setFamily(res.data || []);
    } catch (err) {
      console.error("Failed to load family", err);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [id]);

  // ---------------- HANDLE FORM ----------------
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      relationship: "",
      age: "",
      contact: "",
      dependent: false,
    });
    setShowForm(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm(member);
    setShowForm(true);
  };

  const saveFamily = async () => {
    try {
      if (editing) {
        await api.put(`/employee/family/${editing.id}`, {
          employee_id: id,
          ...form,
        });
      } else {
        await api.post("/employee/family/add", {
          employee_id: id,
          ...form,
        });
      }

      setShowForm(false);
      fetchFamily();
    } catch (err) {
      console.error("Failed to save family", err);
    }
  };

  const deleteFamily = async (familyId) => {
    if (!window.confirm("Delete this family member?")) return;

    try {
      await api.delete(`/employee/family/${familyId}`);
      fetchFamily();
    } catch (err) {
      console.error("Failed to delete family", err);
    }
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>←</span> Back to Profile
          </button>
          <h2 className="text-xl font-semibold text-[#0D3B66]">
            Family Details
          </h2>
        </div>

        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Family Member
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Relationship</th>
              <th className="p-3 text-center">Age</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-center">Dependent</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {family.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No family records found
                </td>
              </tr>
            )}

            {family.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.name}</td>
                <td className="p-3">{f.relationship}</td>
                <td className="p-3 text-center">{f.age}</td>
                <td className="p-3">{f.contact}</td>
                <td className="p-3 text-center">
                  {f.dependent ? "Yes" : "No"}
                </td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => openEdit(f)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteFamily(f.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">

            <h3 className="text-lg font-semibold">
              {editing ? "Edit Family Member" : "Add Family Member"}
            </h3>

            <input
              className="border p-2 rounded w-full"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Relationship"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.dependent}
                onChange={(e) =>
                  setForm({ ...form, dependent: e.target.checked })
                }
              />
              Dependent
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveFamily}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
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
