import { useEffect, useState } from "react";
import { FiBell, FiAlertTriangle, FiCalendar, FiUser, FiShield } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function LicenseAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/employee/medical/license-alerts");
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error("Failed to fetch license alerts", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const criticalAlerts = alerts.filter(alert => alert.alert_level === 'critical');
  const warningAlerts = alerts.filter(alert => alert.alert_level === 'warning');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading license alerts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-100 border border-black rounded-2xl flex items-center justify-center">
            <FiBell className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              License Renewal Alerts
            </h1>
            <p className="text-gray-600 mb-2">
              Monitor professional license expiry dates
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{criticalAlerts.length} Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{warningAlerts.length} Warning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black shadow-sm p-8 text-center">
            <FiShield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Licenses Up to Date</h3>
            <p className="text-gray-600">No licenses are expiring soon. Great job keeping everything current!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FiAlertTriangle className="text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">Critical Alerts (≤7 days)</h2>
                </div>
                <div className="grid gap-4">
                  {criticalAlerts.map((alert, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FiUser className="text-red-600" />
                            <span className="font-medium text-red-900">Employee ID: {alert.employee_id}</span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              URGENT
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-red-700 font-medium">License Type:</span>
                              <div className="text-red-900">{alert.license_type}</div>
                            </div>
                            <div>
                              <span className="text-red-700 font-medium">License Number:</span>
                              <div className="text-red-900">{alert.license_number}</div>
                            </div>
                            <div>
                              <span className="text-red-700 font-medium">Expiry Date:</span>
                              <div className="text-red-900 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {alert.expiry_date}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">{alert.days_until_expiry}</div>
                          <div className="text-xs text-red-700">days left</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FiBell className="text-yellow-600" />
                  <h2 className="text-xl font-semibold text-yellow-600">Warning Alerts</h2>
                </div>
                <div className="grid gap-4">
                  {warningAlerts.map((alert, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FiUser className="text-yellow-600" />
                            <span className="font-medium text-yellow-900">Employee ID: {alert.employee_id}</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                              WARNING
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-yellow-700 font-medium">License Type:</span>
                              <div className="text-yellow-900">{alert.license_type}</div>
                            </div>
                            <div>
                              <span className="text-yellow-700 font-medium">License Number:</span>
                              <div className="text-yellow-900">{alert.license_number}</div>
                            </div>
                            <div>
                              <span className="text-yellow-700 font-medium">Expiry Date:</span>
                              <div className="text-yellow-900 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {alert.expiry_date}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-600">{alert.days_until_expiry}</div>
                          <div className="text-xs text-yellow-700">days left</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}