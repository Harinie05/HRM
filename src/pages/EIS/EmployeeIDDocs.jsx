import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6">Loading ID documents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate(`/eis/${id}`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>←</span> Back to Profile
              </button>
              <h2 className="text-lg font-semibold">ID & Verification Documents</h2>
            </div>

            <div className="flex gap-2 mb-6">
              <select
                className="border p-2 rounded"
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
              <input 
                type="file" 
                className="border p-2 rounded"
                onChange={(e) => setFile(e.target.files[0])} 
              />
              <button 
                onClick={upload} 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={!type || !file}
              >
                Upload
              </button>
            </div>

            {docs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No ID documents uploaded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Document Type</th>
                      <th className="p-3 text-left">File Name</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="p-3">{d.document_type}</td>
                        <td className="p-3 text-sm text-gray-600">{d.file_name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            d.status === "Verified" 
                              ? "bg-green-100 text-green-700"
                              : d.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          {d.status === "Uploaded" && (
                            <>
                              <button 
                                onClick={() => verify(d.id, "Verified")} 
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                Verify
                              </button>
                              <button 
                                onClick={() => verify(d.id, "Rejected")} 
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
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
      </div>
    </div>
  );
}

