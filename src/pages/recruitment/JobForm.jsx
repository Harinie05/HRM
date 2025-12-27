import { useEffect, useState } from "react";
import api from "../../api";
import { AppleForm, AppleInput, AppleTextarea, AppleSelect, AppleButton, AppleCheckbox, AppleFormRow, AppleFormSection, AppleFormActions } from "../../components/AppleForms";

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
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            {mode === "create" && "Create New Job"}
            {mode === "edit" && "Edit Job"}
            {mode === "view" && "Job Details"}
          </h2>

          <AppleForm>
            <AppleFormSection title="Basic Information">
              <AppleInput
                label="Job Title"
                required
                placeholder="Enter job title"
                value={form.title}
                disabled={isView}
                onChange={(e) => updateField("title", e.target.value)}
              />

              <AppleFormRow cols={2}>
                <AppleInput
                  label="Department"
                  required
                  placeholder="Enter department"
                  value={form.department}
                  disabled={isView}
                  onChange={(e) => updateField("department", e.target.value)}
                />
                <AppleInput
                  type="number"
                  label="Number of Openings"
                  required
                  placeholder="1"
                  value={form.openings}
                  disabled={isView}
                  onChange={(e) => updateField("openings", e.target.value)}
                />
              </AppleFormRow>

              <AppleFormRow cols={2}>
                <AppleInput
                  label="Experience Required"
                  placeholder="e.g., 2-4 years"
                  value={form.experience}
                  disabled={isView}
                  onChange={(e) => updateField("experience", e.target.value)}
                />
                <AppleInput
                  label="Salary Range"
                  placeholder="e.g., 4-7 LPA"
                  value={form.salary_range}
                  disabled={isView}
                  onChange={(e) => updateField("salary_range", e.target.value)}
                />
              </AppleFormRow>

              <AppleFormRow cols={2}>
                <AppleSelect
                  label="Job Type"
                  value={form.job_type}
                  disabled={isView}
                  onChange={(e) => updateField("job_type", e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </AppleSelect>
                <AppleSelect
                  label="Work Mode"
                  value={form.work_mode}
                  disabled={isView}
                  onChange={(e) => updateField("work_mode", e.target.value)}
                >
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </AppleSelect>
              </AppleFormRow>

              <AppleInput
                label="Job Location"
                placeholder="Enter job location"
                value={form.location}
                disabled={isView}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </AppleFormSection>

            <AppleFormSection title="Job Details">
              <AppleTextarea
                label="Required Skills"
                placeholder="List the required skills and qualifications"
                value={form.skills}
                disabled={isView}
                onChange={(e) => updateField("skills", e.target.value)}
                rows={4}
              />

              <AppleTextarea
                label="Job Description"
                placeholder="Provide a detailed job description"
                value={form.description}
                disabled={isView}
                onChange={(e) => updateField("description", e.target.value)}
                rows={6}
              />
            </AppleFormSection>

            <AppleFormSection title="Interview Process">
              <div className="space-y-3">
                {form.rounds.map((round, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <AppleInput
                        label={`Round ${index + 1}`}
                        placeholder="Enter round name"
                        value={round}
                        disabled={isView}
                        onChange={(e) => updateRound(index, e.target.value)}
                      />
                    </div>
                    {!isView && form.rounds.length > 1 && (
                      <AppleButton
                        variant="danger"
                        size="small"
                        onClick={() => removeRound(index)}
                        type="button"
                      >
                        Remove
                      </AppleButton>
                    )}
                  </div>
                ))}
                {!isView && (
                  <AppleButton
                    variant="secondary"
                    size="small"
                    onClick={addRound}
                    type="button"
                  >
                    + Add Interview Round
                  </AppleButton>
                )}
              </div>
            </AppleFormSection>

            {!isView && (
              <AppleFormSection>
                <AppleCheckbox
                  label="Publish this job immediately"
                  checked={form.status === "Posted"}
                  onChange={(e) =>
                    updateField("status", e.target.checked ? "Posted" : "Draft")
                  }
                />
              </AppleFormSection>
            )}

            <AppleFormActions>
              <AppleButton
                variant="secondary"
                onClick={onClose}
                type="button"
              >
                {isView ? 'Close' : 'Cancel'}
              </AppleButton>
              {!isView && (
                <AppleButton
                  variant="primary"
                  onClick={submitForm}
                  type="button"
                >
                  {mode === "create" ? "Create Job" : "Update Job"}
                </AppleButton>
              )}
            </AppleFormActions>
          </AppleForm>
        </div>
      </div>
    </div>
  );
}
