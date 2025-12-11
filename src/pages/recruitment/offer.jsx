import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function Offer() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);

  const [offerForm, setOfferForm] = useState({
    candidate_id: "",
    job_title: "",
    department: "",
    location: "",
    email: "",
    ctc: "",
    basic_percent: 40,
    hra_percent: 20,
    joining_date: "",
    probation: "3 Months",
    notice: "30 Days",
    terms: "",
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedOffer, setGeneratedOffer] = useState(null);

  // ------------------------------------------------------------
  // FETCH SELECTED CANDIDATES FROM ATS (stage = Selected)
  // ------------------------------------------------------------
  const fetchCandidates = async () => {
    try {
      const res = await api.get("/ats/jobs"); // load jobs
      let jobIds = res.data.map((j) => j.id);

      let finalList = [];

      for (let id of jobIds) {
        const pipe = await api.get(`/ats/jobs/${id}/pipeline`);
        finalList.push(...pipe.data.Selected);
      }

      // Fetch full profile
      const detailed = [];
      for (let c of finalList) {
        const d = await api.get(`/ats/candidate/${c.id}`);
        detailed.push(d.data);
      }

      setCandidates(detailed);
    } catch (err) {
      console.error("Failed to load candidates", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // ------------------------------------------------------------
  // GENERATE OFFER (Draft)
  // ------------------------------------------------------------
  const generateOffer = async () => {
    try {
      console.log("DEBUG: Offer form data:", {
        ctc: offerForm.ctc,
        basic_percent: offerForm.basic_percent,
        hra_percent: offerForm.hra_percent,
        joining_date: offerForm.joining_date,
        probation_period: offerForm.probation,
        notice_period: offerForm.notice,
        terms: offerForm.terms
      });
      
      const res = await api.post(`/offer/generate/${offerForm.candidate_id}`, {
        ctc: offerForm.ctc,
        basic_percent: offerForm.basic_percent,
        hra_percent: offerForm.hra_percent,
        location: offerForm.location,
        email: offerForm.email,
        joining_date: offerForm.joining_date,
        probation_period: offerForm.probation,
        notice_period: offerForm.notice,
        terms: offerForm.terms
      });
      setGeneratedOffer(res.data);
      setShowPreview(true);
    } catch (err) {
      console.error("Generate offer error:", err);
      alert("Failed to generate offer");
    }
  };

  // ------------------------------------------------------------
  // SEND OFFER EMAIL
  // ------------------------------------------------------------
  const sendOffer = async () => {
    try {
      const res = await api.post(`/offer/send/${generatedOffer.id}`);
      alert("Offer sent successfully!\nLink: " + res.data.offer_link);
      setShowPreview(false);
      setShowOfferModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to send offer");
    }
  };

  // ------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Offer & Pre-Onboarding</h1>

          {/* ================= TABLE ================= */}
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Job Role</th>
                <th className="p-3 text-center">Stage</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.job_title || "Software Developer"}</td>
                  <td className="p-3 text-center">{c.stage}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelected(c);
                        setOfferForm({
                          ...offerForm,
                          candidate_id: c.id,
                          job_title: c.job_title || "Software Developer",
                          department: c.department || "IT",
                          location: "",
                          email: c.email || "",
                        });
                        setShowOfferModal(true);
                      }}
                      className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Generate Offer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ================= OFFER MODAL ================= */}
          {showOfferModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[550px] shadow-xl max-h-[90vh] overflow-y-auto">

                <h2 className="text-xl font-semibold mb-4">
                  Generate Offer Letter – {selected.name}
                </h2>

                {/* FORM */}
                <div className="space-y-3">
                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    placeholder="CTC Offered (Annual)"
                    value={offerForm.ctc}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, ctc: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      className="border p-2 rounded"
                      placeholder="Basic %"
                      value={offerForm.basic_percent}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, basic_percent: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      className="border p-2 rounded"
                      placeholder="HRA %"
                      value={offerForm.hra_percent}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, hra_percent: e.target.value })
                      }
                    />
                  </div>

                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="Location"
                    value={offerForm.location}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, location: e.target.value })
                    }
                  />

                  <input
                    type="email"
                    className="border p-2 rounded w-full"
                    placeholder="Candidate Email"
                    value={offerForm.email}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, email: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    placeholder="Joining Date"
                    value={offerForm.joining_date}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, joining_date: e.target.value })
                    }
                  />

                  <select
                    className="border p-2 rounded w-full"
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, probation: e.target.value })
                    }
                    value={offerForm.probation}
                  >
                    <option>3 Months</option>
                    <option>6 Months</option>
                  </select>

                  <select
                    className="border p-2 rounded w-full"
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, notice: e.target.value })
                    }
                    value={offerForm.notice}
                  >
                    <option>30 Days</option>
                    <option>45 Days</option>
                    <option>60 Days</option>
                  </select>

                  <textarea
                    className="border p-2 rounded w-full h-28"
                    placeholder="Terms & Conditions"
                    value={offerForm.terms}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, terms: e.target.value })
                    }
                  ></textarea>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowOfferModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={generateOffer}
                  >
                    Preview Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= OFFER PREVIEW MODAL ================= */}
          {showPreview && generatedOffer && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-3">Offer Letter Preview</h2>

                <p><b>Candidate:</b> {selected.name}</p>
                <p><b>Role:</b> {generatedOffer.job_title}</p>
                <p><b>Department:</b> {generatedOffer.department}</p>
                <p><b>Location:</b> {generatedOffer.location || "Not specified"}</p>
                <p><b>CTC:</b> ₹ {generatedOffer.ctc}</p>
                <p><b>Joining Date:</b> {generatedOffer.joining_date}</p>

                <h3 className="font-semibold mt-3">Terms</h3>
                <p className="text-sm">{generatedOffer.terms}</p>

                <div className="flex justify-between mt-5">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowPreview(false)}
                  >
                    Back
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                    onClick={sendOffer}
                  >
                    Send Offer
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
