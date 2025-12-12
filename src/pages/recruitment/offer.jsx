// ------------------------------------------------------------
//  OFFER MANAGEMENT + BGV + EMAIL + ATTACHMENTS  (FULL UI)
// ------------------------------------------------------------

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

  // ---------- BGV ----------
  const [showBGVModal, setShowBGVModal] = useState(false);
  const [selectedBGV, setSelectedBGV] = useState(null);
  const [bgvForm, setBgvForm] = useState({
    agency_name: "",
    status: "Pending",
    remarks: "",
  });

  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCandidate, setLinkCandidate] = useState("");

  // ------------------------------------------------------------
  // FETCH SELECTED CANDIDATES
  // ------------------------------------------------------------
  const fetchCandidates = async () => {
    try {
      const jobs = await api.get("/recruitment/ats/jobs");
      let finalList = [];

      for (let job of jobs.data) {
        const candidates = await api.get(`/recruitment/ats/job/${job.id}`);
        const selected = candidates.data.filter(c => c.stage === "Selected");
        
        // Add job information to candidates
        const enriched = selected.map(c => ({
          ...c,
          job_title: job.title,
          department: job.department
        }));
        
        finalList.push(...enriched);
      }

      setCandidates(finalList);
    } catch (err) {
      console.error("Failed to load candidates", err);
    }
  };

  // ------------------------------------------------------------
  // FETCH OFFERS TABLE
  // ------------------------------------------------------------
  const fetchOffers = async () => {
    try {
      const res = await api.get("/recruitment/offer/list");
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
  // GENERATE OFFER LETTER
  // ------------------------------------------------------------
  const generateOffer = async () => {
    try {
      const res = await api.post(
        `/recruitment/offer/${offerForm.candidate_id}/create`,
        {
          ctc: parseInt(offerForm.ctc),
          basic_percent: parseInt(offerForm.basic_percent),
          hra_percent: parseInt(offerForm.hra_percent),
          joining_date: offerForm.joining_date,
          probation_period: offerForm.probation,
          notice_period: offerForm.notice,
          terms: offerForm.terms,
        }
      );

      setGeneratedOffer(res.data);
      setShowPreview(true);
    } catch (err) {
      alert("Failed to generate offer.");
    }
  };

  // ------------------------------------------------------------
  // SEND OFFER EMAIL
  // ------------------------------------------------------------
  const sendOffer = async () => {
    try {
      await api.post(`/recruitment/offer/${generatedOffer.id}/send`);

      alert("Offer letter sent successfully to candidate!");
      setShowPreview(false);
      setShowOfferModal(false);
      fetchOffers();
    } catch (err) {
      alert("Failed to send offer");
    }
  };

  // ------------------------------------------------------------
  // MANUALLY ACCEPT / REJECT OFFER
  // ------------------------------------------------------------
  const handleOfferResponse = async (offerId, action) => {
    try {
      const status = action === "accept" ? "Accepted" : "Rejected";
      await api.post(`/recruitment/offer/${offerId}/status?status=${status}`);
      alert(`Offer ${action}ed successfully`);
      fetchOffers();
    } catch {
      alert("Failed to update offer status");
    }
  };

  // ------------------------------------------------------------
  // START BGV
  // ------------------------------------------------------------
  const startBGV = async (applicationId) => {
    try {
      await api.post(`/recruitment/offer/bgv/start/${applicationId}`);
      alert("BGV Started");
      fetchOffers();
    } catch {
      alert("Failed");
    }
  };

  // ------------------------------------------------------------
  // OPEN BGV MODAL
  // ------------------------------------------------------------
  const openBGVModal = async (offer) => {
    try {
      if (offer.bgv_id) {
        const res = await api.get(`/recruitment/offer/bgv/${offer.bgv_id}`);
        setBgvForm({
          agency_name: res.data.agency,
          status: res.data.status,
          remarks: res.data.remarks,
        });
      }
      setSelectedBGV(offer);
      setShowBGVModal(true);
    } catch (err) {
      alert("Failed to load BGV details");
    }
  };

  // ------------------------------------------------------------
  // UPDATE BGV
  // ------------------------------------------------------------
  const updateBGV = async () => {
    try {
      await api.put(
        `/recruitment/offer/bgv/update/${selectedBGV.bgv_id}`,
        bgvForm
      );
      alert("BGV Updated!");
      setShowBGVModal(false);
      fetchOffers();
    } catch {
      alert("Failed to update");
    }
  };

  // ------------------------------------------------------------
  // VIEW DOCUMENTS
  // ------------------------------------------------------------
  const viewDocuments = async (offerId) => {
    try {
      const res = await api.get(`/recruitment/offer/documents/view/${offerId}`);
      setDocuments(res.data.documents);
      setShowDocuments(true);
    } catch {
      alert("Failed to load documents");
    }
  };

  // ------------------------------------------------------------
  // GENERATE DOCUMENT UPLOAD LINK
  // ------------------------------------------------------------
  const generateDocumentLink = async (offerId) => {
    try {
      const res = await api.post(`/recruitment/offer/${offerId}/generate-link`);
      setGeneratedLink(res.data.upload_url);
      setLinkCandidate(res.data.candidate_name);
      setShowLinkModal(true);
    } catch {
      alert("Failed to generate link");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard!");
  };

  // ------------------------------------------------------------
  // UI STARTS HERE
  // ------------------------------------------------------------
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />

        <div className="p-6">

          <h1 className="text-2xl font-semibold mb-6">Offer & Pre-Onboarding</h1>

          {/* ==================== SENT OFFERS TABLE ==================== */}
          {offers.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-2">Offers Sent</h2>

              <table className="min-w-full bg-white rounded-xl shadow">
                <thead className="bg-gray-100 text-gray-600 text-sm">
                  <tr>
                    <th className="p-3 text-left">Candidate</th>
                    <th className="p-3 text-left">Job</th>
                    <th className="p-3 text-center">Offer Status</th>
                    <th className="p-3 text-center">BGV</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-3">{o.candidate_name}</td>
                      <td className="p-3">{o.job_title}</td>

                      {/* Offer Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            o.offer_status === "Accepted"
                              ? "bg-green-100 text-green-700"
                              : o.offer_status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : o.offer_status === "Documents Submitted"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {o.offer_status}
                        </span>
                      </td>

                      {/* BGV Status */}
                      <td className="p-3 text-center">
                        {o.bgv_status ? (
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              o.bgv_status === "Cleared"
                                ? "bg-green-100 text-green-700"
                                : o.bgv_status === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {o.bgv_status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Not Started
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center flex gap-2 justify-center">

                        {/* Accept/Reject */}
                        {o.offer_status === "Sent" && (
                          <>
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                              onClick={() => handleOfferResponse(o.id, "accept")}
                            >
                              Accept
                            </button>

                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                              onClick={() => handleOfferResponse(o.id, "reject")}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Generate Link */}
                        {o.offer_status === "Accepted" && (
                          <button
                            className="px-2 py-1 bg-orange-600 text-white rounded text-xs mr-1"
                            onClick={() => generateDocumentLink(o.id)}
                          >
                            Generate Link
                          </button>
                        )}

                        {/* View Documents */}
                        {(o.offer_status === "Accepted" || o.offer_status === "Documents Submitted") && (
                          <button
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-1"
                            onClick={() => viewDocuments(o.id)}
                          >
                            View Docs
                          </button>
                        )}

                        {/* Start BGV */}
                        {(o.offer_status === "Accepted" || o.offer_status === "Documents Submitted") && !o.bgv_status && (
                          <button
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                            onClick={() => startBGV(o.application_id)}
                          >
                            Start BGV
                          </button>
                        )}

                        {/* Manage BGV */}
                        {o.bgv_status && (
                          <button
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                            onClick={() => openBGVModal(o)}
                          >
                            Manage
                          </button>
                        )}

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== SELECTED CANDIDATES ==================== */}
          <h2 className="text-lg font-semibold mb-3">Selected Candidates</h2>

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
                  <td className="p-3">{c.job_title}</td>
                  <td className="p-3 text-center">{c.stage}</td>

                  <td className="p-3 text-center">
                    <button
                      className="px-4 py-1 bg-blue-600 text-white rounded text-sm"
                      onClick={() => {
                        setSelected(c);
                        setOfferForm({
                          ...offerForm,
                          candidate_id: c.id,
                          job_title: c.job_title,
                          department: c.department,
                          email: c.email,
                        });
                        setShowOfferModal(true);
                      }}
                    >
                      Generate Offer
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* ================================================================== */}
          {/*                         OFFER MODAL                               */}
          {/* ================================================================== */}
          {showOfferModal && selected && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 w-[550px] rounded-xl shadow-xl">

                <h2 className="text-lg font-semibold mb-3">
                  Generate Offer – {selected.name}
                </h2>

                {/* FORM */}
                <div className="space-y-3">

                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    placeholder="CTC Offered"
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
                        setOfferForm({
                          ...offerForm,
                          basic_percent: e.target.value,
                        })
                      }
                    />

                    <input
                      type="number"
                      className="border p-2 rounded"
                      placeholder="HRA %"
                      value={offerForm.hra_percent}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          hra_percent: e.target.value,
                        })
                      }
                    />
                  </div>

                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="Location"
                    value={offerForm.location}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        location: e.target.value,
                      })
                    }
                  />

                  <input
                    type="email"
                    className="border p-2 rounded w-full"
                    placeholder="Email"
                    value={offerForm.email}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, email: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    value={offerForm.joining_date}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        joining_date: e.target.value,
                      })
                    }
                  />

                  <textarea
                    className="border p-2 rounded w-full h-20"
                    placeholder="Terms & Conditions"
                    value={offerForm.terms}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, terms: e.target.value })
                    }
                  ></textarea>

                  {/* Attachment */}
                  <input
                    type="file"
                    multiple
                    className="border p-2 rounded w-full"
                    onChange={(e) =>
                      setAttachments(Array.from(e.target.files))
                    }
                  />

                </div>

                <div className="flex justify-between mt-5">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowOfferModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={generateOffer}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                        OFFER PREVIEW MODAL                        */}
          {/* ================================================================== */}
          {showPreview && generatedOffer && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 w-[600px] rounded-xl shadow-lg">

                <h2 className="text-lg font-semibold mb-3">
                  Offer Letter Preview
                </h2>

                <p><b>Candidate:</b> {selected.name}</p>
                <p><b>Role:</b> {selected.job_title}</p>
                <p><b>CTC:</b> ₹{generatedOffer.ctc}</p>
                <p><b>Joining:</b> {generatedOffer.joining_date}</p>

                <p className="mt-3">
                  <b>Terms:</b>
                </p>
                <p className="text-sm">{generatedOffer.terms}</p>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowPreview(false)}
                  >
                    Back
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={sendOffer}
                  >
                    Send Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                          BGV MODAL                                 */}
          {/* ================================================================== */}
          {showBGVModal && selectedBGV && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[450px] shadow-xl">

                <h2 className="text-lg font-semibold mb-4">
                  BGV – {selectedBGV.candidate_name}
                </h2>

                <div className="space-y-3">

                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="Agency Name"
                    value={bgvForm.agency_name}
                    onChange={(e) =>
                      setBgvForm({
                        ...bgvForm,
                        agency_name: e.target.value,
                      })
                    }
                  />

                  <select
                    className="border p-2 rounded w-full"
                    value={bgvForm.status}
                    onChange={(e) =>
                      setBgvForm({ ...bgvForm, status: e.target.value })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Failed">Failed</option>
                  </select>

                  <textarea
                    className="border p-2 rounded w-full h-20"
                    placeholder="Remarks"
                    value={bgvForm.remarks}
                    onChange={(e) =>
                      setBgvForm({ ...bgvForm, remarks: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowBGVModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={updateBGV}
                  >
                    Update
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                      DOCUMENTS MODAL                              */}
          {/* ================================================================== */}
          {showDocuments && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl max-h-[80vh] overflow-y-auto">

                <h2 className="text-lg font-semibold mb-4">
                  📄 Uploaded Documents
                </h2>

                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{doc.document_type}</p>
                          <a 
                            href={`http://localhost:8000/recruitment/offer/documents/file/${doc.file_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            📄 {doc.file_name}
                          </a>
                          <p className="text-xs text-gray-400">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.status === "Uploaded" 
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowDocuments(false)}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                      LINK GENERATION MODAL                        */}
          {/* ================================================================== */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">

                <h2 className="text-lg font-semibold mb-4">
                  🔗 Document Upload Link
                </h2>

                <p className="text-gray-600 mb-4">
                  Share this link with <strong>{linkCandidate}</strong> to upload documents:
                </p>

                <div className="bg-gray-100 p-3 rounded border mb-4">
                  <p className="text-sm font-mono break-all">{generatedLink}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Required Documents:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Aadhaar Card (Front & Back)</li>
                    <li>• PAN Card</li>
                    <li>• Passport Size Photo</li>
                    <li>• Educational Certificates</li>
                    <li>• Experience Certificates</li>
                    <li>• Relieving Letter</li>
                    <li>• Salary Slips (Last 3 months)</li>
                    <li>• Bank Passbook/Statement</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowLinkModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={copyToClipboard}
                  >
                    📋 Copy Link
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
