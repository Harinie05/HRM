import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeBankDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    account_type: "Savings",
    swift_code: "",
    bank_address: "",
    bank_document: "",
    document_name: "",
  });
  const [bankData, setBankData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchBankDetails = async () => {
    try {
      const res = await api.get(`/bank-details/${id}`);
      setBankData(res.data);
      setForm({
        account_holder_name: res.data.account_holder_name || "",
        bank_name: res.data.bank_name || "",
        account_number: res.data.account_number || "",
        ifsc_code: res.data.ifsc_code || "",
        branch_name: res.data.branch_name || "",
        account_type: res.data.account_type || "Savings",
        swift_code: res.data.swift_code || "",
        bank_address: res.data.bank_address || "",
        bank_document: res.data.bank_document || "",
        document_name: res.data.document_name || "",
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, [id]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm({
          ...form,
          bank_document: reader.result,
          document_name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async () => {
    const data = new FormData();
    Object.keys(form).forEach(key => {
      data.append(key, form[key]);
    });
    
    try {
      await api.post(`/bank-details/${id}`, data);
      alert("Bank details saved successfully");
      fetchBankDetails();
    } catch (err) {
      console.error("Failed to save bank details", err);
      alert("Failed to save bank details");
    }
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
              <h2 className="text-lg font-semibold">Bank Details</h2>
            </div>

            <div className="space-y-6">
              {/* Account Information */}
              <div>
                <h3 className="text-md font-medium mb-3 text-gray-700">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Account Holder Name</label>
                    <input
                      placeholder="Full name as per bank records"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.account_holder_name}
                      onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                    <input
                      placeholder="e.g., State Bank of India"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
                    <input
                      placeholder="Bank account number"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Account Type</label>
                    <select
                      className="border p-3 rounded-lg w-full"
                      value={form.account_type}
                      onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Salary">Salary</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-md font-medium mb-3 text-gray-700">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">IFSC Code</label>
                    <input
                      placeholder="e.g., SBIN0001234"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.ifsc_code}
                      onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Branch Name</label>
                    <input
                      placeholder="Bank branch name"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.branch_name}
                      onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">SWIFT Code (Optional)</label>
                    <input
                      placeholder="For international transfers"
                      type="text"
                      className="border p-3 rounded-lg w-full"
                      value={form.swift_code}
                      onChange={(e) => setForm({ ...form, swift_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Bank Address</label>
                    <textarea
                      placeholder="Complete bank branch address"
                      className="border p-3 rounded-lg w-full"
                      rows="3"
                      value={form.bank_address}
                      onChange={(e) => setForm({ ...form, bank_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="text-md font-medium mb-3 text-gray-700">Bank Document</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Upload Bank Document (Passbook/Cheque/Bank Statement)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="border p-3 rounded-lg w-full"
                    />
                  </div>
                  {form.document_name && (
                    <div className="text-sm text-green-600">
                      📄 {form.document_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Summary */}
              {form.account_holder_name && form.bank_name && (
                <div>
                  <h3 className="text-md font-medium mb-3 text-gray-700">Account Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Account Holder:</strong> {form.account_holder_name}</div>
                      <div><strong>Bank:</strong> {form.bank_name}</div>
                      <div><strong>Account Number:</strong> {form.account_number ? `****${form.account_number.slice(-4)}` : ''}</div>
                      <div><strong>IFSC:</strong> {form.ifsc_code}</div>
                      <div><strong>Branch:</strong> {form.branch_name}</div>
                      <div><strong>Account Type:</strong> {form.account_type}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={submit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                {isEditing ? 'Update Bank Details' : 'Save Bank Details'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}