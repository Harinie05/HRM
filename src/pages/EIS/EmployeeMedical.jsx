import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
            </div>
      <h2 className="text-lg font-semibold mb-4">Medical Details</h2>

      <div className="space-y-6">
        {/* Basic Health Information */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Basic Health Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Blood Group (e.g., A+, B-, O+)"
              className="border p-3 rounded-lg"
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            />
            <input
              placeholder="Height (cm)"
              type="number"
              className="border p-3 rounded-lg"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
            <input
              placeholder="Weight (kg)"
              type="number"
              className="border p-3 rounded-lg"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </div>
        </div>

        {/* Medical History */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Medical History</h3>
          <div className="grid grid-cols-1 gap-4">
            <textarea
              placeholder="Known Allergies (food, medication, environmental)"
              className="border p-3 rounded-lg h-20"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
            <textarea
              placeholder="Chronic Conditions (diabetes, hypertension, etc.)"
              className="border p-3 rounded-lg h-20"
              value={form.chronic_conditions}
              onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
            />
            <textarea
              placeholder="Current Medications"
              className="border p-3 rounded-lg h-20"
              value={form.medications}
              onChange={(e) => setForm({ ...form, medications: e.target.value })}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Emergency Contact</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              placeholder="Emergency Contact Name"
              className="border p-3 rounded-lg"
              value={form.emergency_contact_name}
              onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
            />
            <input
              placeholder="Emergency Contact Phone"
              className="border p-3 rounded-lg"
              value={form.emergency_contact_phone}
              onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
            />
            <input
              placeholder="Relation (spouse, parent, sibling)"
              className="border p-3 rounded-lg"
              value={form.emergency_contact_relation}
              onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })}
            />
          </div>
        </div>

        {/* Insurance Information */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Medical Insurance</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Insurance Provider"
              className="border p-3 rounded-lg"
              value={form.medical_insurance_provider}
              onChange={(e) => setForm({ ...form, medical_insurance_provider: e.target.value })}
            />
            <input
              placeholder="Policy/Member Number"
              className="border p-3 rounded-lg"
              value={form.medical_insurance_number}
              onChange={(e) => setForm({ ...form, medical_insurance_number: e.target.value })}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Additional Information</h3>
          <textarea
            placeholder="Additional medical remarks or notes"
            className="border p-3 rounded-lg h-24 w-full"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>

        {/* Medical Certificate Upload */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Medical Certificate</h3>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-3 rounded-lg w-full"
          />
          {medicalData?.certificate_name && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Current Certificate: </span>
              <span 
                className="text-blue-600 cursor-pointer hover:underline text-sm font-medium"
                onClick={() => {
                  const token = localStorage.getItem('access_token');
                  if (!token) {
                    alert('Authentication token not found. Please login again.');
                    return;
                  }
                  window.open(`http://localhost:8000/employee/medical/certificate/${id}?token=${token}`, '_blank');
                }}
              >
                {medicalData.certificate_name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={submit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Medical Information' : 'Save Medical Information')}
        </button>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}

