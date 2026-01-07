import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar, Download, Copy, Save, Plus, Users, Clock, Settings, Phone, AlertTriangle } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function ShiftRoster() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rosterData, setRosterData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showShifts, setShowShifts] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocatedUsers, setAllocatedUsers] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [bulkShift, setBulkShift] = useState("");
  const [viewMode, setViewMode] = useState("week"); // week or month
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast, showToast, hideToast } = useToast();
  const [bulkDateRange, setBulkDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [nightShiftRules, setNightShiftRules] = useState({
    applicable_shifts: [],
    punch_out_rule: "Same day",
    minimum_hours: 6,
    night_ot_rate: "1.5x",
    grace_minutes: 15
  });
  const [allNightShiftRules, setAllNightShiftRules] = useState([]);
  const [showNightShiftRulesList, setShowNightShiftRulesList] = useState(false);
  const [editingNightShiftRule, setEditingNightShiftRule] = useState(null);
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [newShift, setNewShift] = useState({ name: "", start_time: "", end_time: "" });
  const [selectedUsersForBulk, setSelectedUsersForBulk] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [showInactiveShifts, setShowInactiveShifts] = useState(false);
  
  // On-Call Duty States
  const [onCallDuties, setOnCallDuties] = useState([]);
  const [showOnCallForm, setShowOnCallForm] = useState(false);
  const [onCallForm, setOnCallForm] = useState({
    employee_id: "",
    date: new Date().toISOString().split('T')[0],
    from_time: "18:00",
    to_time: "08:00",
    duty_type: "On-Call",
    priority_level: "Normal",
    contact_number: "",
    remarks: ""
  });
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    on_call_duty_id: "",
    employee_id: "",
    call_time: new Date().toISOString().slice(0, 19),
    call_type: "Emergency",
    caller_details: "",
    issue_description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      await fetchDepartments(); // Fetch departments first
      await fetchEmployees(); // Then fetch employees so department lookup works
    };
    
    fetchShifts();
    fetchData();
    fetchNightShiftRules();
    fetchRoles();
    fetchUsers();
    fetchOnCallDuties();
    fetchEmergencyCalls();
  }, [showInactiveShifts]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchDepartments();
      await fetchEmployees();
    };
    fetchData();
    fetchRosterData();
  }, [currentDate, viewMode, selectedDepartment, showDeleted]);

  useEffect(() => {
    // Load all users by default to show in calendar
    fetchUsers();
  }, []);

  const fetchShifts = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) {
        console.error("Missing authentication data:", { tenant, token: !!token });
        return;
      }
      
      console.log("Fetching shifts for tenant:", tenant);
      const activeParam = showInactiveShifts ? 'false' : 'true';
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/list?active_only=${activeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get('content-type'));
      
      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 200));
      
      if (!response.ok) {
        console.error("API Error - Full response:", responseText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log("Shifts data received:", data);
        setShifts(data.shifts || []);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response was not JSON:", responseText.substring(0, 500));
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) return;
      
      // Fetch from both onboarding and user management (same as Employee Directory)
      const [onboardingRes, usersRes] = await Promise.all([
        api.get('/recruitment/onboarding/list').catch(() => ({ data: [] })),
        fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] }))
      ]);
      
      const onboardedEmployees = onboardingRes.data || [];
      const userEmployees = usersRes.users || [];
      
      // Process onboarded employees (same logic as Employee Directory)
      const validOnboardedEmployees = onboardedEmployees.filter(emp => {
        if (!emp.employee_id || emp.employee_id.trim() === '') return false;
        const isAutoGenerated = /^[A-Z]{3}\d{6}$/.test(emp.employee_id);
        return !isAutoGenerated;
      });
      
      const onboardedData = validOnboardedEmployees.map(emp => ({
        id: emp.application_id,
        name: emp.candidate_name,
        email: emp.candidate_email || 'N/A',
        designation: emp.job_title,
        department_name: emp.department,
        employee_code: emp.employee_id, // Use employee_id from onboarding_candidates
        joining_date: emp.joining_date,
        work_location: emp.work_location,
        reporting_manager: emp.reporting_manager,
        status: 'Active',
        source: 'onboarding'
      }));
      
      // Process user management employees (users with employee codes)
      const userEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => {
          // Find department name from departments array if department_id exists
          let departmentName = user.department_name;
          if (!departmentName && user.department_id) {
            const dept = departments.find(d => d.id === user.department_id);
            departmentName = dept ? dept.name : 'Unknown';
          }
          
          return {
            id: `user_${user.id}`,
            original_user_id: user.id,
            name: user.name,
            email: user.email,
            designation: user.designation || 'N/A',
            department_name: departmentName || 'No Department',
            employee_code: user.employee_code, // Use employee_code from users table
            joining_date: user.joining_date,
            work_location: 'N/A',
            reporting_manager: 'N/A',
            status: user.status || 'Active',
            source: 'user_management'
          };
        });
      
      // Combine and remove duplicates (prefer user management data for same employee codes)
      const allEmployees = [...onboardedData];
      userEmployeeData.forEach(userEmp => {
        const existingIndex = allEmployees.findIndex(emp => emp.employee_code === userEmp.employee_code);
        if (existingIndex === -1) {
          allEmployees.push(userEmp);
        } else {
          allEmployees[existingIndex] = userEmp;
        }
      });
      
      console.log('=== ROSTER EMPLOYEE FETCH DEBUG ===');
      console.log('Onboarding response:', onboardingRes);
      console.log('Users response:', usersRes);
      console.log('Valid onboarded employees:', validOnboardedEmployees.length, validOnboardedEmployees);
      console.log('User employees with codes:', userEmployeeData.length, userEmployeeData);
      console.log('Final combined employees:', allEmployees.length, allEmployees);
      console.log('=== END DEBUG ===');
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchRosterData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const dates = getDateRange();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      const url = `http://localhost:8000/api/roster/schedule?start_date=${startDate}&end_date=${endDate}${selectedDepartment ? `&department=${selectedDepartment}` : ''}${showDeleted ? '&show_deleted=true' : ''}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Roster data received:", data);
        setRosterData(data.roster || []);
        setDeletedCount(data.deleted_count || 0);
        
        // Create a stable mapping of employee IDs to preserve identity
        const employeeMapping = new Map();
        
        // First, populate mapping from existing allocated users (highest priority)
        allocatedUsers.forEach(user => {
          const key = user.id.toString();
          employeeMapping.set(key, {
            id: user.id,
            name: user.name,
            employee_code: user.employee_code,
            department_name: user.department_name,
            designation: user.designation
          });
        });
        
        // Then add from employees list if not already mapped
        employees.forEach(emp => {
          const key = emp.id.toString();
          const userKey = emp.original_user_id ? emp.original_user_id.toString() : null;
          
          if (!employeeMapping.has(key)) {
            employeeMapping.set(key, {
              id: emp.id,
              name: emp.name,
              employee_code: emp.employee_code,
              department_name: emp.department_name,
              designation: emp.designation
            });
          }
          
          if (userKey && !employeeMapping.has(userKey)) {
            employeeMapping.set(userKey, {
              id: emp.id,
              name: emp.name,
              employee_code: emp.employee_code,
              department_name: emp.department_name,
              designation: emp.designation
            });
          }
        });
        
        // Process roster data using stable mapping
        const rosterUsers = [];
        
        if (data.roster && data.roster.length > 0) {
          data.roster.forEach(empData => {
            const empId = empData.employee_id.toString();
            const mappedEmployee = employeeMapping.get(empId);
            
            // Use mapped employee data if available, otherwise use API data
            const user = {
              id: empData.employee_id,
              name: mappedEmployee?.name || empData.employee_name || `User ${empData.employee_id}`,
              department_name: mappedEmployee?.department_name || empData.department || "Unknown",
              employee_code: mappedEmployee?.employee_code || empData.employee_code || empData.employee_id,
              designation: mappedEmployee?.designation || "Unknown",
              roster: {},
              is_deleted: empData.is_deleted || false
            };
            
            // Set roster data for this user from API response
            if (empData.schedule) {
              empData.schedule.forEach(dayData => {
                if (dayData.shift_id) {
                  user.roster[dayData.date] = dayData.shift_id;
                } else if (dayData.status === "OFF") {
                  user.roster[dayData.date] = "OFF";
                }
              });
            }
            
            rosterUsers.push(user);
          });
        }
        
        setAllocatedUsers(rosterUsers);
      } else {
        console.error("Failed to fetch roster data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching roster data:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) {
        console.log("Missing auth for departments:", { tenant, token: !!token });
        return;
      }
      
      console.log("Fetching departments for tenant:", tenant);
      const response = await fetch(`http://localhost:8000/hospitals/departments/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Departments response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Departments data:", data);
        setDepartments(data.departments || []);
      } else {
        const errorText = await response.text();
        console.error("Departments API error:", errorText);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchNightShiftRules = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const response = await fetch("http://localhost:8000/api/roster/night-shift-rules", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.rules) {
          setNightShiftRules(data.rules);
        }
      }
    } catch (error) {
      console.error("Error fetching night shift rules:", error);
    }
  };

  const fetchAllNightShiftRules = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const response = await fetch("http://localhost:8000/api/roster/night-shift-rules/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllNightShiftRules(data.rules || []);
      }
    } catch (error) {
      console.error("Error fetching all night shift rules:", error);
    }
  };

  const editNightShiftRule = async (ruleId) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const response = await fetch(`http://localhost:8000/api/roster/night-shift-rules/${ruleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEditingNightShiftRule(data.rule);
        setNightShiftRules(data.rule);
      }
    } catch (error) {
      console.error("Error fetching night shift rule:", error);
    }
  };

  const updateNightShiftRule = async (ruleId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/roster/night-shift-rules/${ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(nightShiftRules)
      });
      
      if (response.ok) {
        showToast("Night shift rule updated successfully!");
        setEditingNightShiftRule(null);
        fetchAllNightShiftRules();
      }
    } catch (error) {
      console.error("Error updating night shift rule:", error);
    }
  };

  const deleteNightShiftRule = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this night shift rule?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/roster/night-shift-rules/${ruleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        showToast("Night shift rule deleted successfully!");
        fetchAllNightShiftRules();
      }
    } catch (error) {
      console.error("Error deleting night shift rule:", error);
    }
  };

  const saveRosterEntry = async (employeeId, date, shiftId, status = "Scheduled", employeeName = null, employeeCode = null) => {
    try {
      const token = localStorage.getItem("access_token");
      console.log("Attempting to save roster entry:", { employeeId, date, shiftId, status, employeeName, employeeCode });
      
      // Convert employee ID to integer if it's a string with "user_" prefix
      let actualEmployeeId = employeeId;
      if (typeof employeeId === 'string' && employeeId.startsWith('user_')) {
        actualEmployeeId = parseInt(employeeId.replace('user_', ''));
      } else {
        actualEmployeeId = parseInt(employeeId);
      }
      
      // Find employee details if not provided
      if (!employeeName || !employeeCode) {
        const user = allocatedUsers.find(u => u.id === employeeId);
        if (user) {
          employeeName = employeeName || user.name;
          employeeCode = employeeCode || user.employee_code;
        }
      }
      
      console.log("Converted employee ID:", actualEmployeeId);
      console.log("Using employee details:", { employeeName, employeeCode });
      
      const response = await fetch("http://localhost:8000/api/roster/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: actualEmployeeId,
          date: date,
          shift_id: shiftId,
          status: status,
          employee_name: employeeName,
          employee_code: employeeCode
        })
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Roster entry saved successfully:", result);
      } else {
        const errorText = await response.text();
        console.error("Failed to save roster entry:", errorText);
      }
    } catch (error) {
      console.error("Error saving roster:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) return;
      
      const response = await fetch(`http://localhost:8000/hospitals/roles/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) return;
      
      const response = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getFilteredEmployees = () => {
    console.log('Dropdown employees:', employees.length, employees);
    return employees; // Show all employees, don't filter out allocated ones
  };

  const addEmployeeToRoster = async () => {
    console.log('Add to roster clicked, selectedUser:', selectedUser);
    console.log('Available employees:', employees.length);
    
    if (!selectedUser) {
      console.log('No user selected');
      return;
    }
    
    const employee = employees.find(e => e.id == selectedUser);
    console.log('Found employee:', employee);
    
    if (employee && !allocatedUsers.find(allocated => allocated.id === employee.id)) {
      // Preserve the original employee code and ensure it doesn't change
      const newUser = { 
        ...employee, 
        roster: {},
        // Ensure employee_code is preserved from the original employee data
        employee_code: employee.employee_code || employee.id,
        // Keep original ID structure
        original_employee_id: employee.id
      };
      console.log('Adding user to roster:', newUser);
      setAllocatedUsers([...allocatedUsers, newUser]);
      setSelectedUser("");
      
      // Save a placeholder roster entry to persist the employee in the database
      try {
        let actualEmployeeId = employee.id;
        if (typeof employee.id === 'string' && employee.id.startsWith('user_')) {
          actualEmployeeId = parseInt(employee.id.replace('user_', ''));
        } else {
          actualEmployeeId = parseInt(employee.id);
        }
        
        // Save a placeholder entry for today to ensure employee is in database
        const today = new Date().toISOString().split('T')[0];
        await saveRosterEntry(actualEmployeeId, today, null, "Unscheduled", employee.name, employee.employee_code);
        
        showToast(`${employee.name} added to roster successfully!`);
      } catch (error) {
        console.error('Error saving employee to roster:', error);
        showToast(`${employee.name} added to roster but may not persist after refresh`, 'warning');
      }
    } else {
      console.log('Employee already in roster or not found');
      if (!employee) {
        showToast('Employee not found', 'error');
      } else {
        showToast('Employee already in roster', 'error');
      }
    }
  };

  const bulkAllocateShifts = async () => {
    if (!bulkShift || selectedUsersForBulk.length === 0) {
      showToast("Please select users and shift for bulk allocation", 'error');
      return;
    }
    
    const start = new Date(bulkDateRange.start);
    const end = new Date(bulkDateRange.end);
    
    try {
      // Create a copy of allocated users to preserve original data
      const updatedUsers = allocatedUsers.map(user => ({
        ...user,
        roster: { ...user.roster }, // Deep copy roster
        employee_code: user.employee_code || user.id // Preserve employee code
      }));
      
      // Save each entry to database and update local state
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = new Date(d).toISOString().split('T')[0];
        
        for (const user of updatedUsers) {
          if (selectedUsersForBulk.includes(user.id)) {
            if (!user.roster) user.roster = {};
            user.roster[dateStr] = bulkShift;
            
            // Convert user ID to proper format for backend
            let actualUserId = user.id;
            if (typeof user.id === 'string' && user.id.startsWith('user_')) {
              actualUserId = parseInt(user.id.replace('user_', ''));
            } else {
              actualUserId = parseInt(user.id);
            }
            
            // Save to database
            const shiftId = bulkShift === "OFF" ? null : parseInt(bulkShift);
            const status = bulkShift === "OFF" ? "OFF" : "Scheduled";
            await saveRosterEntry(actualUserId, dateStr, shiftId, status, user.name, user.employee_code);
          }
        }
      }
      
      // Update state with preserved employee codes and roster data
      setAllocatedUsers(updatedUsers);
      
      setBulkShift("");
      setSelectedUsersForBulk([]);
      
      showToast(`Bulk shift allocation completed successfully!`);
      
      // Refresh roster data to ensure consistency
      setTimeout(() => {
        fetchRosterData();
      }, 500);
      
    } catch (error) {
      console.error('Error in bulk allocation:', error);
      showToast('Error during bulk allocation', 'error');
    }
  };

  const removeUserFromRoster = async (userId) => {
    try {
      const token = localStorage.getItem("access_token");
      
      // Convert user ID to proper format for backend
      let actualUserId = userId;
      if (typeof userId === 'string' && userId.startsWith('user_')) {
        actualUserId = parseInt(userId.replace('user_', ''));
      } else {
        actualUserId = parseInt(userId);
      }
      
      // Soft delete all roster entries for this employee
      const response = await fetch(`http://localhost:8000/api/roster/remove-employee/${actualUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove from frontend state
        setAllocatedUsers(allocatedUsers.filter(user => user.id !== userId));
        showToast("Employee removed from roster successfully!");
        
        // Refresh roster data
        await fetchRosterData();
      } else {
        const errorText = await response.text();
        console.error("Failed to remove employee:", errorText);
        showToast("Error removing employee from roster", 'error');
      }
    } catch (error) {
      console.error("Error removing user from roster:", error);
      showToast("Error removing employee from roster", 'error');
    }
  };

  const updateUserRoster = (userId, date, shiftId) => {
    setAllocatedUsers(allocatedUsers.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          roster: {
            ...user.roster,
            [date]: shiftId
          },
          // Preserve employee code during updates
          employee_code: user.employee_code || user.original_employee_id || user.id
        };
      }
      return user;
    }));
  };

  const createShift = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!newShift.name || !newShift.start_time || !newShift.end_time) {
        showToast("Please fill all fields", 'error');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newShift)
      });
      
      if (response.ok) {
        showToast("Shift created successfully!");
        setNewShift({ name: "", start_time: "", end_time: "" });
        setShowCreateShift(false);
        fetchShifts();
      }
    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };

  const deleteShift = async (shiftId) => {
    if (!confirm("Are you sure you want to delete this shift?")) {
      return;
    }
    
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/${shiftId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showToast("Shift deleted successfully!");
        fetchShifts();
      } else {
        showToast("Failed to delete shift", 'error');
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      showToast("Error deleting shift", 'error');
    }
  };

  const saveNightShiftRules = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/roster/night-shift-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(nightShiftRules)
      });
      
      if (response.ok) {
        showToast("Night shift rules saved successfully!");
      } else {
        const errorText = await response.text();
        console.error("Failed to save night shift rules:", errorText);
        showToast("Failed to save night shift rules", 'error');
      }
    } catch (error) {
      console.error("Error saving night shift rules:", error);
      showToast("Error saving night shift rules", 'error');
    }
  };

  // On-Call Duty Functions
  const fetchOnCallDuties = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/roster/on-call", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOnCallDuties(data.on_call_duties || []);
      }
    } catch (error) {
      console.error("Error fetching on-call duties:", error);
    }
  };

  const fetchEmergencyCalls = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/roster/emergency-calls", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmergencyCalls(data.emergency_calls || []);
      }
    } catch (error) {
      console.error("Error fetching emergency calls:", error);
    }
  };

  const saveOnCallDuty = async () => {
    console.log('Save on-call duty clicked');
    console.log('Form data:', onCallForm);
    
    // Basic validation
    if (!onCallForm.employee_id) {
      showToast("Please select an employee", 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem("access_token");
      
      // Extract actual user ID from employee data
      const selectedEmployee = employees.find(emp => emp.id == onCallForm.employee_id);
      const actualEmployeeId = selectedEmployee?.original_user_id || selectedEmployee?.id;
      
      // Convert to integer if it's a string number
      const employeeId = typeof actualEmployeeId === 'string' && actualEmployeeId.startsWith('user_') 
        ? parseInt(actualEmployeeId.replace('user_', ''))
        : parseInt(actualEmployeeId);
      
      console.log('Selected employee:', selectedEmployee);
      console.log('Actual employee ID:', employeeId);
      
      const payload = {
        ...onCallForm,
        employee_id: employeeId
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch("http://localhost:8000/api/roster/on-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (response.ok) {
        console.log('On-call duty saved successfully');
        showToast("On-call duty created successfully!");
        setShowOnCallForm(false);
        setOnCallForm({
          employee_id: "",
          date: new Date().toISOString().split('T')[0],
          from_time: "18:00",
          to_time: "08:00",
          duty_type: "On-Call",
          priority_level: "Normal",
          contact_number: "",
          remarks: ""
        });
        fetchOnCallDuties();
      } else {
        console.error('API error:', responseText);
        showToast(`Failed to create on-call duty: ${responseText}`, 'error');
      }
    } catch (error) {
      console.error("Error saving on-call duty:", error);
      showToast("Error saving on-call duty", 'error');
    }
  };

  const logEmergencyCall = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/roster/emergency-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(emergencyForm)
      });
      
      if (response.ok) {
        showToast("Emergency call logged successfully!");
        setShowEmergencyForm(false);
        setEmergencyForm({
          on_call_duty_id: "",
          employee_id: "",
          call_time: new Date().toISOString().slice(0, 19),
          call_type: "Emergency",
          caller_details: "",
          issue_description: ""
        });
        fetchEmergencyCalls();
      }
    } catch (error) {
      console.error("Error logging emergency call:", error);
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateRange = () => {
    const dates = [];
    let start, end;
    
    if (viewMode === "week") {
      // Get current week (Monday to Sunday)
      const curr = new Date(currentDate);
      const first = curr.getDate() - curr.getDay() + 1; // Monday
      start = new Date(curr.setDate(first));
      end = new Date(curr.setDate(first + 6)); // Sunday
    } else {
      // Get current month
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const getCalendarTitle = () => {
    if (viewMode === "week") {
      const dates = getDateRange();
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg border-2 border-black mb-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Shift & Roster Management</h1>
                <p className="text-sm sm:text-base text-gray-600">Advanced shift planning and employee roster management system</p>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">{shifts.length} {showInactiveShifts ? 'Total' : 'Active'} Shifts</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300"></div>
                  <span className="text-xs text-gray-600">Real-time Updates</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInactiveShifts}
                  onChange={(e) => setShowInactiveShifts(e.target.checked)}
                  className="rounded border border-black"
                />
                <span className="text-gray-700">Show inactive shifts</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="rounded border border-black"
                />
                <span className="text-gray-700">Show Deleted ({deletedCount})</span>
              </label>
              {(isAdmin() || hasPermission("CREATE_SHIFTS")) && (
                <button
                  onClick={() => setShowCreateShift(true)}
                  className="bg-black border border-black text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Shift</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shift Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {shifts.map((shift) => {
            const calculateDuration = (start, end) => {
              const startTime = new Date(`2000-01-01 ${start}`);
              const endTime = new Date(`2000-01-01 ${end}`);
              let diff = endTime - startTime;
              if (diff < 0) diff += 24 * 60 * 60 * 1000;
              const hours = Math.floor(diff / (1000 * 60 * 60));
              return `${hours} hours`;
            };
            
            return (
              <div key={shift.id} className="bg-white rounded-lg p-4 sm:p-6 border border-black hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{shift.name}</h3>
                    <div className="flex items-center space-x-2 text-gray-500 mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{shift.start_time} - {shift.end_time}</span>
                    </div>
                  </div>
                  
                  {(isAdmin() || hasPermission("DELETE_SHIFTS")) && (
                    <button
                      onClick={() => deleteShift(shift.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg border border-black transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">{calculateDuration(shift.start_time, shift.end_time)}</span>
                    <span className="text-xs text-gray-500">duration</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      shift.is_active === false ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      shift.is_active === false ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {shift.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State for Shifts */}
        {shifts.length === 0 && (
          <div className="text-center py-12 sm:py-16 mb-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-lg border border-black flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No shifts found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first shift</p>
            {(isAdmin() || hasPermission("CREATE_SHIFTS")) && (
              <button
                onClick={() => setShowCreateShift(true)}
                className="bg-white border border-black text-gray-900 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Shift
              </button>
            )}
          </div>
        )}

        {/* Roster Management Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Roster Management</h2>
        
        {/* Employee Allocation */}
        <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-black">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Add Employee to Roster
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">Select Employee</option>
                {getFilteredEmployees().map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_code} - {employee.name}
                  </option>
                ))}
              </select>
            </div>
            
            {(isAdmin() || hasPermission("MANAGE_ROSTER")) && (
              <div className="flex items-end">
                <button
                  onClick={addEmployeeToRoster}
                  disabled={!selectedUser}
                  className="px-4 py-2 bg-black border border-black text-white hover:bg-gray-800 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Roster
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Shift Allocation */}
        {(isAdmin() || hasPermission("MANAGE_ROSTER")) && (
          <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-black">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Bulk Shift Allocation
            </h3>
            {allocatedUsers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">Add employees to the roster first to use bulk shift allocation</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={bulkDateRange.start}
                    onChange={(e) => setBulkDateRange({...bulkDateRange, start: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={bulkDateRange.end}
                    onChange={(e) => setBulkDateRange({...bulkDateRange, end: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                  <select
                    value={bulkShift}
                    onChange={(e) => setBulkShift(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>{shift.name}</option>
                    ))}
                    <option value="OFF">OFF</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={bulkAllocateShifts}
                    disabled={!bulkShift || selectedUsersForBulk.length === 0}
                    className="w-full px-4 py-2 bg-black border border-black text-white hover:bg-gray-800 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply to Selected ({selectedUsersForBulk.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-black gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex bg-white rounded-lg border border-black">
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-l-lg transition-colors ${
                  viewMode === "week" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-r-lg transition-colors ${
                  viewMode === "month" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Month
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 sm:p-3 text-gray-700 hover:bg-white rounded-lg border border-black transition-colors"
              >
                <ChevronDown className="rotate-90" size={20} />
              </button>
              
              <h3 className="text-base sm:text-xl font-bold text-gray-900 min-w-[200px] sm:min-w-[250px] text-center bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-black">
                {getCalendarTitle()}
              </h3>
              
              <button
                onClick={() => navigateDate(1)}
                className="p-2 sm:p-3 text-gray-700 hover:bg-white rounded-lg border border-black transition-colors"
              >
                <ChevronDown className="-rotate-90" size={20} />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-black border border-black text-white rounded-lg hover:bg-gray-800 text-sm font-semibold transition-colors"
          >
            Today
          </button>
        </div>



        {/* Elegant Roster Calendar */}
        <div className="bg-white rounded-lg border border-black overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-black">
            <h3 className="font-semibold text-gray-900">
              {viewMode === "week" ? "Weekly" : "Monthly"} Roster Calendar
              {allocatedUsers.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">({allocatedUsers.length} employees)</span>
              )}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-4 text-center font-semibold text-gray-900 w-12 border-r border-black">
                    <input
                      type="checkbox"
                      checked={selectedUsersForBulk.length === allocatedUsers.length && allocatedUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsersForBulk(allocatedUsers.map(u => u.id));
                        } else {
                          setSelectedUsersForBulk([]);
                        }
                      }}
                      className="rounded border border-black"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 min-w-[200px] border-r border-black">
                    Employee
                  </th>
                  {getDateRange().map((date) => {
                    const dayName = getDayName(date);
                    const dayNum = new Date(date).getDate();
                    const isWeekend = ['Sat', 'Sun'].includes(dayName);
                    
                    return (
                      <th key={date} className={`px-3 py-4 text-center min-w-[130px] border-r border-black ${
                        isWeekend ? 'bg-gray-100' : ''
                      }`}>
                        <div className={`font-semibold ${
                          isWeekend ? 'text-gray-700' : 'text-gray-900'
                        }`}>{dayName}</div>
                        <div className={`text-sm ${
                          isWeekend ? 'text-gray-600' : 'text-gray-600'
                        }`}>{dayNum}</div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-4 text-center font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {allocatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={getDateRange().length + 3} className="px-8 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar size={48} className="text-gray-300" />
                        <p className="text-lg font-medium">No employees in roster</p>
                        <div className="text-sm space-y-1">
                          <p>Add employees above to start scheduling shifts</p>
                          {hasPermission("view_self") && !isAdmin() && !hasPermission("MANAGE_ROSTER") && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800 font-medium">You have view_self permission</p>
                              <p className="text-blue-600 text-xs">You can only see your own roster entries. If you don't see any data, ask your admin to add you to the roster.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allocatedUsers.map((user, index) => (
                    <tr key={user.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors ${
                      user.is_deleted ? 'bg-red-50 border-l-4 border-red-400' : ''
                    }`}>
                      <td className="px-2 py-4 text-center border-r border-black">
                        <input
                          type="checkbox"
                          checked={selectedUsersForBulk.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsersForBulk([...selectedUsersForBulk, user.id]);
                            } else {
                              setSelectedUsersForBulk(selectedUsersForBulk.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border border-black"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-black">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg border border-black flex items-center justify-center text-gray-700 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-semibold ${user.is_deleted ? 'text-red-700' : 'text-gray-900'}`}>
                              {user.name} {user.is_deleted && '(Deleted)'}
                            </div>
                            <div className={`text-sm ${user.is_deleted ? 'text-red-600' : 'text-gray-600'}`}>
                              {user.employee_code || user.original_employee_id || user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      {getDateRange().map((date) => {
                        const dayName = getDayName(date);
                        const isWeekend = ['Sat', 'Sun'].includes(dayName);
                        const shiftValue = user.roster?.[date] || "";
                        const shift = shifts.find(s => s.id == shiftValue);
                        
                        return (
                          <td key={date} className={`px-3 py-4 border-r border-black ${
                            isWeekend ? 'bg-gray-100' : ''
                          }`}>
                            {editingCell === `${user.id}-${date}` ? (
                              <select
                                value={shiftValue}
                                onChange={async (e) => {
                                  const shiftId = e.target.value ? parseInt(e.target.value) : null;
                                  const status = e.target.value === "OFF" ? "OFF" : "Scheduled";
                                  
                                  // Convert user ID to proper format for backend
                                  let actualUserId = user.id;
                                  if (typeof user.id === 'string' && user.id.startsWith('user_')) {
                                    actualUserId = parseInt(user.id.replace('user_', ''));
                                  } else {
                                    actualUserId = parseInt(user.id);
                                  }
                                  
                                  console.log('Saving roster:', { userId: actualUserId, date, shiftId, status });
                                  updateUserRoster(user.id, date, e.target.value);
                                  await saveRosterEntry(actualUserId, date, shiftId, status, user.name, user.employee_code);
                                  setEditingCell(null);
                                }}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="w-full px-2 py-1 text-sm border border-black rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                              >
                                <option value="">Select</option>
                                {shifts.map((shift) => (
                                  <option key={shift.id} value={shift.id}>{shift.name}</option>
                                ))}
                                <option value="OFF">OFF</option>
                              </select>
                            ) : shiftValue ? (
                              <div className="text-center">
                                <div 
                                  onClick={() => (isAdmin() || hasPermission("MANAGE_ROSTER")) && setEditingCell(`${user.id}-${date}`)}
                                  className={`px-3 py-2 text-sm rounded-lg font-medium border border-black ${
                                    (isAdmin() || hasPermission("MANAGE_ROSTER")) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                                  } ${
                                    shiftValue === "OFF" ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {shiftValue === "OFF" ? "OFF" : shift?.name || "Unknown"}
                                </div>
                                {shift && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {shift.start_time} - {shift.end_time}
                                  </div>
                                )}
                                {(isAdmin() || hasPermission("MANAGE_ROSTER")) && (
                                  <button
                                    onClick={async () => {
                                      // Convert user ID to proper format for backend
                                      let actualUserId = user.id;
                                      if (typeof user.id === 'string' && user.id.startsWith('user_')) {
                                        actualUserId = parseInt(user.id.replace('user_', ''));
                                      } else {
                                        actualUserId = parseInt(user.id);
                                      }
                                      
                                      updateUserRoster(user.id, date, "");
                                      await saveRosterEntry(actualUserId, date, null, "Unscheduled", user.name, user.employee_code);
                                    }}
                                    className="text-xs text-gray-600 hover:text-gray-800 mt-1"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            ) : (
                              (isAdmin() || hasPermission("MANAGE_ROSTER")) ? (
                                <div 
                                  onClick={() => setEditingCell(`${user.id}-${date}`)}
                                  className="text-center text-gray-500 text-sm cursor-pointer hover:text-gray-700 hover:bg-gray-100 py-2 rounded border border-dashed border-gray-300"
                                >
                                  Assign
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 text-sm py-2">
                                  -
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center">
                        {(isAdmin() || hasPermission("MANAGE_ROSTER")) && (
                          <button 
                            onClick={() => removeUserFromRoster(user.id)}
                            className={`px-3 py-1.5 border text-xs rounded-lg font-medium transition-colors ${
                              user.is_deleted 
                                ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' 
                                : 'bg-white border-black text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {user.is_deleted ? 'Restore' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        {/* On-Call / Emergency Duty Management */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-600" />
              On-Call / Emergency Duty Management
            </h2>
            <div className="flex gap-2">
              {(isAdmin() || hasPermission("MANAGE_ON_CALL_DUTY")) && (
                <button
                  onClick={() => setShowOnCallForm(true)}
                  className="bg-black border border-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add On-Call Duty</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Current On-Call Duties</h3>
            {onCallDuties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No on-call duties scheduled</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onCallDuties.map((duty) => (
                  <div key={duty.id} className="bg-gray-50 rounded-lg p-4 border border-black">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{duty.employee_name}</h4>
                        <p className="text-sm text-gray-600">{duty.duty_type} - {duty.priority_level}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                        duty.status === 'Active' ? 'bg-green-100 text-green-800' :
                        duty.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {duty.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{duty.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{duty.from_time} - {duty.to_time}</span>
                      </div>
                      {duty.contact_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{duty.contact_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Night Shift Rules Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Night Shift Rules</h2>
            {(isAdmin() || hasPermission("MANAGE_NIGHT_SHIFT_RULES")) && (
              <button
                onClick={() => {
                  setShowNightShiftRulesList(!showNightShiftRulesList);
                  if (!showNightShiftRulesList) {
                    fetchAllNightShiftRules();
                  }
                }}
                className="bg-black border border-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {showNightShiftRulesList ? 'Hide Rules' : 'View All Rules'}
              </button>
            )}
          </div>

        {showNightShiftRulesList && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-black">
            <h3 className="text-base sm:text-lg font-semibold mb-4">All Night Shift Rules</h3>
            {allNightShiftRules.length === 0 ? (
              <p className="text-gray-600">No night shift rules found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-4 py-2 text-left">ID</th>
                      <th className="border border-black px-4 py-2 text-left">Applicable Shifts</th>
                      <th className="border border-black px-4 py-2 text-left">Punch Out Rule</th>
                      <th className="border border-black px-4 py-2 text-left">Min Hours</th>
                      <th className="border border-black px-4 py-2 text-left">OT Rate</th>
                      <th className="border border-black px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allNightShiftRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className="border border-black px-4 py-2">{rule.id}</td>
                        <td className="border border-black px-4 py-2">
                          {rule.applicable_shifts?.map(shiftId => {
                            const shift = shifts.find(s => s.id === shiftId);
                            return shift ? shift.name : `Shift ${shiftId}`;
                          }).join(', ') || 'None'}
                        </td>
                        <td className="border border-black px-4 py-2">{rule.punch_out_rule}</td>
                        <td className="border border-black px-4 py-2">{rule.minimum_hours} hrs</td>
                        <td className="border border-black px-4 py-2">{rule.night_ot_rate}</td>
                        <td className="border border-black px-4 py-2">
                          <div className="flex gap-2 justify-center">
                            {(isAdmin() || hasPermission("MANAGE_NIGHT_SHIFT_RULES")) && (
                              <>
                                <button
                                  onClick={() => editNightShiftRule(rule.id)}
                                  className="px-2 py-1 bg-white border border-black text-gray-900 text-xs rounded hover:bg-gray-50 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteNightShiftRule(rule.id)}
                                  className="px-2 py-1 bg-white border border-black text-gray-900 text-xs rounded hover:bg-gray-50 font-medium"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Night Shift Rules Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-black">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Night shift applicable for Shifts:
              </label>
              <select
                value={(nightShiftRules.applicable_shifts && nightShiftRules.applicable_shifts[0]) || ""}
                onChange={(e) => {
                  const value = e.target.value ? [parseInt(e.target.value)] : [];
                  setNightShiftRules({...nightShiftRules, applicable_shifts: value});
                }}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>{shift.name}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-black">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Punch Out after midnight counts as:
              </label>
              <select
                value={nightShiftRules.punch_out_rule}
                onChange={(e) => setNightShiftRules({...nightShiftRules, punch_out_rule: e.target.value})}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              >
                <option value="Same day">Same day</option>
                <option value="Next day">Next day</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-black">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Minimum hours for night shift credit:
              </label>
              <input
                type="number"
                value={nightShiftRules.minimum_hours}
                onChange={(e) => setNightShiftRules({...nightShiftRules, minimum_hours: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-black">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Night OT bonus rate:
              </label>
              <select
                value={nightShiftRules.night_ot_rate}
                onChange={(e) => setNightShiftRules({...nightShiftRules, night_ot_rate: e.target.value})}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              >
                <option value="1.25x">1.25x</option>
                <option value="1.5x">1.5x</option>
                <option value="2x">2x</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-black">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Grace time for night login (minutes):
              </label>
              <input
                type="number"
                value={nightShiftRules.grace_minutes}
                onChange={(e) => setNightShiftRules({...nightShiftRules, grace_minutes: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              />
            </div>

            <div className="p-4 bg-white rounded-lg border border-black">
              <div className="text-center">
                {(isAdmin() || hasPermission("MANAGE_NIGHT_SHIFT_RULES")) && (
                  <>
                    <button
                      onClick={editingNightShiftRule ? () => updateNightShiftRule(editingNightShiftRule.id) : saveNightShiftRules}
                      className="px-4 py-2 bg-black border border-black text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors"
                    >
                      {editingNightShiftRule ? 'Update Rule' : 'Save Night Shift Rules'}
                    </button>
                    {editingNightShiftRule && (
                      <button
                        onClick={() => {
                          setEditingNightShiftRule(null);
                          setNightShiftRules({
                            applicable_shifts: [],
                            punch_out_rule: "Same day",
                            minimum_hours: 6,
                            night_ot_rate: "1.5x",
                            grace_minutes: 15
                          });
                        }}
                        className="mt-2 px-4 py-2 bg-gray-100 border border-black text-gray-900 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Create Shift Modal */}
        {showCreateShift && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg border border-black">
              <div className="p-4 sm:p-6 border-b border-black">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Shift</h3>
                  <button
                    onClick={() => setShowCreateShift(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg border border-black transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift Name</label>
                    <input
                      type="text"
                      value={newShift.name}
                      onChange={(e) => setNewShift({...newShift, name: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                      placeholder="e.g., Morning Shift"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newShift.start_time}
                      onChange={(e) => setNewShift({...newShift, start_time: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={newShift.end_time}
                      onChange={(e) => setNewShift({...newShift, end_time: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-black">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateShift(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 border border-black rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createShift}
                    className="flex-1 px-4 py-3 bg-white border border-black text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Create Shift
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* On-Call Duty Modal */}
        {showOnCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-lg border border-black my-8">
              <div className="p-4 sm:p-6 border-b border-black">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Add On-Call Duty</h3>
                  <button
                    onClick={() => setShowOnCallForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg border border-black transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                    <select
                      value={onCallForm.employee_id}
                      onChange={(e) => setOnCallForm({...onCallForm, employee_id: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.employee_code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={onCallForm.date}
                      onChange={(e) => setOnCallForm({...onCallForm, date: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Time</label>
                    <input
                      type="time"
                      value={onCallForm.from_time}
                      onChange={(e) => setOnCallForm({...onCallForm, from_time: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Time</label>
                    <input
                      type="time"
                      value={onCallForm.to_time}
                      onChange={(e) => setOnCallForm({...onCallForm, to_time: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duty Type</label>
                    <select
                      value={onCallForm.duty_type}
                      onChange={(e) => setOnCallForm({...onCallForm, duty_type: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="On-Call">On-Call</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Standby">Standby</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <select
                      value={onCallForm.priority_level}
                      onChange={(e) => setOnCallForm({...onCallForm, priority_level: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={onCallForm.contact_number}
                      onChange={(e) => setOnCallForm({...onCallForm, contact_number: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Emergency contact number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      value={onCallForm.remarks}
                      onChange={(e) => setOnCallForm({...onCallForm, remarks: e.target.value})}
                      className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      rows="3"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-black">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOnCallForm(false)}
                    className="flex-1 px-4 py-3 text-white bg-gray-800 border border-black rounded-lg hover:bg-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOnCallDuty}
                    className="flex-1 px-4 py-3 bg-black border border-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                  >
                    Add On-Call Duty
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Toast toast={toast} hideToast={hideToast} />
      </div>
    </Layout>
  );
}
