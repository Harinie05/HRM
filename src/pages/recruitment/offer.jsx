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
  const [attachments, setAttachments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showBGVModal, setShowBGVModal] = useState(false);
  const [selectedBGV, setSelectedBGV] = useState(null);
  const [bgvForm, setBgvForm] = useState({
    agency_name: '',
    status: 'Pending',
    remarks: ''
  });

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

  // ------------------------------------------------------------
  // FETCH OFFERS LIST
  // ------------------------------------------------------------
  const fetchOffers = async () => {
    try {
      const res = await api.get("/offer/list");
      setOffers(res.data);
    } catch (err) {
      console.error("Failed to load offers", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchOffers();
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
      const formData = new FormData();
      
      // Add files if any
      attachments.forEach((file) => {
        formData.append('files', file);
      });
      
      const res = await api.post(`/offer/send/${generatedOffer.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert(`Offer sent successfully to ${res.data.recipient_email}!`);
      setShowPreview(false);
      setShowOfferModal(false);
      setAttachments([]);
      fetchCandidates();
      fetchOffers();
    } catch (err) {
      console.error('Send offer error:', err);
      alert("Failed to send offer");
    }
  };

  // ------------------------------------------------------------
  // MANUAL ACCEPT/REJECT OFFER
  // ------------------------------------------------------------
  const handleOfferResponse = async (offerId, action) => {
    try {
      await api.post(`/offer/manual-response/${offerId}?action=${action}`);
      alert(`Offer ${action}ed successfully!`);
      fetchOffers();
    } catch (err) {
      alert(`Failed to ${action} offer`);
    }
  };

  // ------------------------------------------------------------
  // START BGV
  // ------------------------------------------------------------
  const startBGV = async (candidateId) => {
    try {
      await api.post(`/offer/bgv/start/${candidateId}`);
      alert("BGV started successfully!");
      fetchOffers();
    } catch (err) {
      alert("Failed to start BGV");
    }
  };

  // ------------------------------------------------------------
  // UPDATE BGV
  // ------------------------------------------------------------
  const updateBGV = async () => {
    try {
      await api.put(`/offer/bgv/update/${selectedBGV.bgv_id}`, bgvForm);
      alert("BGV updated successfully!");
      setShowBGVModal(false);
      fetchOffers();
    } catch (err) {
      alert("Failed to update BGV");
    }
  };

  // ------------------------------------------------------------
  // OPEN BGV MODAL
  // ------------------------------------------------------------
  const openBGVModal = async (offer) => {
    try {
      if (offer.bgv_id) {
        const res = await api.get(`/offer/bgv/${offer.bgv_id}`);
        setBgvForm({
          agency_name: res.data.agency_name || '',
          status: res.data.status || 'Pending',
          remarks: res.data.remarks || ''
        });
      }
      setSelectedBGV(offer);
      setShowBGVModal(true);
    } catch (err) {
      console.error("Failed to load BGV details", err);
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

          {/* ================= OFFERS MANAGEMENT TABLE ================= */}
          {offers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Sent Offers</h2>
              <table className="min-w-full bg-white rounded-xl shadow mb-6">
                <thead className="bg-gray-100 text-gray-600 text-sm">
                  <tr>
                    <th className="p-3 text-left">Candidate</th>
                    <th className="p-3 text-left">Job Role</th>
                    <th className="p-3 text-center">Offer Status</th>
                    <th className="p-3 text-center">BGV Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id} className="border-t">
                      <td className="p-3">{offer.candidate_name}</td>
                      <td className="p-3">{offer.job_title}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          offer.offer_status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          offer.offer_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          offer.offer_status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {offer.offer_status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {offer.bgv_status ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            offer.bgv_status === 'Cleared' ? 'bg-green-100 text-green-800' :
                            offer.bgv_status === 'Failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {offer.bgv_status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not Started</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {offer.offer_status === 'Sent' && (
                            <>
                              <button
                                onClick={() => handleOfferResponse(offer.id, 'accept')}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleOfferResponse(offer.id, 'reject')}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {offer.offer_status === 'Accepted' && !offer.bgv_status && (
                            <button
                              onClick={() => startBGV(offer.application_id)}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                            >
                              Start BGV
                            </button>
                          )}
                          {offer.bgv_status && (
                            <button
                              onClick={() => openBGVModal(offer)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Manage BGV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Selected Candidates</h2>
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Attach Documents (Optional)</label>
                    <input
                      type="file"
                      multiple
                      className="border p-2 rounded w-full"
                      onChange={(e) => setAttachments(Array.from(e.target.files))}
                    />
                    {attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected files:</p>
                        {attachments.map((file, idx) => (
                          <p key={idx} className="text-xs text-blue-600">• {file.name}</p>
                        ))}
                      </div>
                    )}
                  </div>
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

          {/* ================= BGV MODAL ================= */}
          {showBGVModal && selectedBGV && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Background Verification - {selectedBGV.candidate_name}
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">BGV Type</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={bgvForm.agency_name || 'Internal'}
                      onChange={(e) => setBgvForm({...bgvForm, agency_name: e.target.value === 'Internal' ? '' : e.target.value})}
                    >
                      <option value="Internal">Internal BGV (HR Team)</option>
                      <option value="External">External Agency</option>
                    </select>
                  </div>

                  {bgvForm.agency_name && bgvForm.agency_name !== 'Internal' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Agency Name</label>
                      <input
                        type="text"
                        className="border p-2 rounded w-full"
                        placeholder="Enter agency name"
                        value={bgvForm.agency_name === 'External' ? '' : bgvForm.agency_name}
                        onChange={(e) => setBgvForm({...bgvForm, agency_name: e.target.value})}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">BGV Status</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={bgvForm.status}
                      onChange={(e) => setBgvForm({...bgvForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                      className="border p-2 rounded w-full h-20"
                      placeholder="Notes about BGV..."
                      value={bgvForm.remarks}
                      onChange={(e) => setBgvForm({...bgvForm, remarks: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Documents Required:</strong></p>
                    <p>✓ Aadhaar ✓ PAN □ Degree Certificate □ Experience Letter</p>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowBGVModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={updateBGV}
                  >
                    Update BGV
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
