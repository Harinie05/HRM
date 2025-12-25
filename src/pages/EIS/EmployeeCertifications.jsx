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
    <Layout 
      title="Certifications" 
      subtitle="Professional certifications and credentials"
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

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-sm" />
            Add Certification
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Certification</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Issued By</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Expiry Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Certificate</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
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
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.certification}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.issued_by || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {c.expiry_date ? (
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <FiCalendar className="text-xs" />
                          <span className="text-sm">{c.expiry_date}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {c.file_name ? (
                        <button 
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={() => {
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              alert('Authentication token not found. Please login again.');
                              return;
                            }
                            window.open(`http://localhost:8000/employee/certifications/certificate/${c.id}?token=${token}`, '_blank');
                          }}
                        >
                          <FiEye className="text-sm" />
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                        >
                          <FiEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCert(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <FiTrash2 className="text-xs" />
                          Delete
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <FiAward className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Certification" : "Add Certification"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Amazon Web Services"
                    value={form.issued_by}
                    onChange={(e) => setForm({ ...form, issued_by: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCert}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
