import { useState, useEffect } from "react";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { FiBarChart, FiCalendar, FiFileText, FiTrendingUp } from 'react-icons/fi';

export default function AttendanceReports() {
  const [report, setReport] = useState([]);
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          const newColors = {
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          };
          setColors(newColors);
          document.documentElement.style.setProperty('--primary-color', newColors.primary);
          document.documentElement.style.setProperty('--secondary-color', newColors.secondary);
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const loadDaily = async () => {
    try {
      const res = await api.get("/api/attendance/reports/daily");
      setReport(res.data);
      showToast("Daily report loaded successfully", "success");
    } catch (err) {
      console.error("Failed to load daily report:", err);
      showToast("Failed to load daily report", "error");
    }
  };

  const loadMonthly = async () => {
    try {
      const res = await api.get("/api/attendance/reports/monthly");
      setReport(res.data);
      showToast("Monthly report loaded successfully", "success");
    } catch (err) {
      console.error("Failed to load monthly report:", err);
      showToast("Failed to load monthly report", "error");
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Key Performance Indicators matching Dashboard */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiBarChart className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reports Overview</h2>
                <p className="text-sm text-gray-600">Comprehensive attendance analytics and reporting dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{report.length}</p>
                <p className="text-gray-400 text-xs mt-1">Report entries</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiFileText className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Report Type</p>
                <p className="text-2xl font-bold text-gray-900">{report.length > 0 ? 'Generated' : 'None'}</p>
                <p className="text-gray-400 text-xs mt-1">Current data</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiBarChart className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Data Status</p>
                <p className="text-2xl font-bold text-gray-900">Live</p>
                <p className="text-gray-400 text-xs mt-1">Real-time updates</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiTrendingUp className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Last Updated</p>
                <p className="text-2xl font-bold text-gray-900">Now</p>
                <p className="text-gray-400 text-xs mt-1">Current time</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiCalendar className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Report Actions matching Dashboard */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiBarChart className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Reports</h3>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={loadDaily}
                className="flex-1 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <FiCalendar className="h-4 w-4" />
                Daily Report
              </button>
              <button
                onClick={loadMonthly}
                className="flex-1 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <FiBarChart className="h-4 w-4" />
                Monthly Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Content matching Dashboard */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiFileText className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Data</h2>
                  <p className="text-gray-600">Attendance analytics and insights</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {report.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                }}>
                  <FiBarChart className="h-8 w-8" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Report Data</h4>
                <p className="text-gray-600 mb-6">Click on Daily Report or Monthly Report to generate attendance data</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {report.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl transition-all duration-300" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <FiFileText className="h-6 w-6" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{item.employee || 'N/A'}</h3>
                          <p className="text-sm text-gray-600 mt-1">Employee record</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">Date</span>
                          <span className="text-sm font-bold text-gray-900 text-right">
                            {item.date || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">Status</span>
                          <span className="text-sm font-bold text-gray-900 text-right break-words">
                            {item.status || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Hours</span>
                          <span className="text-sm font-bold text-gray-900">{item.hours || 'N/A'}</span>
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
