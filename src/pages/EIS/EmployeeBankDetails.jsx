import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCreditCard, FiArrowLeft, FiHome, FiCheck, FiX, FiClock } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeBankDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
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

  // Check permissions
  const canView = true;
  const canAdd = true;
  const canEdit = true;
  const canVerify = isAdmin() || hasPermission("verify_bank_details");

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

  // Access denied screen removed
  // if (!canView) {
  //   return (
  //     <Layout>
  //       <div className="flex items-center justify-center min-h-[60vh]">
  //         <div className="text-center">
  //           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //             <FiCreditCard className="w-8 h-8 text-red-600" />
  //           </div>
  //           <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
  //           <p className="text-gray-500">You don't have permission to view employee bank details.</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

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
      
      showToast("Bank details saved successfully", "success");
      fetchBankDetails();
    } catch (err) {
      console.error("Failed to save bank details", err);
      showToast("Failed to save bank details", "error");
    }
    setLoading(false);
  };

  const verifyBankDetails = async (status, remarks = "") => {
    try {
      const formData = new FormData();
      formData.append('verification_status', status);
      formData.append('verification_remarks', remarks);
      
      await api.put(`/employee/bank-details/verify/${id}`, formData);
      showToast(`Bank details ${status} successfully`, "success");
      fetchBankDetails();
    } catch (err) {
      console.error("Failed to verify bank details", err);
      showToast("Failed to verify bank details", "error");
    }
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Bank Details Summary</h4>
                  {bankData?.verification_status && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      bankData.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                      bankData.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bankData.verification_status === 'verified' && <FiCheck className="w-4 h-4" />}
                      {bankData.verification_status === 'rejected' && <FiX className="w-4 h-4" />}
                      {bankData.verification_status === 'pending' && <FiClock className="w-4 h-4" />}
                      {bankData.verification_status.charAt(0).toUpperCase() + bankData.verification_status.slice(1)}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-800 space-y-1">
                  <p><span className="font-medium">Bank:</span> {form.bank_name}</p>
                  <p><span className="font-medium">Account:</span> {form.account_number}</p>
                  <p><span className="font-medium">IFSC:</span> {form.ifsc_code}</p>
                  <p><span className="font-medium">Branch:</span> {form.branch_name}</p>
                </div>
                {bankData?.verification_remarks && (
                  <div className="mt-3 p-2 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-600"><span className="font-medium">Remarks:</span> {bankData.verification_remarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-black">
            <div className="flex gap-3">
              {canVerify && bankData?.id && bankData?.verification_status !== 'verified' && (
                <>
                  <button
                    onClick={() => verifyBankDetails('verified')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiCheck className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      const remarks = prompt('Enter rejection remarks (optional):');
                      if (remarks !== null) verifyBankDetails('rejected', remarks);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
            <div>
              {(canAdd || canEdit) && (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="px-6 py-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  style={{
                    backgroundColor: loading ? '#d1d5db' : 'var(--primary-color, #4575b5)'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                    }
                  }}
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Bank Details' : 'Save Bank Details')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}
