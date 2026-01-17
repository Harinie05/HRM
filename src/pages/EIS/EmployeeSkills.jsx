import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiZap, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiStar } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeSkills() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Check permissions - removed to allow access
  // const canView = isAdmin() || hasPermission("view_skills");
  // const canAdd = isAdmin() || hasPermission("add_skills_record");
  // const canEdit = isAdmin() || hasPermission("edit_skills_record");
  // const canDelete = isAdmin() || hasPermission("delete_skills_record");
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
  //             <FiZap className="w-8 h-8 text-red-600" />
  //           </div>
  //           <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
  //           <p className="text-gray-500">You don't have permission to view employee skills records.</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }
  const [form, setForm] = useState({
    skill: "",
    rating: 3,
  });

  // ---------------- FETCH SKILLS ----------------
  const fetchSkills = async () => {
    try {
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      const res = await api.get(`/employee/skills/${numericId}`);
      setSkills(res.data || []);
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [id]);

  // ---------------- FORM HANDLERS ----------------
  const openAdd = () => {
    setEditing(null);
    setForm({ skill: "", rating: 3 });
    setShowForm(true);
  };

  const openEdit = (sk) => {
    setEditing(sk);
    setForm({
      skill: sk.skill_name,
      rating: sk.rating,
    });
    setShowForm(true);
  };

  const saveSkill = async () => {
    try {
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      const payload = {
        employee_id: Number(numericId),
        skill: form.skill,
        rating: Number(form.rating),
      };

      if (editing) {
        await api.put(`/employee/skills/${editing.id}`, payload);
        showToast("Skill updated successfully!", "success");
      } else {
        await api.post("/employee/skills/add", payload);
        showToast("Skill added successfully!", "success");
      }

      setShowForm(false);
      fetchSkills();
    } catch (err) {
      console.error("Failed to save skill", err);
      showToast("Failed to save skill", "error");
    }
  };

  const deleteSkill = async (skillId) => {
    if (!window.confirm("Delete this skill?")) return;

    try {
      await api.delete(`/employee/skills/${skillId}`);
      showToast("Skill deleted successfully!", "success");
      fetchSkills();
    } catch (err) {
      console.error("Failed to delete skill", err);
      showToast("Failed to delete skill", "error");
    }
  };

  return (
    <Layout>
      {/* Hero Header matching Department */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl shadow-sm p-4 sm:p-6 border relative overflow-hidden" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiZap className="h-5 h-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Skills</h1>
                <p className="text-gray-600 text-sm mb-1">Technical skills and professional competencies</p>
                <p className="text-gray-500 text-xs">{skills.length} Active Records • Real-time Updates</p>
              </div>
            </div>
            {canAdd && (
              <button
                onClick={openAdd}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <FiPlus className="w-4 h-4" />
                Add Skill
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 text-white border rounded-lg transition-colors text-sm"
            style={{ 
              backgroundColor: "var(--primary-color, #4575b5)", 
              borderColor: "var(--primary-color, #4575b5)" 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--secondary-color, #6b7280)";
              e.target.style.borderColor = "var(--secondary-color, #6b7280)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color, #4575b5)";
              e.target.style.borderColor = "var(--primary-color, #4575b5)";
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
        {/* Skills Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skill Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Proficiency Level</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {skills.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <FiZap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Added</h3>
                      <p className="text-gray-500">Add technical skills and competencies to showcase expertise.</p>
                    </td>
                  </tr>
                )}

                {skills.map((sk) => (
                  <tr key={sk.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                        }}>
                          <FiZap className="w-4 h-4" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div className="font-medium text-gray-900">{sk.skill_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < sk.rating ? 'text-gray-600 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-1">
                          {sk.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(sk)}
                            className="group relative p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Edit
                            </span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteSkill(sk.id)}
                            className="group relative p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
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
            {skills.length === 0 ? (
              <div className="p-6 text-center">
                <FiZap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Added</h3>
                <p className="text-gray-500">Add technical skills and competencies to showcase expertise.</p>
              </div>
            ) : (
              skills.map((sk) => (
                <div key={sk.id} className="p-4 border-b-0 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                      }}>
                        <FiZap className="w-4 h-4" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div className="font-medium text-gray-900">{sk.skill_name}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Proficiency:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < sk.rating ? 'text-gray-600 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {sk.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(sk)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteSkill(sk.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
            }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiZap className="w-5 h-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Skill" : "Add Skill"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    placeholder="e.g., JavaScript, Project Management"
                    value={form.skill}
                    onChange={(e) => setForm({ ...form, skill: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level *</label>
                  <select
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  >
                    <option value={1}>1 Star - Beginner</option>
                    <option value={2}>2 Stars - Basic</option>
                    <option value={3}>3 Stars - Intermediate</option>
                    <option value={4}>4 Stars - Advanced</option>
                    <option value={5}>5 Stars - Expert</option>
                  </select>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-5 h-5 ${
                          i < form.rating ? 'text-gray-600 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {form.rating}/5
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium border"
                  style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSkill}
                  className="px-6 py-3 text-white rounded-lg transition-colors font-medium shadow-lg"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  }}>
                  {editing ? "Update" : "Save"} Skill
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

<style jsx>{`
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
`}</style>

