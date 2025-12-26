import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCreditCard, FiArrowLeft, FiUpload, FiCheck, FiX, FiFileText } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeIDDocs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/employee/id-docs/${id}`);
      setDocs(res.data || []);
    } catch (err) {
      console.error("Failed to load ID documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const upload = async () => {
    if (!type || !file || !id) return;
    
    try {
      const data = new FormData();
      data.append("employee_id", id);
      data.append("document_type", type);
      data.append("file", file);

      await api.post("/employee/id-docs/upload", data);
      setType("");
      setFile(null);
      fetchDocs();
    } catch (err) {
      console.error("Failed to upload ID document", err);
    }
  };

  const verify = async (docId, status) => {
    try {
      await api.post(`/employee/id-docs/verify/${docId}?action=${status}`);
      fetchDocs();
    } catch (err) {
      console.error("Failed to verify document", err);
    }
  };

  if (loading) {
    return (
      <Layout title="ID Documents" subtitle="Loading identity documents...">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiCreditCard className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                ID & Verification Documents
              </h1>
              <p className="text-gray-600 mb-2">
                Identity documents and verification status
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{docs.length} Active Records</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
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

        {/* Upload Section */}
        <div className="bg-white rounded-3xl border border-black shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiUpload className="text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Upload New Document</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select Document Type</option>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>
            
            <button 
              onClick={upload} 
              className="flex items-center gap-2 bg-white text-black border border-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!type || !file}
            >
              <FiUpload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
                {docs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h3>
                      <p className="text-gray-500">Upload identity documents for verification.</p>
                    </td>
                  </tr>
                )}

                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiFileText className="w-4 h-4 text-black" />
                        </div>
                        <div className="font-medium text-gray-900">{d.document_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{d.file_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-black ${
                        d.status === "Verified" 
                          ? "bg-gray-100 text-black"
                          : d.status === "Rejected"
                          ? "bg-gray-100 text-black"
                          : "bg-gray-100 text-black"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {d.status === "Uploaded" && (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => verify(d.id, "Verified")} 
                            className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          >
                            <FiCheck className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Verify
                            </span>
                          </button>
                          <button 
                            onClick={() => verify(d.id, "Rejected")} 
                            className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          >
                            <FiX className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Reject
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
