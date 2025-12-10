import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../api";

export default function Dashboard() {
  const [holidays, setHolidays] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Job Apply States
  const [jobs, setJobs] = useState([]);
  const [applyModal, setApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jdModal, setJdModal] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    notice_period: "",
    current_ctc: "",
    expected_ctc: "",
    linkedin: "",
    why_hire: ""
  });

  const [resume, setResume] = useState(null);

  // Calendar month/year state
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  // ========================= FETCH HOLIDAYS =========================
  const fetchHolidays = async () => {
    try {
      const res = await api.get("/holidays/list");
      setHolidays(res.data || []);
    } catch {
      console.error("Failed to load holidays");
    }
  };

  // ========================= FETCH JOBS =========================
  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruitment/jobs/posted");
      setJobs(res.data || []);
    } catch {
      console.error("Failed to load jobs");
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchJobs();
  }, []);

  // Calendar helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    if (month === 0) setYear((y) => y - 1);
  };

  const nextMonth = () => {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    if (month === 11) setYear((y) => y + 1);
  };

  const getHolidayForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return holidays.find((h) => h.date === dateStr);
  };

  // ========================= VIEW JOB DETAILS =========================
  const viewJobDetails = async (jobId) => {
    try {
      const res = await api.get(`/ats/job/${jobId}`);
      setJobDetails(res.data);
      setJdModal(true);
    } catch {
      alert("Failed to load job details");
    }
  };

  // ========================= APPLY FOR JOB =========================
  const submitApplication = async () => {
    try {
      const fd = new FormData();
      fd.append("job_id", selectedJob.id);
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("experience", form.experience);
      fd.append("resume", resume);

      await api.post("/ats/apply", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Application submitted successfully!");
      setApplyModal(false);
      setForm({});
      fetchJobs();
    } catch (err) {
      alert("Failed to submit application");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-[#F7F9FB] min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-[#0D3B66] mb-5">
            HRM Dashboard
          </h1>

          {/* ================== TOP CARDS ================== */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">TOTAL EMPLOYEES</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">DEPARTMENTS</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">ACTIVE USERS</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">PENDING APPROVALS</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>

          {/* ================= HOLIDAY BUTTON ================= */}
          <button
            onClick={() => setShowCalendar((v) => !v)}
            className="bg-[#0D3B66] text-white px-5 py-2 rounded-xl shadow hover:bg-[#0b3154]"
          >
            Holiday Gallery
          </button>

          {/* ================= PROFESSIONAL CALENDAR ================= */}
          {showCalendar && (
            <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border">
              {/* Calendar header */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={prevMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ‹
                </button>
                <h2 className="text-xl font-semibold">
                  {new Date(year, month).toLocaleString("en-US", { month: "long" })}{" "}
                  {year}
                </h2>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 text-center font-medium text-gray-600 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                <div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={i}></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const holiday = getHolidayForDate(day);

                  return (
                    <div
                      key={day}
                      className={`p-3 h-20 border rounded-lg relative ${
                        holiday ? "bg-blue-50 border-blue-300" : "bg-white"
                      } hover:shadow`}
                    >
                      <span className="font-semibold">{day}</span>
                      {holiday && (
                        <>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-xs text-blue-700 mt-1 font-medium truncate">
                            {holiday.name}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= JOB OPENINGS SECTION ================= */}
          <h2 className="text-2xl font-bold mt-10 mb-4 text-[#0D3B66]">
            Open Positions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-5 shadow rounded-xl border hover:shadow-md"
              >
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <p className="text-gray-600">
                  {job.experience} yrs | Salary: {job.salary_range}
                </p>
                <p className="text-gray-500 mb-3">
                  Openings: {job.openings}
                </p>

                <button
                  onClick={() => {
                    setSelectedJob(job);
                    setApplyModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-1 rounded-lg mr-2"
                >
                  Apply
                </button>

                <button 
                  onClick={() => viewJobDetails(job.id)}
                  className="bg-gray-200 px-4 py-1 rounded-lg"
                >
                  View JD
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= JOB DETAILS MODAL ================= */}
        {jdModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] max-h-[80vh] overflow-y-auto p-6 rounded-xl shadow-xl">
              <h2 className="text-2xl font-bold mb-4">{jobDetails?.title}</h2>
              
              <div className="space-y-4">
                <div><strong>Department:</strong> {jobDetails?.department}</div>
                <div><strong>Experience:</strong> {jobDetails?.experience}</div>
                <div><strong>Salary:</strong> {jobDetails?.salary_range}</div>
                <div><strong>Job Type:</strong> {jobDetails?.job_type}</div>
                <div><strong>Work Mode:</strong> {jobDetails?.work_mode}</div>
                <div><strong>Location:</strong> {jobDetails?.location}</div>
                <div><strong>Openings:</strong> {jobDetails?.openings}</div>
                <div><strong>Skills:</strong> {jobDetails?.skills}</div>
                
                <div>
                  <strong>Description:</strong>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    {jobDetails?.description || "No description available"}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setJdModal(false)}
                className="w-full mt-4 py-2 bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ================= APPLY MODAL ================= */}
        {applyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[450px] p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-4">
                Apply for {selectedJob?.title}
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="border w-full p-2 rounded"
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border w-full p-2 rounded"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border w-full p-2 rounded"
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Experience (Years)"
                  className="border w-full p-2 rounded"
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                />

                <label className="font-medium">Upload Resume</label>
                <input
                  type="file"
                  className="border w-full p-2 rounded"
                  onChange={(e) => setResume(e.target.files[0])}
                />

                <textarea
                  placeholder="Why should we hire you?"
                  className="border w-full p-2 rounded h-20"
                  onChange={(e) =>
                    setForm({ ...form, why_hire: e.target.value })
                  }
                ></textarea>

                <button
                  onClick={submitApplication}
                  className="bg-blue-600 text-white w-full py-2 rounded-lg mt-3"
                >
                  Submit Application
                </button>

                <button
                  className="w-full py-2 text-gray-600"
                  onClick={() => setApplyModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
