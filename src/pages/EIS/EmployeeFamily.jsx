import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiPhone, FiUser } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeFamily() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [family, setFamily] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Check permissions - removed to allow access
  // const canView = isAdmin() || hasPermission("view_family");
  // const canAdd = isAdmin() || hasPermission("add_family_record");
  // const canEdit = isAdmin() || hasPermission("edit_family_record");
  // const canDelete = isAdmin() || hasPermission("delete_family_record");
  const canView = true;
  const canAdd = true;
  const canEdit = true;
  const canDelete = true;

  // Access denied screen removed
  // if (!canView) {
  //   return (
  //     <Layout>
  //       <div className="flex items-center justify-center min-h-[60vh]">
  //         <div className="text-center">
  //           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //             <FiUsers className="w-8 h-8 text-red-600" />
  //           </div>
  //           <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
  //           <p className="text-gray-500">You don't have permission to view employee family records.</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    age: "",
    contact: "",
    dependent: false,
  });

  const fetchFamily = async () => {
    try {
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      const res = await api.get(`/employee/family/${numericId}`);
      setFamily(res.data || []);
    } catch (err) {
      console.error("Failed to load family", err);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [id]);

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
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      
      if (editing) {
        await api.put(`/employee/family/${editing.id}`, {
          employee_id: numericId,
          ...form,
        });
      } else {
        await api.post("/employee/family/add", {
          employee_id: numericId,
          ...form,
        });
      }

      showToast("Family member saved successfully", "success");
      setShowForm(false);
      fetchFamily();
    } catch (err) {
      console.error("Failed to save family", err);
      showToast("Failed to save family member", "error");
    }
  };

  const deleteFamily = async (familyId) => {
    if (!window.confirm("Delete this family member?")) return;

    try {
      await api.delete(`/employee/family/${familyId}`);
      showToast("Family member deleted successfully", "success");
      fetchFamily();
    } catch (err) {
      console.error("Failed to delete family", err);
      showToast("Failed to delete family member", "error");
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiUsers className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Employee Family
              </h1>
              <p className="text-gray-600 mb-2">
                Family members and dependents information
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{family.length} Family Members</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
          
          {canAdd && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-2xl transition-colors font-medium"
              style={{
                backgroundColor: 'var(--primary-color, #4575b5)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
              }}
            >
              <FiPlus className="w-4 h-4" />
              Add Family Member
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 border border-black rounded-lg transition-colors text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Family Table */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Relationship</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Dependent</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
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
                  <tr key={f.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiUser className="w-4 h-4 text-black" />
                        </div>
                        <div className="font-medium text-gray-900">{f.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{f.relationship}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{f.age || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {f.contact ? (
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <FiPhone className="w-3 h-3" />
                          <span className="text-sm">{f.contact}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg border border-black ${
                        f.dependent ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                      }`}>
                        {f.dependent ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(f)}
                            className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Edit
                            </span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteFamily(f.id)}
                            className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {family.length === 0 ? (
              <div className="p-6 text-center">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
                <p className="text-gray-500">Add family members and dependents information.</p>
              </div>
            ) : (
              family.map((f) => (
                <div key={f.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                        <FiUser className="w-4 h-4 text-black" />
                      </div>
                      <div className="font-medium text-gray-900">{f.name}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg border border-black ${
                      f.dependent ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                    }`}>
                      {f.dependent ? 'Dependent' : 'Non-Dependent'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Relationship:</span>
                      <span className="text-sm text-gray-600">{f.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Age:</span>
                      <span className="text-sm text-gray-600">{f.age || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Contact:</span>
                      <span className="text-sm text-gray-600">
                        {f.contact ? (
                          <div className="flex items-center gap-1">
                            <FiPhone className="w-3 h-3" />
                            {f.contact}
                          </div>
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(f)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteFamily(f.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUsers className="text-black w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Family Member" : "Add Family Member"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                  <select
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Age"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <label htmlFor="dependent" className="text-sm text-gray-600">
                    Is this person a dependent?
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-black rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFamily}
                  className="px-6 py-3 text-white rounded-xl transition-colors font-medium shadow-lg"
                  style={{
                    backgroundColor: 'var(--primary-color, #4575b5)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }}
                >
                  {editing ? "Update" : "Save"} Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}
