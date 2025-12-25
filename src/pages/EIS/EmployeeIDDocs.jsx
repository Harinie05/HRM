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
    <Layout 
      title="ID & Verification Documents" 
      subtitle="Identity documents and verification status"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-sm" />
            Back to Profile
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiUpload className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upload New Document</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>
            
            <button 
              onClick={upload} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!type || !file}
            >
              <FiUpload className="text-sm" />
              Upload Document
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {docs.length === 0 ? (
            <div className="p-12 text-center">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h3>
              <p className="text-gray-500">Upload identity documents for verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Document Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">File Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiFileText className="text-gray-400" />
                          <span className="font-medium text-gray-900">{d.document_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{d.file_name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          d.status === "Verified" 
                            ? "bg-green-100 text-green-800"
                            : d.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {d.status === "Uploaded" && (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => verify(d.id, "Verified")} 
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                            >
                              <FiCheck className="text-xs" />
                              Verify
                            </button>
                            <button 
                              onClick={() => verify(d.id, "Rejected")} 
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              <FiX className="text-xs" />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}