import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // needed for refresh cookie
});

// ------------------------
// REQUEST INTERCEPTOR
// ------------------------
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  
  // ⛔ Do NOT attach token when calling /auth/login or /auth/refresh
  if (config.url.includes("/auth/login") || config.url.includes("/auth/refresh")) {
    console.log('Auth endpoint detected, skipping token attachment');
    return config;
  }

  const accessToken = localStorage.getItem("access_token");
  const tenant =
    localStorage.getItem("tenant_name") ||
    localStorage.getItem("tenant_db") ||
    null;

  if (accessToken) {
    console.log('Attaching access token to request');
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (tenant) {
    console.log(`Attaching tenant header: ${tenant}`);
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
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // ⛔ If login failed, do NOT refresh
    if (originalRequest.url.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 Unauthorized detected, attempting token refresh');
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
          console.log('New access token received and stored');
          localStorage.setItem("access_token", newToken);

          // Process queued requests
          failedRequestsQueue.forEach((cb) => cb(newToken));
          failedRequestsQueue = [];
          isRefreshing = false;
        } catch (err) {
          console.error("❌ Refresh failed. Logging out.", err);
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
