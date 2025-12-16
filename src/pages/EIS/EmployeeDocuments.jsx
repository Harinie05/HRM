import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!id) return;
    try {
      let allDocs = [];
      
      // Fetch education documents
      try {
        const eduRes = await api.get(`/employee/education/${id}`);
        const eduDocs = (eduRes.data || []).filter(e => e.file_name).map(e => ({
          id: `edu-${e.id}`,
          document_type: 'Education Certificate',
          file_name: e.file_name,
          category: 'Education',
          degree: e.degree,
          university: e.university,
          view_url: `/employee/education/certificate/${e.id}`
        }));
        allDocs = [...allDocs, ...eduDocs];
      } catch {}
      
      // Fetch experience documents
      try {
        const expRes = await api.get(`/employee/experience/${id}`);
        const expDocs = (expRes.data || []).filter(e => e.file_name).map(e => ({
          id: `exp-${e.id}`,
          document_type: 'Experience Certificate',
          file_name: e.file_name,
          category: 'Experience',
          company: e.company,
          job_title: e.job_title || e.role,
          view_url: `/employee/experience/document/${e.id}`
        }));
        allDocs = [...allDocs, ...expDocs];
      } catch {}
      
      // Fetch medical documents
      try {
        const medRes = await api.get(`/employee/medical/${id}`);
        if (medRes.data && medRes.data.certificate_name) {
          allDocs.push({
            id: `med-${medRes.data.id}`,
            document_type: 'Medical Certificate',
            file_name: medRes.data.certificate_name,
            category: 'Medical',
            view_url: `/employee/medical/certificate/${id}`
          });
        }
      } catch {}
      
      // Fetch certification documents
      try {
        const certRes = await api.get(`/employee/certifications/${id}`);
        const certDocs = (certRes.data || []).filter(c => c.file_name).map(c => ({
          id: `cert-${c.id}`,
          document_type: 'Certification',
          file_name: c.file_name,
          category: 'Certification',
          certification: c.certification,
          issued_by: c.issued_by,
          view_url: `/employee/certifications/certificate/${c.id}`
        }));
        allDocs = [...allDocs, ...certDocs];
      } catch {}
      
      // Fetch recruitment/onboarding documents
      try {
        const recentRes = await api.get(`/recruitment/onboarding/${id}/documents`);
        const recentDocs = (recentRes.data || []).map(d => ({
          id: `recent-${d.id}`,
          document_type: d.document_type,
          file_name: d.file_name,
          category: 'Onboarding',
          status: d.status,
          uploaded_at: d.uploaded_at,
          view_url: `/recruitment/onboarding/document/${d.id}/view`
        }));
        allDocs = [...allDocs, ...recentDocs];
      } catch {}
      
      setDocs(allDocs);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);

  if (loading) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6">Loading documents...</div>
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
              <h2 className="text-lg font-semibold">All Documents</h2>
            </div>

            {docs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents found</p>
            ) : (
              <div className="space-y-3">
                {docs.map((d) => (
                  <div key={d.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
                    const token = localStorage.getItem('access_token');
                    if (!token) {
                      alert('Authentication token not found. Please login again.');
                      return;
                    }
                    window.open(`http://localhost:8000${d.view_url}?token=${token}`, '_blank');
                  }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            d.category === 'Education' ? 'bg-blue-100 text-blue-700' :
                            d.category === 'Experience' ? 'bg-green-100 text-green-700' :
                            d.category === 'Medical' ? 'bg-red-100 text-red-700' :
                            d.category === 'Certification' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {d.category}
                          </span>
                          <h3 className="font-medium text-blue-600">{d.document_type}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{d.file_name}</p>
                        {d.degree && <p className="text-xs text-gray-500">{d.degree} - {d.university}</p>}
                        {d.company && <p className="text-xs text-gray-500">{d.job_title} at {d.company}</p>}
                        {d.certification && <p className="text-xs text-gray-500">{d.certification} {d.issued_by && `by ${d.issued_by}`}</p>}
                        {d.status && (
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            d.status === "Uploaded" 
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {d.status}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {d.uploaded_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(d.uploaded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
