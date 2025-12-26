import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCreditCard, FiArrowLeft, FiHome } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeBankDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    account_holder_name: "",
    account_type: "Savings",
  });
  const [bankData, setBankData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBankDetails = async () => {
    try {
      const res = await api.get(`/employee/bank-details/${id}`);
      setBankData(res.data);
      setForm({
        bank_name: res.data.bank_name || "",
        account_number: res.data.account_number || "",
        ifsc_code: res.data.ifsc_code || "",
        branch_name: res.data.branch_name || "",
        account_holder_name: res.data.account_holder_name || "",
        account_type: res.data.account_type || "Savings",
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, [id]);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        employee_id: id,
        ...form,
      };

      if (isEditing && bankData?.id) {
        await api.put(`/employee/bank-details/${bankData.id}`, payload);
      } else {
        await api.post("/employee/bank-details/add", payload);
      }
      
      alert("Bank details saved successfully");
      fetchBankDetails();
    } catch (err) {
      console.error("Failed to save bank details", err);
      alert("Failed to save bank details");
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-4 sm:p-6 bg-white border border-black rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
              <FiCreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Bank Details
              </h1>
              <p className="text-gray-600 mb-2">
                Banking information for salary processing
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Secure Banking</span>
                </div>
                <span className="text-sm text-gray-600">Encrypted Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors text-sm border border-black"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        <div className="rounded-xl shadow-sm border border-black p-4 sm:p-6 bg-white">

          <div className="space-y-6">
            {/* Bank Information */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiHome className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bank Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Bank Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="e.g., State Bank of India"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Branch Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Branch location"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account Holder Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Full name as per bank records"
                    value={form.account_holder_name}
                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account Type</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.account_type}
                    onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                  >
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                    <option value="Salary">Salary Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account Number *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Bank account number"
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">IFSC Code *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="e.g., SBIN0001234"
                    value={form.ifsc_code}
                    onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {form.bank_name && form.account_number && (
              <div className="bg-gray-100 border border-black rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Bank Details Summary</h4>
                <div className="text-sm text-gray-800 space-y-1">
                  <p><span className="font-medium">Bank:</span> {form.bank_name}</p>
                  <p><span className="font-medium">Account:</span> {form.account_number}</p>
                  <p><span className="font-medium">IFSC:</span> {form.ifsc_code}</p>
                  <p><span className="font-medium">Branch:</span> {form.branch_name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-black">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-white text-black border border-black rounded-2xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Bank Details' : 'Save Bank Details')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
