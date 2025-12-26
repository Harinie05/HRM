import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiArrowLeft, FiUpload, FiEye, FiUser, FiPhone, FiShield } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeMedical() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    blood_group: "",
    height: "",
    weight: "",
    allergies: "",
    chronic_conditions: "",
    medications: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    medical_insurance_provider: "",
    medical_insurance_number: "",
    remarks: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicalData, setMedicalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMedical = async () => {
    try {
      const res = await api.get(`/employee/medical/${id}`);
      setMedicalData(res.data);
      setForm({
        blood_group: res.data.blood_group || "",
        height: res.data.height || "",
        weight: res.data.weight || "",
        allergies: res.data.allergies || "",
        chronic_conditions: res.data.chronic_conditions || "",
        medications: res.data.medications || "",
        emergency_contact_name: res.data.emergency_contact_name || "",
        emergency_contact_phone: res.data.emergency_contact_phone || "",
        emergency_contact_relation: res.data.emergency_contact_relation || "",
        medical_insurance_provider: res.data.medical_insurance_provider || "",
        medical_insurance_number: res.data.medical_insurance_number || "",
        remarks: res.data.remarks || "",
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchMedical();
  }, [id]);

  const submit = async () => {
    const data = new FormData();
    data.append("employee_id", id);
    data.append("blood_group", form.blood_group);
    data.append("height", form.height);
    data.append("weight", form.weight);
    data.append("allergies", form.allergies);
    data.append("chronic_conditions", form.chronic_conditions);
    data.append("medications", form.medications);
    data.append("emergency_contact_name", form.emergency_contact_name);
    data.append("emergency_contact_phone", form.emergency_contact_phone);
    data.append("emergency_contact_relation", form.emergency_contact_relation);
    data.append("medical_insurance_provider", form.medical_insurance_provider);
    data.append("medical_insurance_number", form.medical_insurance_number);
    data.append("remarks", form.remarks);
    if (file) data.append("file", file);

    setLoading(true);
    try {
      if (isEditing && medicalData?.id) {
        await api.put(`/employee/medical/${medicalData.id}`, data);
      } else {
        await api.post("/employee/medical/add", data);
      }
      alert("Medical details saved");
      fetchMedical();
    } catch (err) {
      console.error("Failed to save medical details", err);
      alert("Failed to save medical details");
    }
    setLoading(false);
  };

  return (
    <Layout 
      title="Medical Details" 
      subtitle="Health information and medical records"
    >
      <div className="p-6">
        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate(`/eis/${id}`)}
              className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-sm" />
              Back to Profile
            </button>
          </div>

          <div className="space-y-8">
            {/* Basic Health Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiHeart className="text-red-500" />
                <h3 className="text-lg font-semibold text-primary">Basic Health Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Blood Group</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.blood_group}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Height (cm)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="170"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="70"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Medical History</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Known Allergies</label>
                  <textarea
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="List any food, medication, or environmental allergies..."
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Chronic Conditions</label>
                  <textarea
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="List any chronic conditions like diabetes, hypertension, etc..."
                    value={form.chronic_conditions}
                    onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Current Medications</label>
                  <textarea
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="List current medications and dosages..."
                    value={form.medications}
                    onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="text-blue-500" />
                <h3 className="text-lg font-semibold text-primary">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Contact Name</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name"
                    value={form.emergency_contact_name}
                    onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Phone Number</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                    value={form.emergency_contact_phone}
                    onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Relationship</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.emergency_contact_relation}
                    onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })}
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="text-green-500" />
                <h3 className="text-lg font-semibold text-primary">Medical Insurance</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Insurance Provider</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Insurance company name"
                    value={form.medical_insurance_provider}
                    onChange={(e) => setForm({ ...form, medical_insurance_provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Policy/Member Number</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Policy or member ID"
                    value={form.medical_insurance_number}
                    onChange={(e) => setForm({ ...form, medical_insurance_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Additional Medical Information</label>
              <textarea
                className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Any additional medical remarks, notes, or special considerations..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>

            {/* Medical Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Medical Certificate</label>
              <div className="flex items-center gap-2 mb-2">
                <FiUpload className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-muted mb-3">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
              {medicalData?.certificate_name && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Current Certificate:</span>
                    <button 
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                      onClick={() => {
                        const token = localStorage.getItem('access_token');
                        if (!token) {
                          alert('Authentication token not found. Please login again.');
                          return;
                        }
                        window.open(`http://localhost:8000/employee/medical/certificate/${id}?token=${token}`, '_blank');
                      }}
                    >
                      <FiEye className="text-xs" />
                      {medicalData.certificate_name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Medical Information' : 'Save Medical Information')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

