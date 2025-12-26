import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiAward, FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiEye, FiUpload, FiCalendar } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeCertifications() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();

  const [certs, setCerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    issued_by: "",
    expiry: "",
    file: null,
  });

  // ---------------- FETCH CERTIFICATIONS ----------------
  const fetchCerts = async () => {
    try {
      const res = await api.get(`/employee/certifications/${id}`);
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
      data.append("employee_id", id);
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
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiAward className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Certifications
              </h1>
              <p className="text-gray-600 mb-2">
                Professional certifications and credentials
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{certs.length} Active Records</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-white text-black border-2 border-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Add Certification
          </button>
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

        {/* Certifications Table */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Certification</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issued By</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
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
                  <tr key={c.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 border border-black rounded-lg flex items-center justify-center mr-3">
                          <FiAward className="w-4 h-4 text-black" />
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
                      {c.file_name ? (
                        <button 
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              alert('Authentication token not found. Please login again.');
                              return;
                            }
                            window.open(`http://localhost:8000/employee/certifications/certificate/${c.id}?token=${token}`, '_blank');
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
                        <button
                          onClick={() => openEdit(c)}
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                        >
                          <FiEdit className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteCert(c.id)}
                          className="group relative p-2 text-black hover:text-gray-700 hover:bg-gray-100 border border-black rounded-lg transition-all duration-200"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
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
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., Amazon Web Services"
                    value={form.issued_by}
                    onChange={(e) => setForm({ ...form, issued_by: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-black rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCert}
                  className="px-6 py-3 bg-white text-black border border-black rounded-xl hover:bg-gray-100 transition-colors font-medium shadow-lg"
                >
                  {editing ? "Update" : "Save"} Certification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
