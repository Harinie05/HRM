import React, { useState } from "react";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt started with form data:', form);
    setLoading(true);

    try {
      // 🔗 Backend login API (updated path)
      console.log('Sending login request to /auth/login');
      const res = await api.post("/auth/login", form);
      const data = res.data;
      console.log('Login response received:', data);

      // ⭐ store access token for axios auth
      if (data.access_token) {
        console.log('Storing access token in localStorage');
        localStorage.setItem("access_token", data.access_token);
      }

      // store basics
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
        localStorage.setItem("permissions", JSON.stringify([]));
      } else {
        console.log('Regular user login, storing user data:', {
          user_name: data.user_name,
          role_name: data.role_name,
          user_id: data.user_id
        });
        localStorage.setItem("is_admin", "false");
        localStorage.setItem(
          "user_name",
          data.user_name || data.email.split("@")[0]
        );
        localStorage.setItem("role_name", data.role_name || "Employee");
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role_id", data.role_id);
        localStorage.setItem("department_id", data.department_id);
        localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
      }

      setPopup({
        show: true,
        message: `Login Successful!`,
        success: true,
      });

      console.log('Login successful, redirecting to dashboard in 700ms');
      setTimeout(() => (window.location.href = "/dashboard"), 700);
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
      <div className="bg-white rounded-2xl border border-black shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HRM Login
          </h1>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
