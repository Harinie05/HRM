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
    <Layout 
      title="Skills & Competencies" 
      subtitle="Technical skills and professional competencies"
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
            Add Skill
          </button>
        </div>

        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          {skills.length === 0 ? (
            <div className="text-center py-12">
              <FiZap className="mx-auto h-12 w-12 text-muted mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No Skills Added</h3>
              <p className="" style={{color: 'var(--text-muted, #6b7280)'}}>Add technical skills and competencies to showcase expertise.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((sk) => (
                <div
                  key={sk.id}
                  className="group border rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary mb-2">{sk.skill_name}</h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`text-sm ${
                              i < sk.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-secondary ml-2">
                          {sk.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(sk)}
                        className="p-1 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                      >
                        <FiEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => deleteSkill(sk.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <FiZap className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-primary">
                  {editing ? "Edit Skill" : "Add Skill"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Skill Name *</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., JavaScript, Project Management"
                    value={form.skill}
                    onChange={(e) => setForm({ ...form, skill: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Proficiency Level *</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className={`text-lg ${
                          i < form.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-secondary ml-2">
                      {form.rating}/5
                    </span>
                  </div>
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
                  onClick={saveSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
