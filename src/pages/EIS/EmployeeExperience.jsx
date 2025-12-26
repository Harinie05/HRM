import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBriefcase, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiEye, FiUpload, FiCalendar, FiMapPin } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeExperience() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();

  const [experience, setExperience] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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
      const res = await api.get(`/employee/experience/${id}`);
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
      const data = new FormData();
      data.append("employee_id", id);
      data.append("company", form.company);
      data.append("job_title", form.job_title);
      data.append("department", form.department);
      data.append("employment_type", form.employment_type);
      data.append("start_date", form.start_date);
      data.append("end_date", form.end_date);
      data.append("current_job", form.current_job);
      data.append("salary", form.salary);
      data.append("location", form.location);
      data.append("job_description", form.job_description);
      data.append("achievements", form.achievements);
      data.append("reason_for_leaving", form.reason_for_leaving);
      data.append("reporting_manager", form.reporting_manager);
      data.append("manager_contact", form.manager_contact);

      if (form.file) data.append("file", form.file);

      if (editing) {
        await api.put(`/employee/experience/${editing.id}`, data);
      } else {
        await api.post("/employee/experience/add", data);
      }

      setShowForm(false);
      fetchExperience();
    } catch (err) {
      console.error("Failed to save experience", err);
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
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiBriefcase className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Employee Experience
              </h1>
              <p className="text-gray-600 mb-2">
                Professional work experience and employment history
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{experience.length} Experience Records</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-white text-black border-2 border-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Add Experience
          </button>
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
        {/* Experience Table */}
        <div className="bg-white rounded-3xl border border-black overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
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
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiBriefcase className="w-4 h-4 text-black" />
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
                      {e.file_name ? (
                        <button 
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              alert('Authentication token not found. Please login again.');
                              return;
                            }
                            const url = `http://localhost:8000/employee/experience/document/${e.id}`;
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
                        <button
                          onClick={() => openEdit(e)}
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                        >
                          <FiEdit className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteExperience(e.id)}
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Delete
                          </span>
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
            <div className="bg-white rounded-xl border border-black shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <FiBriefcase className="text-black text-xl" />
                <h3 className="text-lg font-semibold text-primary">
                  {editing ? "Edit Experience" : "Add Experience"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Company Name *</label>
                    <input
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Company Name"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Job Title *</label>
                    <input
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Employment Type</label>
                    <select
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
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
                        className="rounded border border-black text-gray-600 focus:ring-gray-500"
                      />
                      Currently working here
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Location</label>
                    <input
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="City, State, Country"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Salary (Optional)</label>
                    <input
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Annual salary"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Job Description & Responsibilities</label>
                  <textarea
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    rows="3"
                    placeholder="Describe your role and responsibilities..."
                    value={form.job_description}
                    onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Key Achievements</label>
                  <textarea
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Manager's name"
                      value={form.reporting_manager}
                      onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Manager Contact</label>
                    <input
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Reason for leaving this position"
                      value={form.reason_for_leaving}
                      onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Relieving Letter/Experience Certificate</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-black">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveExperience}
                  className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {editing ? "Update" : "Save"} Experience
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
