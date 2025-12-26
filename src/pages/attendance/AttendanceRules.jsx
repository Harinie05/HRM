import { useEffect, useState } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

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
    <div className="flex bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 pt-24 space-y-6">
          {/* Header with gradient background matching Organization setup */}
          <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance Rules & Policies</h1>
                  <p className="text-gray-600 text-base mb-1">Advanced rule engine for attendance policies, location management, and compliance settings</p>
                  <p className="text-gray-500 text-sm">Attendance Management System</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">{rules.length + locations.length} Active Rules</span>
                </div>
                <p className="text-base font-bold text-gray-900">Real-time Updates</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ATTENDANCE RULES */}
            <div className="bg-white rounded-3xl border border-black shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Attendance Rules</h3>
                    <p className="text-gray-600 text-sm">Configure late, early, and overtime policies</p>
                  </div>
                  <button 
                    onClick={() => setShowRuleModal(true)}
                    className="bg-white text-black border border-black px-4 py-2 rounded-2xl font-medium hover:bg-gray-50 transition-colors text-sm shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                    </svg>
                    Add Rule
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rule</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl border border-black flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-600">No rules configured</p>
                                <p className="text-sm text-gray-400">Add your first attendance rule to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rules.map((r, index) => (
                          <tr key={r.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.rule_name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-2xl text-xs font-medium border border-black ${
                                r.rule_type === 'Late' ? 'bg-white text-gray-800' :
                                r.rule_type === 'Early' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {r.rule_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{r.value} mins</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleToggleRule(r.id, r.is_active)}
                                className={`px-3 py-1 rounded-2xl text-xs font-medium cursor-pointer transition-all border border-black ${
                                  r.is_active ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {r.is_active ? "Active" : "Disabled"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleDeleteRule(r.id)}
                                className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-2 py-1 rounded border border-black hover:bg-gray-100"
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

            {/* ATTENDANCE LOCATIONS */}
            <div className="bg-white rounded-3xl border border-black shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Attendance Locations</h3>
                    <p className="text-gray-600 text-sm">Manage attendance capture locations</p>
                  </div>
                  <button 
                    onClick={() => setShowLocationModal(true)}
                    className="bg-white text-black border border-black px-4 py-2 rounded-2xl font-medium hover:bg-gray-50 transition-colors text-sm shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                    </svg>
                    Add Location
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grace Time</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl border border-black flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-600">No locations configured</p>
                                <p className="text-sm text-gray-400">Add your first attendance location to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        locations.map((loc, index) => (
                          <tr key={loc.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{loc.location_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{loc.grace_time} mins</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleToggleLocation(loc.id)}
                                className={`px-3 py-1 rounded-2xl text-xs font-medium cursor-pointer transition-all border border-black ${
                                  loc.is_active ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {loc.is_active ? "Active" : "Disabled"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleDeleteLocation(loc.id)}
                                className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-2 py-1 rounded border border-black hover:bg-gray-100"
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
        
        <Footer />
      </div>

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-black shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Attendance Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name</label>
                <input
                  type="text"
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  placeholder="e.g., Late Entry Default"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Rule Type</label>
                <select
                  value={ruleForm.rule_type}
                  onChange={(e) => setRuleForm({...ruleForm, rule_type: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                >
                  <option value="Late">Late</option>
                  <option value="Early">Early</option>
                  <option value="OT">OT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Value (minutes)</label>
                <input
                  type="number"
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({...ruleForm, value: parseInt(e.target.value)})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-white text-black border border-black py-3 rounded-2xl hover:bg-gray-50 font-medium transition-colors"
              >
                Add Rule
              </button>
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 border border-black py-3 rounded-2xl hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-black shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Attendance Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Location Name</label>
                <input
                  type="text"
                  value={locationForm.location_name}
                  onChange={(e) => setLocationForm({...locationForm, location_name: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  placeholder="e.g., Main Office"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Grace Time (minutes)</label>
                <input
                  type="number"
                  value={locationForm.grace_time}
                  onChange={(e) => setLocationForm({...locationForm, grace_time: parseInt(e.target.value)})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">OT Rule (optional)</label>
                <input
                  type="text"
                  value={locationForm.ot_rule}
                  onChange={(e) => setLocationForm({...locationForm, ot_rule: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  placeholder="e.g., OT > 30 mins"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddLocation}
                className="flex-1 bg-white text-black border border-black py-3 rounded-2xl hover:bg-gray-50 font-medium transition-colors"
              >
                Add Location
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 border border-black py-3 rounded-2xl hover:bg-gray-200 font-medium transition-colors"
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
