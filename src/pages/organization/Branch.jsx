import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function Branch() {
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    branch_name: "",
    branch_code: "",
    contact_person: "",
    contact_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);

  // Permission checks
  const canView = isAdmin() || hasPermission("view_branch");
  const canAdd = isAdmin() || hasPermission("add_branch");

  // Block access if no view permission
  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-black p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have permission to view Branch / Unit.</p>
      </div>
    );
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/organization/branch");
        if (res.data) setForm(res.data);
      } catch (err) {
        console.log("Branch not set yet", err);
      }
    }
    fetchData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!canAdd) {
      showToast("You do not have permission to save branch", "error");
      return;
    }
    
    setLoading(true);
    try {
      await api.post("/organization/branch", form);
      showToast("Branch / Unit Saved Successfully!", "success");
    } catch (err) {
      showToast('Failed to save branch', "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="px-4 pt-6 border-b-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <svg className="h-5 w-5" style={{
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Branch / Unit Setup</h2>
        </div>
        <p className="text-sm text-gray-600 mt-2">Configure branch locations and contact details</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch / Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="branch_name"
              value={form.branch_name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="e.g., Coimbatore Unit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="branch_code"
              value={form.branch_code}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="e.g., CBE01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="Branch manager name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="branch@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="City name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="State name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="Postal code"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
            style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
              border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
            }}
            placeholder="Complete branch address"
          />
        </div>

        {canAdd && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              style={{
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
      <Toast toast={toast} hideToast={hideToast} />
    </>
  );
}
