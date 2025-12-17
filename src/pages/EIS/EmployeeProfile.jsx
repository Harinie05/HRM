import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Function to get authenticated image URL
  const getAuthenticatedImageUrl = async (docId) => {
    try {
      const response = await api.get(`/recruitment/onboarding/document/${docId}/view`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Failed to load image:', error);
      return null;
    }
  };

  // ---------------- FETCH EMPLOYEE PROFILE ----------------
  const fetchEmployee = async () => {
    try {
      // Get all onboarded employees and find the one with matching application_id
      const res = await api.get('/recruitment/onboarding/list');
      const employees = res.data || [];
      const emp = employees.find(e => e.application_id.toString() === id);
      
      if (emp) {
        setEmployee(emp);
        // Fetch documents for this employee
        try {
          const docsRes = await api.get(`/recruitment/onboarding/${emp.application_id}/documents`);
          const docs = docsRes.data || [];
          setDocuments(docs);
          
          // Find the most recent photo document (latest uploaded)
          const photoDocs = docs.filter(doc => doc.document_type === 'photo');
          if (photoDocs.length > 0) {
            // Get the most recent photo by uploaded_at date
            const latestPhoto = photoDocs.reduce((latest, current) => 
              new Date(current.uploaded_at) > new Date(latest.uploaded_at) ? current : latest
            );
            
            // Try authenticated URL first, fallback to direct URL
            try {
              const imageUrl = await getAuthenticatedImageUrl(latestPhoto.id);
              if (imageUrl) {
                setPhotoUrl(imageUrl);
              }
            } catch {
              // Fallback to direct URL with token
              const token = localStorage.getItem('token');
              setPhotoUrl(`http://localhost:8000/recruitment/onboarding/document/${latestPhoto.id}/view?token=${token}`);
            }
          }
        } catch (docErr) {
          console.log('No documents found for employee');
        }
      } else {
        console.error('Employee not found');
      }
    } catch (err) {
      console.error("Failed to load employee profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6">Loading employee profile...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6">Employee not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* ================= PROFILE HEADER ================= */}
          <div className="bg-white rounded-lg shadow p-6 flex gap-6">
            {/* Photo */}
            <div 
              className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 relative cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden"
              onClick={() => setShowPhotoUpload(true)}
            >
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="Employee Photo" 
                  className="w-full h-full object-cover"
                  onError={() => setPhotoUrl(null)}
                />
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-1">+</div>
                  <div className="text-xs">Add Photo</div>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#0D3B66]">
                {employee.candidate_name}
              </h1>
              <p className="text-gray-600">
                {employee.job_title} · {employee.department}
              </p>

              <div className="mt-2 text-sm text-gray-700 space-y-1">
                <p><b>Employee Code:</b> {employee.employee_id}</p>
                <p><b>Joining Date:</b> {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</p>
                <p><b>Status:</b>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      employee.status === "Active" || employee.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {employee.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Link
                to={`/eis/${employee.application_id}/documents`}
                className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-center block"
              >
                View All Documents
              </Link>
            </div>
          </div>

          {/* ================= EMPLOYMENT DETAILS ================= */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Employment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><b>Email:</b> {employee.candidate_email || 'N/A'}</p>
              <p><b>Work Location:</b> {employee.work_location}</p>
              <p><b>Reporting Manager:</b> {employee.reporting_manager}</p>
              <p><b>Work Shift:</b> {employee.work_shift}</p>
              <p><b>Probation Period:</b> {employee.probation_period}</p>
              <p><b>Application ID:</b> {employee.application_id}</p>
            </div>
          </div>

          {/* ================= EIS MODULES NAVIGATION ================= */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Employee Information Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link
                to={`/eis/${employee.application_id}/education`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🎓</div>
                <div className="font-medium">Education</div>
                <div className="text-xs text-gray-500">Academic Details</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/experience`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">💼</div>
                <div className="font-medium">Experience</div>
                <div className="text-xs text-gray-500">Work History</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/skills`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-medium">Skills</div>
                <div className="text-xs text-gray-500">Technical Skills</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/certifications`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-medium">Certifications</div>
                <div className="text-xs text-gray-500">Professional Certs</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/family`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                <div className="font-medium">Family</div>
                <div className="text-xs text-gray-500">Family Details</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/medical`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏥</div>
                <div className="font-medium">Medical</div>
                <div className="text-xs text-gray-500">Health Records</div>
              </Link>
              

              
              <Link
                to={`/eis/${employee.application_id}/id-docs`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🆔</div>
                <div className="font-medium">ID Documents</div>
                <div className="text-xs text-gray-500">Identity Docs</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/salary`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium">Salary</div>
                <div className="text-xs text-gray-500">Compensation</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/bank-details`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏦</div>
                <div className="font-medium">Bank Details</div>
                <div className="text-xs text-gray-500">Banking Info</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/reporting`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">Reporting</div>
                <div className="text-xs text-gray-500">Manager & Hierarchy</div>
              </Link>
              
              <Link
                to={`/eis/${employee.application_id}/exit`}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🚪</div>
                <div className="font-medium">Exit</div>
                <div className="text-xs text-gray-500">Exit Process</div>
              </Link>
            </div>
          </div>



          {/* Photo Upload Modal */}
          {showPhotoUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Upload Employee Photo</h3>
                
                {previewUrl && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="border p-2 rounded w-full mb-4"
                />
                
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setShowPhotoUpload(false);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedFile) {
                        const formData = new FormData();
                        formData.append('candidate_id', employee.application_id);
                        formData.append('document_type', 'photo');
                        formData.append('file', selectedFile);
                        
                        api.post('/recruitment/onboarding/upload-document', formData)
                          .then(() => {
                            // Set the photo URL immediately to the preview
                            setPhotoUrl(previewUrl);
                            setShowPhotoUpload(false);
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            // Don't call fetchEmployee() to avoid overwriting the photo
                          })
                          .catch(err => console.error('Photo upload failed', err));
                      }
                    }}
                    disabled={!selectedFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    OK
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
