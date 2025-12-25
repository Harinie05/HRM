import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiEye } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

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
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FiFileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Documents</h1>
                  <p className="text-gray-600 mt-1">Employee document repository</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{docs.length}</div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
                <button 
                  onClick={() => navigate(`/eis/${id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <FiArrowLeft size={16} />
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            {docs.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg font-medium mb-2">No documents found</p>
                <p className="text-gray-500">Documents will appear here once uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((d) => (
                  <div 
                    key={d.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      const token = localStorage.getItem('access_token');
                      if (!token) {
                        alert('Authentication token not found. Please login again.');
                        return;
                      }
                      window.open(`http://localhost:8000${d.view_url}?token=${token}`, '_blank');
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        d.category === 'Education' ? 'bg-blue-100 text-blue-700' :
                        d.category === 'Experience' ? 'bg-green-100 text-green-700' :
                        d.category === 'Medical' ? 'bg-red-100 text-red-700' :
                        d.category === 'Certification' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {d.category}
                      </span>
                      <FiEye className="text-gray-400 group-hover:text-blue-600 transition-colors" size={16} />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {d.document_type}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 truncate">{d.file_name}</p>
                    
                    {d.degree && (
                      <p className="text-xs text-gray-500 mb-2">{d.degree} - {d.university}</p>
                    )}
                    {d.company && (
                      <p className="text-xs text-gray-500 mb-2">{d.job_title} at {d.company}</p>
                    )}
                    {d.certification && (
                      <p className="text-xs text-gray-500 mb-2">
                        {d.certification} {d.issued_by && `by ${d.issued_by}`}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      {d.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          d.status === "Uploaded" 
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {d.status}
                        </span>
                      )}
                      {d.uploaded_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(d.uploaded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
