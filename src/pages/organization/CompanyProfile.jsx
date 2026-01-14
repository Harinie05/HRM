import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function CompanyProfile() {
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    website: "",
    organization_type: "",
    contact_person: "",
    contact_number: "",
    contact_email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // Permission checks
  const canView = isAdmin() || hasPermission("view_company_profile");
  const canAdd = isAdmin() || hasPermission("add_company_profile");

  // Block access if no view permission
  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border-0 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have permission to view Company Profile.</p>
      </div>
    );
  }

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Loading company profile data');
        const res = await api.get("/organization/company-profile");
        console.log('Company profile loaded:', res.data);
        setForm(res.data);
      } catch (err) {
        console.log("Company profile not set yet", err);
      }
    }
    
    // Only fetch data if user has permission
    if (canView) {
      fetchData();
    }
  }, [canView]);

  function handleChange(e) {
    console.log(`Company profile field changed: ${e.target.name} = ${e.target.value}`);
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!canAdd) {
      showToast("You do not have permission to save company profile", "error");
      return;
    }
    
    setLoading(true);
    try {
      console.log('Saving company profile:', form);
      await api.post("/organization/company-profile", form);
      console.log('Company profile saved successfully');
      
      // Update localStorage for sidebar
      localStorage.setItem("hospital_name", form.name);
      window.dispatchEvent(new Event('organization-updated'));
      
      showToast("Company Profile Saved", "success");
    } catch (err) {
      console.error('Failed to save company profile:', err);
      showToast("Failed to save company profile", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <svg className="h-5 w-5" style={{
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
            <p className="text-sm text-gray-600">Configure your organization's basic information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              placeholder="Enter company name"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              placeholder="https://www.company.com"
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type</label>
            <select
              name="organization_type"
              value={form.organization_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
            >
              <option value="">Select organization type</option>
              <option value="Hospital">Hospital</option>
              <option value="IT Company">IT Company</option>
              <option value="Restaurant/Food service">Restaurant/Food Service</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              placeholder="Primary contact person"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              placeholder="Phone number"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              placeholder="contact@company.com"
            />
          </div>
        </div>

        {/* Address - Full Width */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
            style={{
              focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }}
            placeholder="Complete business address"
          />
        </div>

        {/* Submit Button */}
        {canAdd && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              style={{
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
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
    </div>
  );
}
