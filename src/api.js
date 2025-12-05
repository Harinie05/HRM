import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // needed for refresh cookie
});

// ------------------------
// REQUEST INTERCEPTOR
// ------------------------
api.interceptors.request.use((config) => {
  // ⛔ Do NOT attach token when calling /auth/login or /auth/refresh
  if (config.url.includes("/auth/login") || config.url.includes("/auth/refresh")) {
    return config;
  }

  const accessToken = localStorage.getItem("access_token");
  const tenant =
    localStorage.getItem("tenant_name") ||
    localStorage.getItem("tenant_db") ||
    null;

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (tenant) {
    config.headers["tenant"] = tenant;
  }

  return config;
});

// ------------------------
// RESPONSE INTERCEPTOR
// ------------------------
let isRefreshing = false;
let failedRequestsQueue = [];

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ⛔ If login failed, do NOT refresh
    if (originalRequest.url.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        console.log("🔄 Requesting new access token...");

        try {
          const refreshResponse = await axios.post(
            "http://localhost:8000/auth/refresh"
,
            {},
            { withCredentials: true }
          );

          const newToken = refreshResponse.data.access_token;
          localStorage.setItem("access_token", newToken);

          // Process queued requests
          failedRequestsQueue.forEach((cb) => cb(newToken));
          failedRequestsQueue = [];
          isRefreshing = false;
        } catch (err) {
          console.error("❌ Refresh failed. Logging out.");
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }

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
