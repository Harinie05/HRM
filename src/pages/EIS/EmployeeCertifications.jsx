import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>←</span> Back to Profile
          </button>
          <h2 className="text-xl font-semibold text-[#0D3B66]">
            Certifications
          </h2>
        </div>

        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Certification
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <th className="p-3 text-left">Certification</th>
              <th className="p-3 text-left">Issued By</th>
              <th className="p-3 text-left">Expiry</th>
              <th className="p-3 text-center">File</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {certs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No certifications added
                </td>
              </tr>
            )}

            {certs.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.certification}</td>
                <td className="p-3">{c.issued_by || "-"}</td>
                <td className="p-3">{c.expiry_date || "-"}</td>

                <td className="p-3 text-center">
                  {c.file_name ? (
                    <span 
                      className="text-blue-600 cursor-pointer hover:underline"
                      onClick={() => {
                        const token = localStorage.getItem('access_token');
                        if (!token) {
                          alert('Authentication token not found. Please login again.');
                          return;
                        }
                        window.open(`http://localhost:8000/employee/certifications/certificate/${c.id}?token=${token}`, '_blank');
                      }}
                    >
                      View
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="px-3 py-1 text-xs bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCert(c.id)}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">

            <h3 className="text-lg font-semibold">
              {editing ? "Edit Certification" : "Add Certification"}
            </h3>

            <input
              className="border p-2 rounded w-full"
              placeholder="Certification name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Issued by"
              value={form.issued_by}
              onChange={(e) =>
                setForm({ ...form, issued_by: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 rounded w-full"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            />

            <input
              type="file"
              className="border p-2 rounded w-full"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files[0] })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveCert}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
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
