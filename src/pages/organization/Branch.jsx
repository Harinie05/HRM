import { useEffect, useState } from "react";
import api from "../../api";

export default function Branch() {
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
    setLoading(true);
    try {
      await api.post("/organization/branch", form);
      alert("Branch / Unit Saved Successfully!");
    } catch (err) {
      alert('Failed to save branch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border shadow-sm" style={{borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)'}} style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
      <div className="p-6 border-b ">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Branch / Unit Setup</h2>
            <p className="text-sm text-muted">Configure branch locations and contact details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Branch / Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="branch_name"
              value={form.branch_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="e.g., Coimbatore Unit"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              name="branch_code"
              value={form.branch_code}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="e.g., CBE01"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="Branch manager name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">Contact Number</label>
            <input
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="branch@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="City name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">State</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="State name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="Postal code"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-secondary mb-2">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border-dark rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
            placeholder="Complete branch address"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
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
