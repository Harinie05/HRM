import api from "./api";

export const logout = async () => {
  try {
    await api.post("/auth/logout"); // clears cookie server side
  } catch (e) {}

  // Clear local storage data
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenant_db");
  localStorage.removeItem("tenant_name");
  localStorage.removeItem("email");
  localStorage.removeItem("login_type");
  localStorage.removeItem("is_admin");
  localStorage.removeItem("user_name");
  localStorage.removeItem("role_name");
  localStorage.removeItem("permissions");
  localStorage.removeItem("user_id");
  localStorage.removeItem("role_id");
  localStorage.removeItem("department_id");

  window.location.href = "/login";
};
