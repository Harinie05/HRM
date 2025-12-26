import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBook, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiEye, FiUpload } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeEducation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [education, setEducation] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    degree: "",
    specialization: "",
    university: "",
    board_university: "",
    start_year: "",
    end_year: "",
    percentage_cgpa: "",
    education_type: "Full-time",
    country: "India",
    state: "",
    city: "",
    file: null,
  });

  const fetchEducation = async () => {
    try {
      const res = await api.get(`/employee/education/${id}`);
      console.log("Education API response:", res.data);
      
      // Handle both array and object responses
      let educationData = [];
      if (Array.isArray(res.data)) {
        educationData = res.data;
      } else if (res.data && typeof res.data === 'object') {
        // If response is wrapped in an object, try to extract the array
        educationData = res.data.education || res.data.data || [];
      }
      
      console.log("Setting education data:", educationData);
      setEducation(educationData);
    } catch (err) {
      console.error("Failed to load education", err);
      setEducation([]);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [id]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      degree: "",
      specialization: "",
      university: "",
      board_university: "",
      start_year: "",
      end_year: "",
      percentage_cgpa: "",
      education_type: "Full-time",
      country: "India",
      state: "",
      city: "",
      file: null,
    });
    setShowForm(true);
  };

  const openEdit = (edu) => {
    setEditing(edu);
    setForm({
      degree: edu.degree,
      specialization: edu.specialization || "",
      university: edu.university || "",
      board_university: edu.board_university || "",
      start_year: edu.start_year || "",
      end_year: edu.end_year || edu.year || "",
      percentage_cgpa: edu.percentage_cgpa || "",
      education_type: edu.education_type || "Full-time",
      country: edu.country || "India",
      state: edu.state || "",
      city: edu.city || "",
      file: null,
    });
    setShowForm(true);
  };

  const saveEducation = async () => {
    try {
      console.log("Saving education with form data:", form);
      
      const data = new FormData();
      data.append("employee_id", id);
      data.append("degree", form.degree);
      data.append("specialization", form.specialization);
      data.append("university", form.university);
      data.append("board_university", form.board_university);
      data.append("start_year", form.start_year);
      data.append("end_year", form.end_year);
      data.append("percentage_cgpa", form.percentage_cgpa);
      data.append("education_type", form.education_type);
      data.append("country", form.country);
      data.append("state", form.state);
      data.append("city", form.city);
      if (form.file) data.append("file", form.file);

      let response;
      if (editing) {
        response = await api.put(`/employee/education/${editing.id}`, data);
      } else {
        response = await api.post("/employee/education/add", data);
      }
      
      console.log("Save response:", response);
      alert("Education saved successfully!");
      setShowForm(false);
      fetchEducation();
    } catch (err) {
      console.error("Failed to save education", err);
      alert(`Error saving education: ${err.response?.data?.detail || err.message}`);
    }
  };

  const deleteEducation = async (eduId) => {
    if (!window.confirm("Delete this education record?")) return;

    try {
      await api.delete(`/employee/education/${eduId}`);
      fetchEducation();
    } catch (err) {
      console.error("Failed to delete education", err);
    }
  };

  return (
    <Layout 
      title="Education Details" 
      subtitle="Academic qualifications and educational background"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-sm" />
            Back to Profile
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-sm" />
            Add Education
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full">
              <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content border-b ">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Degree</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Specialization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">University</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Duration</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Grade/CGPA</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Certificate</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Actions</th>
                </tr>
              </thead>

              <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="divide-y">
                {education.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FiBook className="mx-auto h-12 w-12 text-muted mb-4" />
                      <h3 className="text-lg font-medium text-primary mb-2">No Education Records</h3>
                      <p className="" style={{color: 'var(--text-muted, #6b7280)'}}>Add educational qualifications to get started.</p>
                    </td>
                  </tr>
                )}

                {education.map((e) => (
                  <tr key={e.id} className="hover:bg-content">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary">{e.degree}</div>
                    </td>
                    <td className="px-6 py-4 text-secondary">{e.specialization || '-'}</td>
                    <td className="px-6 py-4 text-secondary">{e.university}</td>
                    <td className="px-6 py-4 text-center text-secondary">
                      {e.start_year && e.end_year ? `${e.start_year} - ${e.end_year}` : (e.year || '-')}
                    </td>
                    <td className="px-6 py-4 text-center text-secondary">{e.percentage_cgpa || '-'}</td>
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
                            window.open(`http://localhost:8000/employee/education/certificate/${e.id}?token=${token}`, '_blank');
                          }}
                        >
                          <FiEye className="text-sm" />
                          View
                        </button>
                      ) : (
                        <span className="" style={{color: 'var(--text-muted, #6b7280)'}}>-</span>
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
                          onClick={() => deleteEducation(e.id)}
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
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <FiBook className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-primary">
                  {editing ? "Edit Education" : "Add Education"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Degree *</label>
                    <select
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.degree}
                      onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    >
                      <option value="">Select Degree</option>
                      <option value="10th">10th Standard</option>
                      <option value="12th">12th Standard</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Master's">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Certificate">Certificate Course</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Specialization/Stream</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Computer Science"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">University/Board *</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="University or Board name"
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Institution Name</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="College/School name"
                      value={form.board_university}
                      onChange={(e) => setForm({ ...form, board_university: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Start Year</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2020"
                      value={form.start_year}
                      onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">End Year</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2024"
                      value={form.end_year}
                      onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Percentage/CGPA</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="85% or 8.5"
                      value={form.percentage_cgpa}
                      onChange={(e) => setForm({ ...form, percentage_cgpa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Education Type</label>
                    <select
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.education_type}
                      onChange={(e) => setForm({ ...form, education_type: e.target.value })}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Distance">Distance Learning</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Country</label>
                    <select
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">State</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="State name"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">City</label>
                    <input
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City name"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Certificate/Document</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEducation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editing ? "Update" : "Save"} Education
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
