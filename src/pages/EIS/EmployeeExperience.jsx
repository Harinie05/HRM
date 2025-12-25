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
    <Layout 
      title="Experience Details" 
      subtitle="Professional work experience and employment history"
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
            Add Experience
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Document</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {experience.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Experience Records</h3>
                      <p className="text-gray-500">Add work experience to get started.</p>
                    </td>
                  </tr>
                )}

                {experience.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{e.company}</div>
                      {e.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <FiMapPin className="text-xs" />
                          {e.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{e.job_title || e.role || '-'}</div>
                      {e.department && (
                        <div className="text-sm text-gray-500">{e.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <FiCalendar className="text-xs" />
                        <span className="text-sm">
                          {e.start_date || e.from_year || '-'} to {e.end_date || e.to_year || (e.current_job ? 'Present' : '-')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {e.file_name ? (
                        <button 
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
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
                          <FiEye className="text-sm" />
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(e)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                        >
                          <FiEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExperience(e.id)}
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
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <FiBriefcase className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Experience" : "Add Experience"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company Name"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Job Title"
                      value={form.job_title}
                      onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      disabled={form.current_job}
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.current_job}
                        onChange={(e) => setForm({ ...form, current_job: e.target.checked, end_date: e.target.checked ? "" : form.end_date })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Currently working here
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, State, Country"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary (Optional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Annual salary"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description & Responsibilities</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Describe your role and responsibilities..."
                    value={form.job_description}
                    onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Notable achievements and accomplishments..."
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Manager</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Manager's name"
                      value={form.reporting_manager}
                      onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Contact</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email or phone number"
                      value={form.manager_contact}
                      onChange={(e) => setForm({ ...form, manager_contact: e.target.value })}
                    />
                  </div>
                </div>

                {!form.current_job && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Leaving</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Reason for leaving this position"
                      value={form.reason_for_leaving}
                      onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relieving Letter/Experience Certificate</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
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
                  onClick={saveExperience}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
