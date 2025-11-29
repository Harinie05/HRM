import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach tenant header automatically
api.interceptors.request.use((config) => {
  const tenant =
    localStorage.getItem("tenant_name") ||
    localStorage.getItem("tenant_db") ||     // fallback
    null;

  console.log("📌 Sending tenant header:", tenant);

  if (tenant) {
    config.headers["tenant"] = tenant;
  } else {
    console.warn("⚠️ tenant not found in localStorage");
  }

  return config;
});

export default api;
