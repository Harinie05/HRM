import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiZap, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiStar } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeSkills() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    skill: "",
    rating: 3,
  });

  // ---------------- FETCH SKILLS ----------------
  const fetchSkills = async () => {
    try {
      const res = await api.get(`/employee/skills/${id}`);
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
      const payload = {
        employee_id: Number(id),
        skill: form.skill,
        rating: Number(form.rating),
      };

      if (editing) {
        await api.put(`/employee/skills/${editing.id}`, payload);
      } else {
        await api.post("/employee/skills/add", payload);
      }

      setShowForm(false);
      fetchSkills();
    } catch (err) {
      console.error("Failed to save skill", err);
    }
  };

  const deleteSkill = async (skillId) => {
    if (!window.confirm("Delete this skill?")) return;

    try {
      await api.delete(`/employee/skills/${skillId}`);
      fetchSkills();
    } catch (err) {
      console.error("Failed to delete skill", err);
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiZap className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Skills & Competencies
              </h1>
              <p className="text-gray-600 mb-2">
                Technical skills and professional competencies
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{skills.length} Active Records</span>
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
            Add Skill
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
        {/* Skills Table */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skill Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Proficiency Level</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
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
                  <tr key={sk.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiZap className="w-4 h-4 text-black" />
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
                        <button
                          onClick={() => openEdit(sk)}
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                        >
                          <FiEdit className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteSkill(sk.id)}
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
            <div className="bg-white rounded-2xl border border-black shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiZap className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Skill" : "Add Skill"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., JavaScript, Project Management"
                    value={form.skill}
                    onChange={(e) => setForm({ ...form, skill: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level *</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-black rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSkill}
                  className="px-6 py-3 bg-white text-black border border-black rounded-xl hover:bg-gray-100 transition-colors font-medium shadow-lg"
                >
                  {editing ? "Update" : "Save"} Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
