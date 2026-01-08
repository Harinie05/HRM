import React, { useState } from "react";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({
    tenant_code: "",
    email: "",
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
    console.log(`Login form field changed: ${e.target.name} = ${e.target.value}`);
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
    console.log('Login attempt started with form data:', form);
    setLoading(true);

    try {
      console.log('Sending login request to /auth/login');
      const res = await api.post("/auth/login", form);
      const data = res.data;
      console.log('Login response received:', data);

      if (data.otp_required) {
        // OTP required, show OTP form
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
        // Direct login (fallback)
        handleLoginSuccess(data);
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
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

    console.log('Login successful, redirecting to dashboard in 700ms');
    setTimeout(() => (window.location.href = "/dashboard"), 700);
  };

  const handleBackToLogin = () => {
    setShowOtpForm(false);
    setOtpForm({ otp_code: "", email: "", tenant_code: "", login_type: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4">

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
        <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your HRM account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant Code
              </label>
              <input
                type="text"
                name="tenant_code"
                required
                onChange={handleChange}
                placeholder="Enter your tenant code"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : "Sign In"}
            </button>
          </form>
        </div>
      ) : (
        /* OTP VERIFICATION CARD */
        <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 mb-2">We've sent a 6-digit verification code to</p>
            <p className="text-sm font-medium text-blue-600">{otpForm.email}</p>
            <p className="text-xs text-gray-500 mt-2">Code expires in 5 minutes</p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  name="otp_code"
                  required
                  maxLength="6"
                  onChange={handleOtpChange}
                  placeholder="------"
                  className="w-48 px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 text-center text-3xl font-mono tracking-[0.5em] placeholder-gray-400"
                  style={{ letterSpacing: '0.5em' }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Enter the 6-digit code from your email</p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || otpForm.otp_code.length !== 6}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                ← Back to Login
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code? Check your spam folder or
            </p>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">
              resend code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
