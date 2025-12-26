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
    <Layout 
      title="Bank Details" 
      subtitle="Banking information for salary processing"
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

          <div className="space-y-6">
            {/* Bank Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiHome className="text-blue-500" />
                <h3 className="text-lg font-semibold text-primary">Bank Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Bank Name *</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., State Bank of India"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Branch Name *</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Branch location"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="text-green-500" />
                <h3 className="text-lg font-semibold text-primary">Account Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account Holder Name *</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name as per bank records"
                    value={form.account_holder_name}
                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account Type</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bank account number"
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">IFSC Code *</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., SBIN0001234"
                    value={form.ifsc_code}
                    onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {form.bank_name && form.account_number && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Bank Details Summary</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Bank:</span> {form.bank_name}</p>
                  <p><span className="font-medium">Account:</span> {form.account_number}</p>
                  <p><span className="font-medium">IFSC:</span> {form.ifsc_code}</p>
                  <p><span className="font-medium">Branch:</span> {form.branch_name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Bank Details' : 'Save Bank Details')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
