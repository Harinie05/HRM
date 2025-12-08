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
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">

      {/* POPUP */}
      {popup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
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

      {/* LOGIN CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-[#0D3B66] mb-2">
          HRM Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              onChange={handleChange}
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-400"
              placeholder="user@example.com"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              required
              onChange={handleChange}
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-400"
              placeholder="********"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D3B66] text-white py-3 rounded-lg text-lg hover:bg-blue-900 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
