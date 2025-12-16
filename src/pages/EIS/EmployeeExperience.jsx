import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
            Experience Details
          </h2>
        </div>

        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Experience
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-center">From</th>
              <th className="p-3 text-center">To</th>
              <th className="p-3 text-center">Relieving Doc</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {experience.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No experience records found
                </td>
              </tr>
            )}

            {experience.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.company}</td>
                <td className="p-3">{e.job_title || e.role || '-'}</td>
                <td className="p-3 text-center">{e.start_date || e.from_year || '-'}</td>
                <td className="p-3 text-center">{e.end_date || e.to_year || (e.current_job ? 'Present' : '-')}</td>
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
                        const url = `http://localhost:8000/employee/experience/document/${e.id}`;
                        window.open(`${url}?token=${token}`, '_blank');
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
                    onClick={() => deleteExperience(e.id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl space-y-4 max-h-[90vh] overflow-y-auto">

            <h3 className="text-lg font-semibold mb-4">
              {editing ? "Edit Experience" : "Add Experience"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded w-full"
                placeholder="Company Name"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Job Title"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded w-full"
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />

              <select
                className="border p-2 rounded w-full"
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

            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="border p-2 rounded w-full"
                placeholder="Start Date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />

              <input
                type="date"
                className="border p-2 rounded w-full"
                placeholder="End Date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                disabled={form.current_job}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.current_job}
                  onChange={(e) => setForm({ ...form, current_job: e.target.checked, end_date: e.target.checked ? "" : form.end_date })}
                />
                Currently working here
              </label>

              <input
                className="border p-2 rounded w-full"
                placeholder="Salary (Optional)"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>

            <input
              className="border p-2 rounded w-full"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <textarea
              className="border p-2 rounded w-full h-20"
              placeholder="Job Description & Responsibilities"
              value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            />

            <textarea
              className="border p-2 rounded w-full h-20"
              placeholder="Key Achievements"
              value={form.achievements}
              onChange={(e) => setForm({ ...form, achievements: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded w-full"
                placeholder="Reporting Manager"
                value={form.reporting_manager}
                onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Manager Contact"
                value={form.manager_contact}
                onChange={(e) => setForm({ ...form, manager_contact: e.target.value })}
              />
            </div>

            {!form.current_job && (
              <input
                className="border p-2 rounded w-full"
                placeholder="Reason for Leaving"
                value={form.reason_for_leaving}
                onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
              />
            )}

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
                onClick={saveExperience}
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
