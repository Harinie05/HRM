import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiPhone, FiUser } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

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
    <Layout 
      title="Family Details" 
      subtitle="Family members and dependents information"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-sm" />
            Back to Profile
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-sm" />
            Add Family Member
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Relationship</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Age</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Dependent</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {family.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
                      <p className="text-gray-500">Add family members and dependents information.</p>
                    </td>
                  </tr>
                )}

                {family.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-400" />
                        <div className="font-medium text-gray-900">{f.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{f.relationship}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{f.age}</td>
                    <td className="px-6 py-4">
                      {f.contact ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <FiPhone className="text-xs" />
                          <span className="text-sm">{f.contact}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        f.dependent 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {f.dependent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(f)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                        >
                          <FiEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFamily(f.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <FiTrash2 className="text-xs" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <FiUsers className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Family Member" : "Add Family Member"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Age"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dependent"
                    checked={form.dependent}
                    onChange={(e) => setForm({ ...form, dependent: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="dependent" className="text-sm text-gray-700">
                    Is this person a dependent?
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFamily}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editing ? "Update" : "Save"} Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
