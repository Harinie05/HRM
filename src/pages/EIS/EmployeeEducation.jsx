import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/eis/${id}`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>←</span> Back to Profile
              </button>
              <h2 className="text-xl font-semibold text-[#0D3B66]">
                Education Details
              </h2>
            </div>

            <button
              onClick={openAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Add Education
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Degree</th>
                  <th className="p-3 text-left">Specialization</th>
                  <th className="p-3 text-left">University</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-center">Grade/CGPA</th>
                  <th className="p-3 text-center">Certificate</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {education.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
                      No education records found
                    </td>
                  </tr>
                )}

                {education.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 font-medium">{e.degree}</td>
                    <td className="p-3">{e.specialization || '-'}</td>
                    <td className="p-3">{e.university}</td>
                    <td className="p-3 text-center">
                      {e.start_year && e.end_year ? e.start_year + ' - ' + e.end_year : (e.year || '-')}
                    </td>
                    <td className="p-3 text-center">{e.percentage_cgpa || '-'}</td>
                    <td className="p-3 text-center">
                      {e.file_name ? (
                        <span 
                          className="text-blue-600 cursor-pointer hover:underline"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              alert('Authentication token not found. Please login again.');
                              return;
                            }
                            window.open(`http://localhost:8000/employee/education/certificate/${e.id}?token=${token}`, '_blank');
                          }}
                        >
                          View
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => openEdit(e)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEducation(e.id)}
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

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl space-y-4">
                <h3 className="text-lg font-semibold mb-4">
                  {editing ? "Edit Education" : "Add Education"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="border p-2 rounded w-full"
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

                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Specialization/Stream"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="University/Board"
                    value={form.university}
                    onChange={(e) => setForm({ ...form, university: e.target.value })}
                  />

                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Institution Name"
                    value={form.board_university}
                    onChange={(e) => setForm({ ...form, board_university: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Start Year"
                    value={form.start_year}
                    onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                  />

                  <input
                    className="border p-2 rounded w-full"
                    placeholder="End Year"
                    value={form.end_year}
                    onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                  />

                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Percentage/CGPA"
                    value={form.percentage_cgpa}
                    onChange={(e) => setForm({ ...form, percentage_cgpa: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="border p-2 rounded w-full"
                    value={form.education_type}
                    onChange={(e) => setForm({ ...form, education_type: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Distance">Distance Learning</option>
                    <option value="Online">Online</option>
                  </select>

                  <select
                    className="border p-2 rounded w-full"
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

                <div className="grid grid-cols-2 gap-4">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />

                  <input
                    className="border p-2 rounded w-full"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                  className="border p-2 rounded w-full"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEducation}
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