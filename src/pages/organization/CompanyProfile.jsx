import { useEffect, useState } from "react";
import api from "../../api";

export default function CompanyProfile() {
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
    fetchData();
  }, []);

  function handleChange(e) {
    console.log(`Company profile field changed: ${e.target.name} = ${e.target.value}`);
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Saving company profile:', form);
      await api.post("/organization/company-profile", form);
      console.log('Company profile saved successfully');
      
      // Update localStorage for sidebar
      localStorage.setItem("hospital_name", form.name);
      window.dispatchEvent(new Event('organization-updated'));
      
      alert("Company Profile Saved");
    } catch (err) {
      console.error('Failed to save company profile:', err);
      alert("Failed to save company profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Company Profile</h2>
            <p className="text-sm text-gray-500">Configure your organization's basic information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
              placeholder="Enter company name"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
              placeholder="https://www.company.com"
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Type</label>
            <select
              name="organization_type"
              value={form.organization_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
              placeholder="Primary contact person"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
              placeholder="Phone number"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
              placeholder="contact@company.com"
            />
          </div>
        </div>

        {/* Address - Full Width */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors resize-none"
            placeholder="Complete business address"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      </form>
    </div>
  );
}
