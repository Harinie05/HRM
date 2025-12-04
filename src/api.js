import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",   // backend
  withCredentials: true,              // ⛔ important for refresh cookie
});

// =======================
// Request Interceptor
// =======================
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  const tenant =
    localStorage.getItem("tenant_name") ||
    localStorage.getItem("tenant_db") ||
    null;

  // Attach Authorization header
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Attach tenant header
  if (tenant) {
    config.headers["tenant"] = tenant;
    console.log("📌 Sending tenant:", tenant);
  } else {
    console.warn("⚠️ tenant not found in localStorage");
  }

  return config;
});

// =======================
// Response Interceptor
// =======================
let isRefreshing = false;
let failedRequestsQueue = [];   // queue → for pending requests

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If token expired → Try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        console.log("🔄 Access expired → requesting new token...");

        try {
          // 🔥 Updated path to match your main.py prefix
          const refreshResponse = await axios.post(
            "http://127.0.0.1:8000/auth/refresh",
            {},
            { withCredentials: true }   // cookie contains refresh token
          );

          const newToken = refreshResponse.data.access_token;
          localStorage.setItem("access_token", newToken);

          // replay queued requests
          failedRequestsQueue.forEach((req) => req(newToken));
          failedRequestsQueue = [];
          isRefreshing = false;

        } catch (err) {
          console.error("❌ Refresh failed → forcing logout");
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }

      // queue requests while token is refreshing
      return new Promise((resolve) => {
        failedRequestsQueue.push((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
