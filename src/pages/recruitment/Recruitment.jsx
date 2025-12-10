import { useState, useEffect } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function RecruitmentSetup() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  // ---------------- FORM STATE ----------------
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [manager, setManager] = useState("");
  const [openings, setOpenings] = useState(1);
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [workMode, setWorkMode] = useState("On-site");
  const [location, setLocation] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Draft");


  // ---------------- LOAD JOBS ----------------
  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruitment/jobs/list");
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setJobs([]);
    }
  };

  // ---------------- SAVE ----------------
  const saveJob = async () => {
    if (!title) return alert("Enter Job Title");

    const payload = {
      title,
      department,
      hiring_manager: manager,
      openings,
      experience,
      salary_range: salary,
      job_type: jobType,
      work_mode: workMode,
      location,
      skills,
      description,
      deadline,
      attachment: null,
      status,
    };

    if (editingId) {
      await api.put(`/recruitment/jobs/update/${editingId}`, payload);
      alert("Job Updated!");
    } else {
      await api.post(`/recruitment/jobs/create`, payload);
      alert("Job Saved!");
    }

    resetForm();
    fetchJobs();
  };


  const postJob = async (id) => {
    if (!confirm("Post this job?")) return;
    await api.put(`/recruitment/jobs/post/${id}`);
    alert("Job Posted!");
    fetchJobs();
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    await api.delete(`/recruitment/jobs/delete/${id}`);
    alert("Job Deleted!");
    fetchJobs();
  };

  const editJob = (job) => {
    setEditingId(job.id);
    setTitle(job.title);
    setDepartment(job.department);
    setManager(job.hiring_manager);
    setOpenings(job.openings);
    setExperience(job.experience || "");
    setSalary(job.salary_range || "");
    setJobType(job.job_type);
    setWorkMode(job.work_mode);
    setLocation(job.location);
    setSkills(job.skills || []);
    setDescription(job.description || "");
    setDeadline(job.deadline || "");
    setStatus(job.status);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setDepartment(""); setManager("");
    setOpenings(1); setExperience(""); setSalary("");
    setJobType("Full-time"); setWorkMode("On-site");
    setLocation(""); setSkills([]); setDescription("");
    setDeadline(""); setStatus("Draft");
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const filteredJobs = jobs.filter(j =>
    (filter === "All" || j.status === filter) &&
    j.title.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />
        <div className="p-6">

      <div className="grid grid-cols-2 gap-6">

      {/* ---------------- FORM ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">

        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Job Requisition" : "Create Job Requisition"}
        </h2>

        {/* Grid Inputs */}
        <div className="grid grid-cols-2 gap-4">

          <input className="border p-2 rounded" placeholder="Job Title"
            value={title} onChange={e=>setTitle(e.target.value)} />

          <input className="border p-2 rounded" placeholder="Department"
            value={department} onChange={e=>setDepartment(e.target.value)} />

          <input className="border p-2 rounded" placeholder="Hiring Manager"
            value={manager} onChange={e=>setManager(e.target.value)} />

          <input type="number" className="border p-2 rounded" placeholder="Openings"
            value={openings} onChange={e=>setOpenings(e.target.value)} />

          <input className="border p-2 rounded" placeholder="Experience (2-4 yrs)"
            value={experience} onChange={e=>setExperience(e.target.value)} />

          <input className="border p-2 rounded" placeholder="Salary Range (4-7 LPA)"
            value={salary} onChange={e=>setSalary(e.target.value)} />


          <select className="border p-2 rounded"
            value={jobType} onChange={e=>setJobType(e.target.value)}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
          </select>

          <select className="border p-2 rounded"
            value={workMode} onChange={e=>setWorkMode(e.target.value)}>
            <option>On-site</option>
            <option>Remote</option>
            <option>Hybrid</option>
          </select>

          <input className="border p-2 rounded" placeholder="Location"
            value={location} onChange={e=>setLocation(e.target.value)} />

          <input type="date" className="border p-2 rounded"
            value={deadline} onChange={e=>setDeadline(e.target.value)} />
        </div>


        {/* Skills */}
        <div>
          <div className="flex gap-2">
            <input className="border p-2 rounded flex-1" placeholder="Add Skill"
              value={skillInput} onChange={e=>setSkillInput(e.target.value)} />
            <button onClick={addSkill} className="px-4 bg-gray-200 rounded">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((s,i)=>(
              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{s}</span>
            ))}
          </div>
        </div>


        <textarea rows="3" className="border p-2 rounded w-full" placeholder="Job Description"
          value={description} onChange={e=>setDescription(e.target.value)} />


        <select className="border p-2 rounded w-40" 
          value={status} onChange={e=>setStatus(e.target.value)}>
          <option>Draft</option>
          <option>Posted</option>
        </select>


        <div className="flex justify-end gap-3">
          <button onClick={resetForm} className="border px-5 py-2 rounded">Reset</button>
          <button onClick={saveJob} className="bg-blue-600 text-white px-6 py-2 rounded">
            Save Job
          </button>
        </div>
      </div>

      {/* ---------------- JOB LIST ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow-sm">

        <div className="flex gap-4 mb-4">
          <input className="border p-2 rounded w-60" placeholder="Search Job"
            value={search} onChange={e=>setSearch(e.target.value)} />

          <select className="border p-2 rounded"
            value={filter} onChange={e=>setFilter(e.target.value)}>
            <option>All</option>
            <option>Draft</option>
            <option>Posted</option>
          </select>
        </div>


        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="border p-2">Job Title</th>
              <th className="border p-2">Dept</th>
              <th className="border p-2">Openings</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredJobs.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-3 text-gray-400">No jobs found</td></tr>
            ) : filteredJobs.map(j => (
              <tr key={j.id}>
                <td className="border p-2">{j.title}</td>
                <td className="border p-2">{j.department}</td>
                <td className="border p-2">{j.openings}</td>
                <td className="border p-2">{j.status}</td>
                <td className="border p-2 space-x-3 text-sm">
                  <button onClick={()=>editJob(j)} className="text-blue-600">Edit</button>
                  {j.status === "Draft" && (
                    <button onClick={()=>postJob(j.id)} className="text-green-600">Post</button>
                  )}
                  <button onClick={()=>deleteJob(j.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      </div>
        </div>
      </div>
    </div>
  );
}
