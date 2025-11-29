// simple helper used by pages to check permissions
export function getUserPermissions() {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
}

export function isAdmin() {
  return (
    localStorage.getItem("login_type") === "admin" ||
    localStorage.getItem("is_admin") === "true"
  );
}

// check single permission (admins always true)
export function hasPermission(perm) {
  if (isAdmin()) return true;
  const perms = getUserPermissions();
  return perms.includes(perm);
}
