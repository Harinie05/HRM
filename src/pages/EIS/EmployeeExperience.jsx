import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBriefcase, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiEye, FiUpload, FiCalendar, FiMapPin } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeExperience() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [experience, setExperience] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const canView = true;
  const canAdd = true;
  const canEdit = true;
  const canDelete = true;
  const canViewDetails = true;

  const [form, setForm] = useState({
    company: "",
    job_title: "",
    department: "",
    employment_type: "Full-time",
    start_date: "",
    end_date: "",
    current_job: false,
    salary: "",
    location: "",
    job_description: "",
    achievements: "",
    reason_for_leaving: "",
    reporting_manager: "",
    manager_contact: "",
    file: null,
  });

  // ---------------- FETCH EXPERIENCE ----------------
  const fetchExperience = async () => {
    try {
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      const res = await api.get(`/employee/experience/${numericId}`);
      setExperience(res.data || []);
    } catch (err) {
      console.error("Failed to load experience", err);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, [id]);

  // ---------------- FORM HANDLERS ----------------
  const openAdd = () => {
    setEditing(null);
    setForm({
      company: "",
      job_title: "",
      department: "",
      employment_type: "Full-time",
      start_date: "",
      end_date: "",
      current_job: false,
      salary: "",
      location: "",
      job_description: "",
      achievements: "",
      reason_for_leaving: "",
      reporting_manager: "",
      manager_contact: "",
      file: null,
    });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({
      company: exp.company,
      job_title: exp.job_title || exp.role || "",
      department: exp.department || "",
      employment_type: exp.employment_type || "Full-time",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      current_job: exp.current_job || false,
      salary: exp.salary || "",
      location: exp.location || "",
      job_description: exp.job_description || "",
      achievements: exp.achievements || "",
      reason_for_leaving: exp.reason_for_leaving || "",
      reporting_manager: exp.reporting_manager || "",
      manager_contact: exp.manager_contact || "",
      file: null,
    });
    setShowForm(true);
  };

  const saveExperience = async () => {
    try {
      // Validate required fields
      if (!form.company.trim()) {
        showToast("Company name is required", "error");
        return;
      }
      if (!form.job_title.trim()) {
        showToast("Job title is required", "error");
        return;
      }
      if (!form.start_date) {
        showToast("Start date is required", "error");
        return;
      }

      const data = new FormData();
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      data.append("employee_id", numericId);
      data.append("company", form.company.trim());
      data.append("job_title", form.job_title.trim());
      data.append("department", form.department.trim());
      data.append("employment_type", form.employment_type);
      data.append("start_date", form.start_date);
      data.append("end_date", form.current_job ? "" : form.end_date);
      data.append("current_job", form.current_job.toString());
      data.append("salary", form.salary.trim());
      data.append("location", form.location.trim());
      data.append("job_description", form.job_description.trim());
      data.append("achievements", form.achievements.trim());
      data.append("reason_for_leaving", form.reason_for_leaving.trim());
      data.append("reporting_manager", form.reporting_manager.trim());
      data.append("manager_contact", form.manager_contact.trim());

      if (form.file) data.append("file", form.file);

      // Debug: Log the data being sent
      console.log('Sending data:');
      for (let [key, value] of data.entries()) {
        console.log(`${key}: ${value}`);
      }

      if (editing) {
        await api.put(`/employee/experience/${editing.id}`, data);
        showToast("Experience updated successfully!", "success");
      } else {
        await api.post("/employee/experience/add", data);
        showToast("Experience added successfully!", "success");
      }

      setShowForm(false);
      fetchExperience();
    } catch (err) {
      console.error("Failed to save experience", err);
      console.error("Error response:", err.response?.data);
      console.error("Detail array:", err.response?.data?.detail);
      
      let errorMsg = "Failed to save experience";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Handle validation error array
          console.log("Processing validation errors:", err.response.data.detail);
          errorMsg = err.response.data.detail.map(error => {
            console.log("Individual error:", error);
            if (error.loc && error.msg) {
              return `${error.loc.join('.')}: ${error.msg}`;
            }
            return error.msg || error;
          }).join(', ');
        } else {
          errorMsg = err.response.data.detail;
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      console.log("Final error message:", errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const deleteExperience = async (expId) => {
    if (!window.confirm("Delete this experience record?")) return;

    try {
      await api.delete(`/employee/experience/${expId}`);
      fetchExperience();
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  };

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl shadow-sm p-4 sm:p-6 border relative overflow-hidden" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
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
                <FiBriefcase className="h-5 h-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Experience</h1>
                <p className="text-gray-600 text-sm mb-1">Professional work experience and employment history</p>
                <p className="text-gray-500 text-xs">{experience.length} Experience Records • Real-time Updates</p>
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
                Add Experience
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border"
            style={{
              backgroundColor: 'var(--primary-color, #4575b5)',
              color: 'white',
              borderColor: 'var(--primary-color, #4575b5)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--secondary-color, #6b7280)';
              e.target.style.borderColor = 'var(--secondary-color, #6b7280)';
            }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-color, #4575b5)';
              e.target.style.borderColor = 'var(--primary-color, #4575b5)';
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
        {/* Experience Table */}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {experience.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBriefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Experience Records</h3>
                      <p className="text-gray-500">Add work experience to get started.</p>
                    </td>
                  </tr>
                )}

                {experience.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                        }}>
                          <FiBriefcase className="w-4 h-4" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{e.company}</div>
                          {e.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <FiMapPin className="w-3 h-3" />
                              {e.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{e.job_title || e.role || '-'}</div>
                      {e.department && (
                        <div className="text-sm text-gray-500">{e.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <FiCalendar className="w-3 h-3" />
                        <span className="text-sm">
                          {e.start_date || e.from_year || '-'} to {e.end_date || e.to_year || (e.current_job ? 'Present' : '-')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {e.file_name && canViewDetails ? (
                        <button 
                          className="group relative p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              showToast('Authentication token not found. Please login again.', "error");
                              return;
                            }
                            const url = `${api.defaults.baseURL}/employee/experience/document/${e.id}`;
                            window.open(`${url}?token=${token}`, '_blank');
                          }}
                        >
                          <FiEye className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            View
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(e)}
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
                            onClick={() => deleteExperience(e.id)}
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
            {experience.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBriefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Experience Records</h3>
                <p className="text-gray-500">Add work experience to get started.</p>
              </div>
            ) : (
              experience.map((e) => (
                <div key={e.id} className="p-4 border-b-0 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                      }}>
                        <FiBriefcase className="w-4 h-4" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{e.company}</div>
                        {e.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FiMapPin className="w-3 h-3" />
                            {e.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {e.file_name && canViewDetails && (
                      <button 
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        onClick={() => {
                          const token = localStorage.getItem('access_token');
                          if (!token) {
                            showToast('Authentication token not found. Please login again.', "error");
                            return;
                          }
                          const url = `${api.defaults.baseURL}/employee/experience/document/${e.id}`;
                          window.open(`${url}?token=${token}`, '_blank');
                        }}
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Role:</span>
                      <span className="text-sm text-gray-600">{e.job_title || e.role || '-'}</span>
                    </div>
                    {e.department && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Department:</span>
                        <span className="text-sm text-gray-600">{e.department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Duration:</span>
                      <span className="text-sm text-gray-600">
                        {e.start_date || e.from_year || '-'} to {e.end_date || e.to_year || (e.current_job ? 'Present' : '-')}
                      </span>
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(e)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteExperience(e.id)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border" style={{
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
                  <FiBriefcase className="w-5 h-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Experience" : "Add Experience"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Company Name *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Company Name"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Job Title *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Job Title"
                      value={form.job_title}
                      onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Department</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Employment Type</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      value={form.employment_type}
                      onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Start Date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      disabled={form.current_job}
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-secondary">
                      <input
                        type="checkbox"
                        checked={form.current_job}
                        onChange={(e) => setForm({ ...form, current_job: e.target.checked, end_date: e.target.checked ? "" : form.end_date })}
                        className="rounded text-gray-600 focus:ring-gray-500"
                        style={{
                          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                        }}
                      />
                      Currently working here
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Location</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="City, State, Country"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Salary (Optional)</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Annual salary"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Job Description & Responsibilities</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    rows="3"
                    placeholder="Describe your role and responsibilities..."
                    value={form.job_description}
                    onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Key Achievements</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    rows="3"
                    placeholder="Notable achievements and accomplishments..."
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Reporting Manager</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Manager's name"
                      value={form.reporting_manager}
                      onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Manager Contact</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Email or phone number"
                      value={form.manager_contact}
                      onChange={(e) => setForm({ ...form, manager_contact: e.target.value })}
                    />
                  </div>
                </div>

                {!form.current_job && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Reason for Leaving</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      placeholder="Reason for leaving this position"
                      value={form.reason_for_leaving}
                      onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Relieving Letter/Experience Certificate</label>
                  <div className="flex items-center gap-2">
                    <FiUpload  style={{color: 'var(--text-muted, #6b7280)'}} />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border"
                  style={{
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveExperience}
                  className="px-4 py-2 text-white rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--primary-color, #4575b5)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }}
                >
                  {editing ? "Update" : "Save"} Experience
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
