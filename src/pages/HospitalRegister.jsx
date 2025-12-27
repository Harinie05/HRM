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
    subscription_plan: "Standard",
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", success: false });

  const getLicenseDuration = (plan) => {
    switch (plan) {
      case "Basic":
        return "30 days from registration";
      case "Standard":
        return "6 months from registration";
      case "Premium":
        return "1 year from registration";
      default:
        return "6 months from registration";
    }
  };

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
    console.log('Registering hospital:', form);
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);
      console.log('Hospital registered successfully:', res.data);

      setPopup({
        show: true,
        message: "Hospital registered successfully!",
        success: true,
      });

    } catch (error) {
      console.error('Hospital registration failed:', error);
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

            <p className=" mb-4" style={{color: 'var(--text-secondary, #374151)'}}>{popup.message}</p>

            <button
              style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
              className="text-white px-6 py-2 rounded-lg transition-colors"
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
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
        <p className="text-center text-muted mb-6">
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

          {/* Subscription & License Period Section */}
          <div className="md:col-span-2 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">i</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">Subscription & License Period</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-medium text-secondary mb-2 block">Subscription Plan</label>
                  <select
                    name="subscription_plan"
                    value={form.subscription_plan}
                    onChange={handleChange}
                    className="w-full border-dark rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Basic">Basic (30 Days)</option>
                    <option value="Standard">Standard (6 Months)</option>
                    <option value="Premium">Premium (1 Year)</option>
                  </select>
                </div>
                
                <div>
                  <label className="font-medium text-secondary mb-2 block">License Duration (auto-calculated):</label>
                  <div className="bg-white border-dark rounded-lg px-4 py-3">
                    <ul className="text-sm text-secondary space-y-1">
                      <li className={form.subscription_plan === "Basic" ? "font-semibold text-blue-600" : ""}>
                        • Basic → 30 days from registration
                      </li>
                      <li className={form.subscription_plan === "Standard" ? "font-semibold text-blue-600" : ""}>
                        • Standard → 6 months from registration
                      </li>
                      <li className={form.subscription_plan === "Premium" ? "font-semibold text-blue-600" : ""}>
                        • Premium → 1 year from registration
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-secondary">
                  AMC, subscription amount, and renewals are configured by NUTRYAH admin in the master console. 
                  They are not editable from this screen.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
              className="text-white px-10 py-3 rounded-xl transition-colors"
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
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
