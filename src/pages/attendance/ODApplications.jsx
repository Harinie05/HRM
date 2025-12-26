import { useEffect, useState } from "react";
import { Plus, Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import api from "../../api";

export default function ODApplications() {
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    od_date: "",
    purpose: "",
    from_time: "09:00",
    to_time: "18:00",
    location: ""
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchEmployees();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/api/attendance/od/");
      setApplications(res.data || []);
    } catch (error) {
      console.error("Error fetching OD applications:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const res = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post("/api/attendance/od/", {
        ...formData,
        employee_id: parseInt(formData.employee_id)
      });
      
      setShowModal(false);
      setFormData({
        employee_id: "",
        od_date: "",
        purpose: "",
        from_time: "09:00",
        to_time: "18:00",
        location: ""
      });
      fetchApplications();
      alert("OD application submitted successfully!");
    } catch (error) {
      console.error("Error submitting OD application:", error);
      alert("Failed to submit OD application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/attendance/od/${id}/approve`);
      fetchApplications();
      alert("OD application approved!");
    } catch (error) {
      console.error("Error approving OD application:", error);
      alert("Failed to approve OD application.");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/api/attendance/od/${id}/reject`);
      fetchApplications();
      alert("OD application rejected!");
    } catch (error) {
      console.error("Error rejecting OD application:", error);
      alert("Failed to reject OD application.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
      {/* Header */}
      <div className="p-6 border-b ">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-primary">OD Applications</h2>
            <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Manage On Duty applications for employees</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Apply OD
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="overflow-x-auto">
        <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
          <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-white divide-y">
            {applications.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted" />
                  <h3 className="mt-2 text-sm font-medium text-primary">No OD applications</h3>
                  <p className="mt-1 text-sm text-muted">Start by applying for an OD.</p>
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const employee = employees.find(emp => emp.id === app.employee_id);
                return (
                  <tr key={app.id} className="hover:bg-content">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary">
                        {employee?.name || `Employee ${app.employee_id}`}
                      </div>
                      <div className="text-sm text-muted">
                        ID: {app.employee_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-primary">
                        <Calendar size={16} className="mr-2 text-muted" />
                        {new Date(app.od_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-primary">
                        <Clock size={16} className="mr-2 text-muted" />
                        {app.from_time} - {app.to_time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary max-w-xs truncate">
                        {app.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-primary">
                        <MapPin size={16} className="mr-2 text-muted" />
                        {app.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {app.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleApprove(app.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleReject(app.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Apply OD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Apply for OD</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">OD Date</label>
                <input
                  type="date"
                  value={formData.od_date}
                  onChange={(e) => setFormData({...formData, od_date: e.target.value})}
                  className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">From Time</label>
                  <input
                    type="time"
                    value={formData.from_time}
                    onChange={(e) => setFormData({...formData, from_time: e.target.value})}
                    className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">To Time</label>
                  <input
                    type="time"
                    value={formData.to_time}
                    onChange={(e) => setFormData({...formData, to_time: e.target.value})}
                    className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Purpose</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Reason for OD..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="OD location (optional)"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border-dark rounded-lg text-secondary hover:bg-content"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
