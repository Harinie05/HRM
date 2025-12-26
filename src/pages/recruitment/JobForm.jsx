import { useEffect, useState } from "react";
import api from "../../api";

export default function JobForm({ mode, job, onClose }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  // ========================= FORM STATE =========================
  const [form, setForm] = useState({
    title: "",
    department: "",
    openings: 1,
    experience: "",
    salary_range: "",
    job_type: "Full-time",
    work_mode: "On-site",
    location: "",
    skills: "",
    description: "",
    status: "Draft",        // backend uses "Draft" | "Posted"
    rounds: ["HR Round"],   // backend expects simple list, not objects
  });

  // ========================= LOAD EXISTING JOB =========================
  useEffect(() => {
    if (isEdit || isView) {
      setForm({
        title: job.title,
        department: job.department,
        openings: job.openings,
        experience: job.experience,
        salary_range: job.salary_range,
        job_type: job.job_type,
        work_mode: job.work_mode,
        location: job.location,
        skills: job.skills,
        description: job.description,
        status: job.status,
        rounds: job.rounds?.length ? job.rounds : ["HR Round"],
      });
    }
  }, [job]);

  // ========================= FIELD UPDATE =========================
  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // ========================= ROUNDS =========================
  const addRound = () => {
    setForm({ ...form, rounds: [...form.rounds, ""] });
  };

  const updateRound = (i, value) => {
    const updated = [...form.rounds];
    updated[i] = value;
    setForm({ ...form, rounds: updated });
  };

  const removeRound = (i) => {
    const updated = form.rounds.filter((_, idx) => idx !== i);
    setForm({ ...form, rounds: updated });
  };

  // ========================= SUBMIT FORM =========================
  const submitForm = async () => {
    try {
      if (mode === "create") {
        await api.post("/recruitment/create", form);
        alert("Job Created Successfully!");
      }

      if (mode === "edit") {
        await api.put(`/recruitment/update/${job.id}`, form);
        alert("Job Updated Successfully!");
      }

      onClose();
    } catch (err) {
      console.error("Failed to save job", err);
      alert("Failed to save job.");
    }
  };

  // ========================= RENDER UI =========================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-[700px] max-h-[88vh] overflow-y-auto p-6 rounded-xl shadow-xl">

        <h2 className="text-xl font-semibold mb-4">
          {mode === "create" && "Create New Job"}
          {mode === "edit" && "Edit Job"}
          {mode === "view" && "Job Details"}
        </h2>

        {/* FORM FIELDS */}
        <div className="space-y-4">

          <input
            type="text"
            placeholder="Job Title"
            value={form.title}
            disabled={isView}
            onChange={(e) => updateField("title", e.target.value)}
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          {/* Department & Openings */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Department"
              value={form.department}
              disabled={isView}
              onChange={(e) => updateField("department", e.target.value)}
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <input
              type="number"
              placeholder="Openings"
              value={form.openings}
              disabled={isView}
              onChange={(e) => updateField("openings", e.target.value)}
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />
          </div>

          {/* Experience & Salary */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Experience (e.g., 2-4 years)"
              value={form.experience}
              disabled={isView}
              onChange={(e) => updateField("experience", e.target.value)}
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <input
              type="text"
              placeholder="Salary Range (e.g., 4-7 LPA)"
              value={form.salary_range}
              disabled={isView}
              onChange={(e) => updateField("salary_range", e.target.value)}
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />
          </div>

          {/* Job Type & Work Mode */}
          <div className="grid grid-cols-2 gap-3">
            <select
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
              value={form.job_type}
              disabled={isView}
              onChange={(e) => updateField("job_type", e.target.value)}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>

            <select
              className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
              value={form.work_mode}
              disabled={isView}
              onChange={(e) => updateField("work_mode", e.target.value)}
            >
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </div>

          {/* Location */}
          <input
            type="text"
            placeholder="Job Location"
            value={form.location}
            disabled={isView}
            onChange={(e) => updateField("location", e.target.value)}
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          {/* Skills */}
          <textarea
            placeholder="Required Skills"
            value={form.skills}
            disabled={isView}
            onChange={(e) => updateField("skills", e.target.value)}
            className="border p-2 rounded w-full h-20" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          ></textarea>

          {/* Description */}
          <textarea
            placeholder="Job Description"
            value={form.description}
            disabled={isView}
            onChange={(e) => updateField("description", e.target.value)}
            className="border p-2 rounded w-full h-32" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          ></textarea>

          {/* Publish */}
          {!isView && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === "Posted"}
                onChange={(e) =>
                  updateField("status", e.target.checked ? "Posted" : "Draft")
                }
              />
              <span className="text-sm">Publish this job</span>
            </label>
          )}

          {/* ROUNDS */}
          <div>
            <h3 className="font-semibold mb-2">Interview Rounds</h3>

            {form.rounds.map((r, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={r}
                  disabled={isView}
                  onChange={(e) => updateRound(index, e.target.value)}
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                />

                {!isView && (
                  <button
                    onClick={() => removeRound(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    X
                  </button>
                )}
              </div>
            ))}

            {!isView && (
              <button
                onClick={addRound}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                + Add Round
              </button>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-300 rounded-lg"
            onClick={onClose}
          >
            Close
          </button>

          {!isView && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              onClick={submitForm}
            >
              {mode === "create" ? "Create Job" : "Update Job"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
