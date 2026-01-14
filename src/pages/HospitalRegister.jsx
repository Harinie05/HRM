import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useToast from "../utils/useToast";
import Toast from "../components/Toast";

const SECRET_KEY = "nutryah-admin-key";

const HospitalRegister = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hasPrompted = useRef(false);
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({
    primary_color: "#2862e9",
    secondary_color: "#474e71"
  });
  const [form, setForm] = useState({
    tenant_id: "",
    tenant_code: "",
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

  // Fetch organization branding colors
  const fetchBrandingColors = async (tenantCode) => {
    if (!tenantCode) return;
    try {
      const res = await api.get(`/auth/branding/${tenantCode}`);
      setColors(res.data);
      // Apply colors to CSS variables
      document.documentElement.style.setProperty('--primary-color', res.data.primary_color);
      document.documentElement.style.setProperty('--secondary-color', res.data.secondary_color);
    } catch (error) {
      console.log('Using default colors');
    }
  };

  useEffect(() => {
    if (form.tenant_code) {
      fetchBrandingColors(form.tenant_code);
    }
  }, [form.tenant_code]);

  useEffect(() => {
    if (!hasPrompted.current) {
      hasPrompted.current = true;
      const key = prompt("Enter Super Admin Access Key:");
      if (key === SECRET_KEY) {
        setIsAuthorized(true);
      } else {
        showToast("Unauthorized access!", 'error');
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

      // Handle toast notification from API response
      if (res.data.toast) {
        showToast(res.data.toast.message, res.data.toast.type);
      } else {
        showToast("Hospital registered successfully!", 'success');
      }

    } catch (error) {
      console.error('Hospital registration failed:', error);
      
      // Handle toast notification from API error response
      if (error.response?.data?.toast) {
        showToast(error.response.data.toast.message, error.response.data.toast.type);
      } else {
        showToast(error.response?.data?.detail || "Registration failed", 'error');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex justify-center items-center px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ background: `linear-gradient(135deg, ${colors.primary_color}, ${colors.secondary_color})` }}></div>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" style={{ background: `linear-gradient(135deg, ${colors.secondary_color}, ${colors.primary_color})` }}></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" style={{ background: `linear-gradient(135deg, ${colors.primary_color}, ${colors.secondary_color})` }}></div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8 max-w-4xl w-full relative z-10">
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary_color}, ${colors.secondary_color})`,
              }}
            >
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Register Hospital
            </h1>
            <p className="text-gray-600 text-sm">Create your tenant hospital account</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Tenant ID *</label>
              <input
                type="text"
                name="tenant_id"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="HSP001"
                required
                onChange={handleChange}
                style={{
                  '--tw-ring-color': colors.primary_color
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Tenant Code *</label>
              <input
                type="text"
                name="tenant_code"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="NUTRYAH001"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Tenant DB *</label>
              <input
                type="text"
                name="tenant_db"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="hospital_hsp001"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Hospital Name *</label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="Hospital Name"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="admin@hospital.com"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Phone *</label>
              <input
                type="text"
                name="phone"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="XXXXXXXXXX"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">License Number *</label>
              <input
                type="text"
                name="license_number"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="LIC-HSP-445522"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="Name of Contact Person"
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Logo URL</label>
              <input
                type="text"
                name="logo"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="https://example.com/logo.png"
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="XXXXXX"
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Admin Password *</label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                placeholder="Admin@123"
                required
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary_color;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Subscription & License Period Section */}
            <div className="md:col-span-2 mt-6">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-white/30 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary_color }}
                  >
                    <span className="text-white text-sm font-bold">i</span>
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.primary_color }}>Subscription & License Period</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Subscription Plan</label>
                    <select
                      name="subscription_plan"
                      value={form.subscription_plan}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 shadow-sm text-sm"
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary_color;
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primary_color}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="Basic">Basic (30 Days)</option>
                      <option value="Standard">Standard (6 Months)</option>
                      <option value="Premium">Premium (1 Year)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">License Duration (auto-calculated):</label>
                    <div className="bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl px-4 py-3">
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className={form.subscription_plan === "Basic" ? "font-semibold" : ""} style={{ color: form.subscription_plan === "Basic" ? colors.primary_color : undefined }}>
                          • Basic → 30 days from registration
                        </li>
                        <li className={form.subscription_plan === "Standard" ? "font-semibold" : ""} style={{ color: form.subscription_plan === "Standard" ? colors.primary_color : undefined }}>
                          • Standard → 6 months from registration
                        </li>
                        <li className={form.subscription_plan === "Premium" ? "font-semibold" : ""} style={{ color: form.subscription_plan === "Premium" ? colors.primary_color : undefined }}>
                          • Premium → 1 year from registration
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl">
                  <p className="text-sm text-gray-600">
                    AMC, subscription amount, and renewals are configured by NUTRYAH admin in the master console. 
                    They are not editable from this screen.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="text-white px-10 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary_color}, ${colors.secondary_color})`,
                  boxShadow: `0 8px 20px ${colors.primary_color}30`
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = `0 12px 30px ${colors.primary_color}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = `0 8px 20px ${colors.primary_color}30`;
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Register Hospital</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
};

export default HospitalRegister;

