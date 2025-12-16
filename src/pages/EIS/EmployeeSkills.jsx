import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
            Skills & Competencies
          </h2>
        </div>

        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Skill
        </button>
      </div>

      {/* SKILLS LIST */}
      <div className="bg-white rounded-lg shadow p-4">
        {skills.length === 0 && (
          <p className="text-gray-500 text-sm">No skills added yet</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((sk) => (
            <div
              key={sk.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{sk.skill_name}</p>
                <p className="text-sm text-gray-600">
                  Rating: {"★".repeat(sk.rating)}
                  {"☆".repeat(5 - sk.rating)}
                </p>
              </div>

              <div className="space-x-2">
                <button
                  onClick={() => openEdit(sk)}
                  className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSkill(sk.id)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">

            <h3 className="text-lg font-semibold">
              {editing ? "Edit Skill" : "Add Skill"}
            </h3>

            <input
              className="border p-2 rounded w-full"
              placeholder="Skill name"
              value={form.skill}
              onChange={(e) => setForm({ ...form, skill: e.target.value })}
            />

            <select
              className="border p-2 rounded w-full"
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: e.target.value })
              }
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 && "s"}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveSkill}
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
