import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import Layout from "../../components/Layout";
import { FiMapPin, FiClock, FiSettings, FiShield } from 'react-icons/fi';

export default function AttendanceLocations() {
  const [locations, setLocations] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await api.get("/attendance/locations/");
      setLocations(res.data);
      showToast("Locations loaded successfully", "success");
    } catch (error) {
      console.error("Failed to load locations:", error);
      showToast("Failed to load locations", "error");
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Hero Header matching Dashboard */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiMapPin className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance Locations</h1>
                <p className="text-gray-600 text-sm mb-1">Manage attendance rules and location settings</p>
                <p className="text-gray-500 text-xs">Location & Policy Management</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiMapPin className="h-3 w-3" />
                  <span className="text-xs font-medium">Locations</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators matching Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                <p className="text-gray-400 text-xs mt-1">Configured sites</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiMapPin className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Active Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.filter(l => l.is_active).length}</p>
                <p className="text-gray-400 text-xs mt-1">Currently enabled</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiShield className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Grace Time</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length > 0 ? Math.max(...locations.map(l => l.grace_time || 0)) : 0}</p>
                <p className="text-gray-400 text-xs mt-1">Max minutes</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiClock className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">OT Rules</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(locations.map(l => l.ot_rule)).size}</p>
                <p className="text-gray-400 text-xs mt-1">Unique policies</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiSettings className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Locations List matching Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiMapPin className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Directory</h2>
                  <p className="text-gray-600">Attendance rules and location-based policies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {locations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                }}>
                  <FiMapPin className="h-8 w-8" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Locations Found</h4>
                <p className="text-gray-600">Attendance locations will appear here once configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {locations.map((location, index) => (
                  <div key={location.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl transition-all duration-300" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <FiMapPin className="h-6 w-6" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{location.location_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Attendance location</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${location.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-xs font-medium text-gray-700">{location.is_active ? 'Active' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">Grace Time</span>
                          <span className="text-sm font-bold text-gray-900 text-right">
                            {location.grace_time} minutes
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">OT Rule</span>
                          <span className="text-sm font-bold text-gray-900 text-right break-words">
                            {location.ot_rule}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${location.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs font-medium text-gray-700">{location.is_active ? 'Active Location' : 'Disabled Location'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

