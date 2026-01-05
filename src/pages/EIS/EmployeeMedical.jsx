import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiArrowLeft, FiUpload, FiEye, FiUser, FiPhone, FiShield, FiBell, FiCalendar, FiAlertTriangle } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeMedical() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  // Check permissions
  const canView = isAdmin() || hasPermission("view_medical");
  const canAdd = isAdmin() || hasPermission("add_medical_record");
  const canEdit = isAdmin() || hasPermission("edit_medical_record");
  const canViewDetails = isAdmin() || hasPermission("view_medical_details");

  // Show access denied if no view permission
  if (!canView) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHeart className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to view employee medical records.</p>
          </div>
        </div>
      </Layout>
    );
  }
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
    medical_council_registration_number: "",
    medical_council_name: "",
    medical_council_expiry_date: "",
    vaccination_records: [],
    professional_licenses: [],
    license_alert_enabled: true,
    license_alert_days: 30,
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
        medical_council_registration_number: res.data.medical_council_registration_number || "",
        medical_council_name: res.data.medical_council_name || "",
        medical_council_state: res.data.medical_council_state || "",
        medical_council_country: res.data.medical_council_country || "",
        medical_council_issue_date: res.data.medical_council_issue_date || "",
        medical_council_expiry_date: res.data.medical_council_expiry_date || "",
        medical_council_status: res.data.medical_council_status || "Active",
        medical_degree: res.data.medical_degree || "",
        medical_specialization: res.data.medical_specialization || "",
        vaccination_records: res.data.vaccination_records || [],
        professional_licenses: res.data.professional_licenses || [],
        license_alert_enabled: res.data.license_alert_enabled !== undefined ? res.data.license_alert_enabled : true,
        license_alert_days: res.data.license_alert_days || 30,
        remarks: res.data.remarks || "",
      });
      setIsEditing(!!res.data.id);
    } catch {
      // Check for stored medical data in localStorage
      const storageKey = `medical_data_${id}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setForm(parsedData);
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  };

  useEffect(() => {
    fetchMedical();
  }, [id]);

  const submit = async () => {
    // Validate required Medical Council Registration fields
    if (!form.medical_council_registration_number.trim()) {
      showToast("Registration Number is required", "error");
      return;
    }
    if (!form.medical_council_name.trim()) {
      showToast("Council Name is required", "error");
      return;
    }
    if (!form.medical_council_state?.trim()) {
      showToast("State/Province is required", "error");
      return;
    }
    if (!form.medical_council_country?.trim()) {
      showToast("Country is required", "error");
      return;
    }
    if (!form.medical_council_issue_date) {
      showToast("Issue Date is required", "error");
      return;
    }
    if (!form.medical_council_expiry_date) {
      showToast("Expiry Date is required", "error");
      return;
    }
    if (!form.medical_degree?.trim()) {
      showToast("Medical Degree is required", "error");
      return;
    }

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
    data.append("medical_council_registration_number", form.medical_council_registration_number);
    data.append("medical_council_name", form.medical_council_name);
    data.append("medical_council_state", form.medical_council_state || '');
    data.append("medical_council_country", form.medical_council_country || '');
    data.append("medical_council_issue_date", form.medical_council_issue_date || '');
    data.append("medical_council_expiry_date", form.medical_council_expiry_date);
    data.append("medical_council_status", form.medical_council_status || 'Active');
    data.append("medical_degree", form.medical_degree || '');
    data.append("medical_specialization", form.medical_specialization || '');
    data.append("vaccination_records", JSON.stringify(form.vaccination_records));
    data.append("license_alert_enabled", form.license_alert_enabled);
    data.append("license_alert_days", form.license_alert_days);
    data.append("remarks", form.remarks);
    if (file) data.append("file", file);

    setLoading(true);
    try {
      if (isEditing && medicalData?.id) {
        await api.put(`/employee/medical/${id}`, data);
      } else {
        await api.post("/employee/medical/add", data);
      }
      showToast("Medical details saved", "success");
      fetchMedical();
    } catch (err) {
      console.error("Failed to save medical details", err);
      // Save to localStorage as fallback
      const storageKey = `medical_data_${id}`;
      localStorage.setItem(storageKey, JSON.stringify(form));
      showToast("Medical details saved locally", "success");
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiHeart className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Employee Medical
              </h1>
              <p className="text-gray-600 mb-2">
                Health information and medical records
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Medical Profile</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 bg-white text-black border-2 border-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-3xl border border-black shadow-sm p-6">

          <div className="space-y-8">
            {/* Basic Health Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiHeart className="text-black" />
                <h3 className="text-lg font-semibold text-primary">Basic Health Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Blood Group</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="170"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    rows="3"
                    placeholder="List any food, medication, or environmental allergies..."
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Chronic Conditions</label>
                  <textarea
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    rows="3"
                    placeholder="List any chronic conditions like diabetes, hypertension, etc..."
                    value={form.chronic_conditions}
                    onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Current Medications</label>
                  <textarea
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                <FiUser className="text-black" />
                <h3 className="text-lg font-semibold text-primary">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Contact Name</label>
                  <input
                   className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Full name"
                    value={form.emergency_contact_name}
                    onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Phone Number</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Phone number"
                    value={form.emergency_contact_phone}
                    onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Relationship</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                <FiShield className="text-black" />
                <h3 className="text-lg font-semibold text-primary">Medical Insurance</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Insurance Provider</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Insurance company name"
                    value={form.medical_insurance_provider}
                    onChange={(e) => setForm({ ...form, medical_insurance_provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Policy/Member Number</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Policy or member ID"
                    value={form.medical_insurance_number}
                    onChange={(e) => setForm({ ...form, medical_insurance_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Medical Council Registration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="text-black" />
                <h3 className="text-lg font-semibold text-primary">Medical Council Registration Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Medical council registration number"
                    value={form.medical_council_registration_number}
                    onChange={(e) => setForm({ ...form, medical_council_registration_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Council Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Medical council name"
                    value={form.medical_council_name}
                    onChange={(e) => setForm({ ...form, medical_council_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="State or province"
                    value={form.medical_council_state || ''}
                    onChange={(e) => setForm({ ...form, medical_council_state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Country"
                    value={form.medical_council_country || ''}
                    onChange={(e) => setForm({ ...form, medical_council_country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.medical_council_issue_date || ''}
                    onChange={(e) => setForm({ ...form, medical_council_issue_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.medical_council_expiry_date}
                    onChange={(e) => setForm({ ...form, medical_council_expiry_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Medical Degree <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="MBBS, MD, etc."
                    value={form.medical_degree || ''}
                    onChange={(e) => setForm({ ...form, medical_degree: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Specialization
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Cardiology, Surgery, etc."
                    value={form.medical_specialization || ''}
                    onChange={(e) => setForm({ ...form, medical_specialization: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Registration Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.medical_council_status || 'Active'}
                    onChange={(e) => setForm({ ...form, medical_council_status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                    <option value="Renewed">Renewed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vaccination Records */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiHeart className="text-black" />
                <h3 className="text-lg font-semibold text-primary">Vaccination Records</h3>
              </div>
              <div className="space-y-4">
                {form.vaccination_records.map((vaccine, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-300 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Vaccine</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                        value={vaccine.vaccine}
                        onChange={(e) => {
                          const updated = [...form.vaccination_records];
                          updated[index].vaccine = e.target.value;
                          setForm({ ...form, vaccination_records: updated });
                        }}
                      >
                        <option value="">Select vaccine</option>
                        <option value="Hepatitis B">Hepatitis B</option>
                        <option value="COVID-19">COVID-19</option>
                        <option value="Influenza">Influenza</option>
                        <option value="Tetanus">Tetanus</option>
                        <option value="MMR">MMR</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                        value={vaccine.date}
                        onChange={(e) => {
                          const updated = [...form.vaccination_records];
                          updated[index].date = e.target.value;
                          setForm({ ...form, vaccination_records: updated });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Status</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                        value={vaccine.status}
                        onChange={(e) => {
                          const updated = [...form.vaccination_records];
                          updated[index].status = e.target.value;
                          setForm({ ...form, vaccination_records: updated });
                        }}
                      >
                        <option value="">Select status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.vaccination_records.filter((_, i) => i !== index);
                          setForm({ ...form, vaccination_records: updated });
                        }}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      vaccination_records: [...form.vaccination_records, { vaccine: "", date: "", status: "" }]
                    });
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Add Vaccination Record
                </button>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Additional Medical Information</label>
              <textarea
                className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                />
              </div>
              <p className="text-xs text-muted mb-3">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
              {medicalData?.certificate_name && (
                <div className="p-3 bg-gray-100 border border-black rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Current Certificate:</span>
                    <button 
                      className="inline-flex items-center gap-1 text-black hover:text-gray-700 transition-colors text-sm"
                      onClick={() => {
                        if (!canViewDetails) return;
                        const token = localStorage.getItem('access_token');
                        if (!token) {
                          showToast('Authentication token not found. Please login again.', "error");
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

          <div className="flex justify-end mt-8 pt-6 border-t border-black">
            {(canAdd || canEdit) && (
              <button
                onClick={submit}
                disabled={loading}
                className="px-6 py-3 bg-white text-black border border-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Medical Information' : 'Save Medical Information')}
              </button>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </Layout>
  );
}

