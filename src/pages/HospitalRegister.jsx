import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const SECRET_KEY = "nutryah-admin-key";

const HospitalRegister = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hasPrompted = useRef(false);
  const [form, setForm] = useState({
    tenant_id: "",
    tenant_db: "",
    name: "",
    email: "",
    phone: "",
    license_number: "",
    contact_person: "",
    logo: "",
    pincode: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", success: false });

  useEffect(() => {
    if (!hasPrompted.current) {
      hasPrompted.current = true;
      const key = prompt("Enter Super Admin Access Key:");
      if (key === SECRET_KEY) {
        setIsAuthorized(true);
      } else {
        alert("Unauthorized access!");
        navigate("/");
      }
    }
  }, []);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-white"></div>;
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/hospitals/register", form);

      setPopup({
        show: true,
        message: "Hospital registered successfully!",
        success: true,
      });

      console.log(res.data);
    } catch (error) {
      setPopup({
        show: true,
        message: error.response?.data?.detail || "Registration failed",
        success: false,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">

      {/* POPUP */}
      {popup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
            <h2
              className={`text-xl font-bold mb-3 ${
                popup.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {popup.success ? "Success!" : "Error!"}
            </h2>

            <p className="text-gray-700 mb-4">{popup.message}</p>

            <button
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
              onClick={() => setPopup({ ...popup, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div className="bg-white shadow-xl p-8 rounded-2xl max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
          Register Hospital
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Create your tenant hospital account
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="font-medium">Tenant ID *</label>
            <input
              type="text"
              name="tenant_id"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="HSP001"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Tenant DB *</label>
            <input
              type="text"
              name="tenant_db"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="hospital_hsp001"
              required
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-medium">Hospital Name *</label>
            <input
              type="text"
              name="name"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Hospital Name"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Email *</label>
            <input
              type="email"
              name="email"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="admin@hospital.com"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Phone *</label>
            <input
              type="text"
              name="phone"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="XXXXXXXXXX"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">License Number *</label>
            <input
              type="text"
              name="license_number"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="LIC-HSP-445522"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Name of Contact Person"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Logo URL</label>
            <input
              type="text"
              name="logo"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="https://example.com/logo.png"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="font-medium">Pincode</label>
            <input
              type="text"
              name="pincode"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="XXXXXX"
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-medium">Admin Password *</label>
            <input
              type="password"
              name="password"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Admin@123"
              required
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-10 py-3 rounded-xl hover:bg-blue-800"
            >
              {loading ? "Registering..." : "Register Hospital"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default HospitalRegister;
