import { useEffect, useState } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function AttendanceRules() {
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ rule_name: '', rule_type: 'Late', value: 10 });
  const [locationForm, setLocationForm] = useState({ location_name: '', grace_time: 10, ot_rule: '' });

  useEffect(() => {
    loadRules();
    loadLocations();
  }, []);

  const loadRules = async () => {
    try {
      const res = await api.get("/api/attendance/rules/");
      setRules(res.data);
    } catch (err) {
      console.error("Failed to load rules:", err);
    }
  };

  const loadLocations = async () => {
    try {
      const res = await api.get("/api/attendance/locations/");
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to load locations:", err);
    }
  };

  const handleAddRule = async () => {
    try {
      await api.post('/api/attendance/rules/', ruleForm);
      setShowRuleModal(false);
      setRuleForm({ rule_name: '', rule_type: 'Late', value: 10 });
      loadRules();
      alert('Rule added successfully!');
    } catch (err) {
      alert('Failed to add rule');
    }
  };

  const handleToggleRule = async (id, currentStatus) => {
    try {
      await api.patch(`/api/attendance/rules/${id}/toggle`);
      loadRules();
    } catch (err) {
      alert('Failed to toggle rule status');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.delete(`/api/attendance/rules/${id}/`);
      loadRules();
      alert('Rule deleted!');
    } catch (err) {
      alert('Failed to delete rule');
    }
  };

  const handleAddLocation = async () => {
    try {
      await api.post('/api/attendance/locations/', locationForm);
      setShowLocationModal(false);
      setLocationForm({ location_name: '', grace_time: 10, ot_rule: '' });
      loadLocations();
      alert('Location added successfully!');
    } catch (err) {
      alert('Failed to add location');
    }
  };

  const handleToggleLocation = async (id) => {
    try {
      await api.patch(`/api/attendance/locations/${id}/toggle`);
      loadLocations();
    } catch (err) {
      alert('Failed to toggle location status');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!confirm('Delete this location?')) return;
    try {
      await api.delete(`/api/attendance/locations/${id}/`);
      loadLocations();
      alert('Location deleted!');
    } catch (err) {
      alert('Failed to delete location');
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 pt-24">
          <div className="text-sm text-muted mb-3">Attendance · Rules, Policy & Locations</div>
          
          <div className="mb-6">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary">Attendance Rules & Policies</h1>
                    <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Advanced rule engine for attendance policies, location management, and compliance settings</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{rules.length + locations.length}</div>
                    <div className="text-sm text-muted">Total Rules</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ATTENDANCE RULES */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-8 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Attendance Rules
                  </h2>
                  <p className="text-sm text-secondary mt-2">Configure late, early, and overtime policies</p>
                </div>
                <button 
                  onClick={() => setShowRuleModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  + Add Rule
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
                  <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Rule</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Type</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Value</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Status</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-muted">No rules configured</td>
                      </tr>
                    ) : (
                      rules.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-content" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                          <td className="p-4 text-sm text-primary">{r.rule_name}</td>
                          <td className="p-4 text-sm text-primary">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              r.rule_type === 'Late' ? 'bg-red-100 text-red-800' :
                              r.rule_type === 'Early' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {r.rule_type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-primary">{r.value} mins</td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleToggleRule(r.id, r.is_active)}
                              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-primary'
                              }`}
                            >
                              {r.is_active ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleDeleteRule(r.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ATTENDANCE LOCATIONS */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-8 border-b bg-gradient-to-r from-indigo-50 to-blue-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Attendance Locations
                  </h2>
                  <p className="text-sm text-secondary mt-2">Manage attendance capture locations</p>
                </div>
                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  + Add Location
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
                  <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Location</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Grace Time</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Status</th>
                      <th className="p-4 text-left text-sm font-semibold text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-muted">No locations configured</td>
                      </tr>
                    ) : (
                      locations.map((loc) => (
                        <tr key={loc.id} className="border-b hover:bg-content" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                          <td className="p-4 text-sm text-primary">{loc.location_name}</td>
                          <td className="p-4 text-sm text-primary">{loc.grace_time} mins</td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleToggleLocation(loc.id)}
                              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                loc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-primary'
                              }`}
                            >
                              {loc.is_active ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Attendance Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Late Entry Default"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rule Type</label>
                <select
                  value={ruleForm.rule_type}
                  onChange={(e) => setRuleForm({...ruleForm, rule_type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Late">Late</option>
                  <option value="Early">Early</option>
                  <option value="OT">OT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value (minutes)</label>
                <input
                  type="number"
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({...ruleForm, value: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add Rule
              </button>
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 bg-gray-200 text-primary py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Attendance Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location Name</label>
                <input
                  type="text"
                  value={locationForm.location_name}
                  onChange={(e) => setLocationForm({...locationForm, location_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Main Office"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grace Time (minutes)</label>
                <input
                  type="number"
                  value={locationForm.grace_time}
                  onChange={(e) => setLocationForm({...locationForm, grace_time: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">OT Rule (optional)</label>
                <input
                  type="text"
                  value={locationForm.ot_rule}
                  onChange={(e) => setLocationForm({...locationForm, ot_rule: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., OT > 30 mins"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Add Location
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 bg-gray-200 text-primary py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
