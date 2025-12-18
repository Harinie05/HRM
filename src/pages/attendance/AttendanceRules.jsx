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
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">Attendance · Rules, Policy & Locations</div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Attendance Rules, Policy & Locations
            </h1>
            <p className="text-gray-500">
              Configure attendance rules, policies, and location settings for your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ATTENDANCE RULES */}
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Attendance Rules</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure late, early, and overtime rules</p>
                </div>
                <button 
                  onClick={() => setShowRuleModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Add Rule
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Rule</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Type</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Value</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">No rules configured</td>
                      </tr>
                    ) : (
                      rules.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-800">{r.rule_name}</td>
                          <td className="p-4 text-sm text-gray-800">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              r.rule_type === 'Late' ? 'bg-red-100 text-red-800' :
                              r.rule_type === 'Early' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {r.rule_type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-800">{r.value} mins</td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleToggleRule(r.id, r.is_active)}
                              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Attendance Locations</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage attendance capture locations</p>
                </div>
                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  + Add Location
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Location</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Grace Time</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">No locations configured</td>
                      </tr>
                    ) : (
                      locations.map((loc) => (
                        <tr key={loc.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-800">{loc.location_name}</td>
                          <td className="p-4 text-sm text-gray-800">{loc.grace_time} mins</td>
                          <td className="p-4 text-sm">
                            <button
                              onClick={() => handleToggleLocation(loc.id)}
                              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                loc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
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
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
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
