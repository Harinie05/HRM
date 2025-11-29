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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/organization/branch");
        if (res.data) setForm(res.data);
      } catch (err) {
        console.log("Branch not set yet");
      }
    }
    fetchData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/organization/branch", form);
    alert("Branch / Unit Saved Successfully!");
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h2 className="text-xl font-semibold mb-4">Branch / Unit Details</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">

        {/* Branch Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Branch / Unit Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            name="branch_name"
            value={form.branch_name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
            placeholder="Eg: Coimbatore Unit"
          />
        </div>

        {/* Branch Code */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Branch Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            name="branch_code"
            value={form.branch_code}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
            placeholder="Eg: CBE01"
          />
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

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-gray-50"
          />
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-medium mb-1">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={form.pincode}
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
          ></textarea>
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
