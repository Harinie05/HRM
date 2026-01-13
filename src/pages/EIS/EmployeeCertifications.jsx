import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiAward, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiEye, FiUpload, FiCalendar } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeCertifications() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [certs, setCerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const canView = true;
  const canAdd = true;
  const canEdit = true;
  const canDelete = true;
  const canViewDetails = true;

  const [form, setForm] = useState({
    name: "",
    issued_by: "",
    expiry: "",
    file: null,
  });

  // ---------------- FETCH CERTIFICATIONS ----------------
  const fetchCerts = async () => {
    try {
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      const res = await api.get(`/employee/certifications/${numericId}`);
      setCerts(res.data || []);
    } catch (err) {
      console.error("Failed to load certifications", err);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, [id]);

  // ---------------- FORM HANDLERS ----------------
  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", issued_by: "", expiry: "", file: null });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.certification,
      issued_by: c.issued_by || "",
      expiry: c.expiry_date || "",
      file: null,
    });
    setShowForm(true);
  };

  const saveCert = async () => {
    try {
      const data = new FormData();
      // Extract numeric ID from 'user_6' format
      const numericId = id.replace('user_', '');
      data.append("employee_id", numericId);
      data.append("name", form.name);
      data.append("issued_by", form.issued_by);
      data.append("expiry", form.expiry);

      if (form.file) {
        data.append("file", form.file);
      }

      if (editing) {
        await api.put(`/employee/certifications/${editing.id}`, data);
      } else {
        await api.post("/employee/certifications/add", data);
      }

      setShowForm(false);
      fetchCerts();
    } catch (err) {
      console.error("Failed to save certification", err);
    }
  };

  const deleteCert = async (certId) => {
    if (!window.confirm("Delete this certification?")) return;

    try {
      await api.delete(`/employee/certifications/${certId}`);
      fetchCerts();
    } catch (err) {
      console.error("Failed to delete certification", err);
    }
  };

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiAward className="h-5 h-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Certifications</h1>
                <p className="text-gray-600 text-sm mb-1">Professional certifications and credentials</p>
                <p className="text-gray-500 text-xs">{certs.length} Active Records • Real-time Updates</p>
              </div>
            </div>
            {canAdd && (
              <button
                onClick={openAdd}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <FiPlus className="w-4 h-4" />
                Add Certification
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border"
            style={{
              backgroundColor: 'var(--primary-color, #4575b5)',
              color: 'white',
              borderColor: 'var(--primary-color, #4575b5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
              e.target.style.borderColor = 'var(--secondary-color, #6b7280)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
              e.target.style.borderColor = 'var(--primary-color, #4575b5)';
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Certifications Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Certification</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issued By</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {certs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <FiAward className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications</h3>
                      <p className="text-gray-500">Add professional certifications and credentials.</p>
                    </td>
                  </tr>
                )}

                {certs.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                        }}>
                          <FiAward className="w-4 h-4" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div className="font-medium text-gray-900">{c.certification}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.issued_by || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {c.expiry_date ? (
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <FiCalendar className="w-3 h-3" />
                          <span className="text-sm">{c.expiry_date}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {c.file_name && canViewDetails ? (
                        <button 
                          className="group relative p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              showToast('Authentication token not found. Please login again.', "error");
                              return;
                            }
                            window.open(`${api.defaults.baseURL}/employee/certifications/certificate/${c.id}?token=${token}`, '_blank');
                          }}
                        >
                          <FiEye className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            View
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(c)}
                            className="group relative p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Edit
                            </span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteCert(c.id)}
                            className="group relative p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {certs.length === 0 ? (
              <div className="p-6 text-center">
                <FiAward className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications</h3>
                <p className="text-gray-500">Add professional certifications and credentials.</p>
              </div>
            ) : (
              certs.map((c) => (
                <div key={c.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                      }}>
                        <FiAward className="w-4 h-4" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div className="font-medium text-gray-900">{c.certification}</div>
                    </div>
                    {c.file_name && canViewDetails && (
                      <button 
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        onClick={() => {
                          const token = localStorage.getItem('access_token');
                          if (!token) {
                            showToast('Authentication token not found. Please login again.', "error");
                            return;
                          }
                          window.open(`${api.defaults.baseURL}/employee/certifications/certificate/${c.id}?token=${token}`, '_blank');
                        }}
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Issued By:</span>
                      <span className="text-sm text-gray-600">{c.issued_by || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Expiry Date:</span>
                      <span className="text-sm text-gray-600">
                        {c.expiry_date ? (
                          <div className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {c.expiry_date}
                          </div>
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(c)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteCert(c.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center">
                  <FiAward className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Certification" : "Add Certification"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., Amazon Web Services"
                    value={form.issued_by}
                    onChange={(e) => setForm({ ...form, issued_by: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Document</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCert}
                  className="px-6 py-3 text-white rounded-xl transition-colors font-medium shadow-lg"
                  style={{
                    backgroundColor: 'var(--primary-color, #4575b5)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }}
                >
                  {editing ? "Update" : "Save"} Certification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}