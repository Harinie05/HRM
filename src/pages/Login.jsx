import React, { useState } from "react";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({
    tenant_code: "",
    credential: "", // Single field for email or login code
    password: "",
  });

  const [otpForm, setOtpForm] = useState({
    otp_code: "",
    email: "",
    tenant_code: "",
    login_type: ""
  });

  const [showOtpForm, setShowOtpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleOtpChange = (e) => {
    setOtpForm({
      ...otpForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if credential is email or login code
      const isEmail = form.credential.includes('@');
      const payload = {
        tenant_code: form.tenant_code,
        password: form.password,
        ...(isEmail ? { email: form.credential } : { login_code: form.credential })
      };

      const res = await api.post("/auth/login", payload);
      const data = res.data;

      if (data.otp_required) {
        setOtpForm({
          otp_code: "",
          email: data.email,
          tenant_code: data.tenant_code,
          login_type: data.login_type
        });
        setShowOtpForm(true);
        setPopup({
          show: true,
          message: "OTP sent to your email. Please check and enter the code.",
          success: true,
        });
      } else {
        handleLoginSuccess(data);
      }
    } catch (error) {
      setPopup({
        show: true,
        message: error.response?.data?.detail || "Login Failed",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    console.log('OTP verification started:', otpForm);
    setLoading(true);

    try {
      console.log('Sending OTP verification request to /auth/verify-otp');
      const res = await api.post("/auth/verify-otp", otpForm);
      const data = res.data;
      console.log('OTP verification response received:', data);

      handleLoginSuccess(data);
    } catch (error) {
      console.error('OTP verification failed:', error.response?.data || error.message);
      setPopup({
        show: true,
        message: error.response?.data?.detail || "Invalid OTP",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    // Store access token for axios auth
    if (data.access_token) {
      console.log('Storing access token in localStorage');
      localStorage.setItem("access_token", data.access_token);
    }

    // Store basics
    console.log(`Storing tenant info: ${data.tenant_db}`);
    localStorage.setItem("tenant_db", data.tenant_db);
    localStorage.setItem("tenant_name", data.tenant_db);
    localStorage.setItem("email", data.email);
    localStorage.setItem("login_type", data.login_type || "user");

    if (data.login_type === "admin") {
      console.log('Admin login detected, storing admin data');
      localStorage.setItem("is_admin", "true");
      localStorage.setItem("user_name", data.email.split("@")[0]);
      localStorage.setItem("role_name", "HR Admin");
      localStorage.setItem("tenant_code", data.tenant_code);
      localStorage.setItem("permissions", JSON.stringify([]));
    } else {
      console.log('Regular user login, storing user data:', {
        user_name: data.user_name,
        role_name: data.role_name,
        user_id: data.user_id
      });
      localStorage.setItem("is_admin", "false");
      localStorage.setItem("user_name", data.user_name || data.email.split("@")[0]);
      localStorage.setItem("role_name", data.role_name || "Employee");
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("role_id", data.role_id);
      localStorage.setItem("department_id", data.department_id);
      localStorage.setItem("tenant_code", data.tenant_code);
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
    }

    setPopup({
      show: true,
      message: `Login Successful!`,
      success: true,
    });

    // Dispatch event to load customization colors
    window.dispatchEvent(new CustomEvent('user-logged-in'));

    console.log('Login successful, redirecting to dashboard in 700ms');
    setTimeout(() => (window.location.href = "/dashboard"), 700);
  };

  const handleBackToLogin = () => {
    setShowOtpForm(false);
    setOtpForm({ otp_code: "", email: "", tenant_code: "", login_type: "" });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex justify-center items-center px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* POPUP */}
      {popup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center border border-black">
            <h2
              className={`text-xl font-bold mb-3 ${
                popup.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {popup.success ? "Success!" : "Error!"}
            </h2>

            <p className="text-gray-700 mb-4">{popup.message}</p>

            <button
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setPopup({ ...popup, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* LOGIN CARD */}
      {!showOtpForm ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-6 max-w-sm w-full relative z-10">
          {/* Glassmorphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--primary-color, #4575b5), var(--primary-hover, #3a6299))`,
                }}
              >
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm">Sign in to your HRM account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Tenant Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="tenant_code"
                    required
                    value={form.tenant_code}
                    onChange={handleChange}
                    placeholder="Enter your tenant code"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                    style={{
                      '--tw-ring-color': 'var(--primary-color, #4575b5)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color, #4575b5)';
                      e.target.style.boxShadow = `0 0 0 3px var(--primary-color, #4575b5)20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Email Address / Login Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="credential"
                    required
                    value={form.credential}
                    onChange={handleChange}
                    placeholder="Enter email address or login code"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                    style={{
                      '--tw-ring-color': 'var(--primary-color, #4575b5)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color, #4575b5)';
                      e.target.style.boxShadow = `0 0 0 3px var(--primary-color, #4575b5)20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 shadow-sm text-sm"
                    style={{
                      '--tw-ring-color': 'var(--primary-color, #4575b5)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color, #4575b5)';
                      e.target.style.boxShadow = `0 0 0 3px var(--primary-color, #4575b5)20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm mt-6"
                style={{
                  background: `linear-gradient(135deg, var(--primary-color, #4575b5), var(--primary-hover, #3a6299))`,
                  boxShadow: `0 8px 20px var(--primary-color, #4575b5)30`
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = `0 12px 30px var(--primary-color, #4575b5)40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = `0 8px 20px var(--primary-color, #4575b5)30`;
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Sign In</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* OTP VERIFICATION CARD */
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-6 max-w-sm w-full relative z-10">
          {/* Glassmorphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--primary-color, #4575b5), var(--primary-hover, #3a6299))`,
                }}
              >
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Verify Your Email
              </h1>
              <p className="text-gray-600 mb-2 text-sm">We've sent a 6-digit code to</p>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--primary-color, #4575b5)' }}>{otpForm.email}</p>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expires in 5 min
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center">
                  <div className="relative">
                    <input
                      type="text"
                      name="otp_code"
                      required
                      maxLength="6"
                      onChange={handleOtpChange}
                      placeholder="000000"
                      className="w-44 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white/70 backdrop-blur-sm text-center text-2xl font-mono tracking-[0.2em] placeholder-gray-300 shadow-sm transition-all duration-300"
                      style={{
                        letterSpacing: '0.2em',
                        '--tw-ring-color': 'var(--primary-color, #4575b5)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary-color, #4575b5)';
                        e.target.style.boxShadow = `0 0 0 3px var(--primary-color, #4575b5)20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Enter the 6-digit code from your email</p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otpForm.otp_code.length !== 6}
                  className="w-full text-white py-3 px-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                  style={{
                    background: `linear-gradient(135deg, var(--primary-color, #4575b5), var(--primary-hover, #3a6299))`,
                    boxShadow: `0 8px 20px var(--primary-color, #4575b5)30`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = `0 12px 30px var(--primary-color, #4575b5)40`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = `0 8px 20px var(--primary-color, #4575b5)30`;
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Verify Code</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full bg-gray-100/80 backdrop-blur-sm text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 shadow-md transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </div>
                </button>
              </div>
            </form>

            <div className="mt-5 text-center">
              <p className="text-xs text-gray-500 mb-1">
                Didn't receive the code? Check spam or
              </p>
              <button 
                className="text-xs font-semibold transition-all duration-200 hover:underline"
                style={{
                  color: 'var(--primary-color, #4575b5)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--primary-hover, #3a6299)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--primary-color, #4575b5)';
                }}
              >
                resend code →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
