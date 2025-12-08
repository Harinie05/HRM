import { useEffect, useState } from "react";
import api from "../../api"; // your axios instance

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

  // Load prefilled company profile from FastAPI
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
    try {
      console.log('Saving company profile:', form);
      await api.post("/organization/company-profile", form);
      console.log('Company profile saved successfully');
      alert("Company Profile Saved");
    } catch (err) {
      console.error('Failed to save company profile:', err);
      alert("Failed to save company profile");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Basic Details</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            type="text"
            name="website"
            placeholder="Company Website"
            value={form.website}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Type of Organization */}
        <div>
          <label className="block text-sm font-medium mb-1">Type of organization</label>
          <select
            name="organization_type"
            value={form.organization_type}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          >
            <option value="">Select Type</option>
            <option value="IT Company">IT Company</option>
            <option value="Restaurant/Food service">Restaurant/Food service</option>
            <option value="Hospital">Hospital</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Person</label>
          <input
            type="text"
            name="contact_person"
            value={form.contact_person}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input
            type="text"
            name="contact_number"
            value={form.contact_number}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={form.contact_email}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50 h-24"
          />
        </div>

        {/* Submit */}
        <div className="col-span-2">
          <button
            type="submit"
            className="bg-blue-600 px-6 py-2 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
