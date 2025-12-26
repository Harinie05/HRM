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
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Employee Education
              </h1>
              <p className="text-gray-600 mb-2">
                Manage academic qualifications and certifications
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{education.length} Active Records</span>
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
            Add Education
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
        {/* Education Cards */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Degree</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Specialization</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">University</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade/CGPA</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
                {education.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Education Records</h3>
                      <p className="text-gray-500">Add educational qualifications to get started.</p>
                    </td>
                  </tr>
                )}

                {education.map((e) => (
                  <tr key={e.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiBook className="w-4 h-4 text-black" />
                        </div>
                        <div className="font-medium text-gray-900">{e.degree}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{e.specialization || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{e.university}</td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {e.start_year && e.end_year ? `${e.start_year} - ${e.end_year}` : (e.year || '-')}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{e.percentage_cgpa || '-'}</td>
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
                            window.open(`http://localhost:8000/employee/education/certificate/${e.id}?token=${token}`, '_blank');
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
                          onClick={() => deleteEducation(e.id)}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiBook className="text-black w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Education" : "Add Education"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization/Stream</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g., Computer Science"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">University/Board *</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="University or Board name"
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="College/School name"
                      value={form.board_university}
                      onChange={(e) => setForm({ ...form, board_university: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Year</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="2020"
                      value={form.start_year}
                      onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Year</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="2024"
                      value={form.end_year}
                      onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Percentage/CGPA</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="85% or 8.5"
                      value={form.percentage_cgpa}
                      onChange={(e) => setForm({ ...form, percentage_cgpa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education Type</label>
                    <select
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="State name"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="City name"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate/Document</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
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
                  onClick={saveEducation}
                  className="px-6 py-3 bg-white text-black border border-black rounded-xl hover:bg-gray-100 transition-colors font-medium shadow-lg"
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
