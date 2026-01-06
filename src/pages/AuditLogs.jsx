import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Database, Eye, Filter, Calendar, User, Activity, Search, Download } from "lucide-react";
import api from "../api";

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: "",
    table_name: "",
    employee_name: "",
    start_date: "",
    end_date: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      console.log("Fetching audit logs with filters:", filters);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      console.log("API URL:", `/api/audit/logs?${params.toString()}`);
      const res = await api.get(`/api/audit/logs?${params.toString()}`);
      console.log("API Response:", res.data);
      
      setAuditLogs(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      console.error("Error details:", error.response?.data);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    if (action.includes("CREATE")) return "text-green-700 bg-green-50";
    if (action.includes("UPDATE")) return "text-blue-700 bg-blue-50";
    if (action.includes("DELETE")) return "text-red-700 bg-red-50";
    if (action.includes("VIEW")) return "text-gray-700 bg-gray-50";
    return "text-purple-700 bg-purple-50";
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-black shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Database className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600">Track all system activities and changes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-black shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                placeholder="e.g., CREATE_USER"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <input
                type="text"
                placeholder="e.g., users"
                value={filters.table_name}
                onChange={(e) => handleFilterChange("table_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <input
                type="text"
                placeholder="Employee name"
                value={filters.employee_name}
                onChange={(e) => handleFilterChange("employee_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-black shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(() => {
                              if (log.employee_name && log.employee_code) {
                                return `${log.employee_name} (${log.employee_code})`;
                              } else if (log.employee_name && log.employee_id_onboarding) {
                                return `${log.employee_name} (${log.employee_id_onboarding})`;
                              } else if (log.employee_name) {
                                return log.employee_name;
                              }
                              return "System";
                            })()
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            if (log.action.includes('CREATE')) {
                              return log.new_values?.name ? `Created: ${log.new_values.name}` : 'Created new record';
                            } else if (log.action.includes('UPDATE')) {
                              const oldName = log.old_values?.name;
                              const newName = log.new_values?.name;
                              if (oldName && newName && oldName !== newName) {
                                return `${oldName} → ${newName}`;
                              }
                              return 'Updated record';
                            } else if (log.action.includes('DELETE')) {
                              return log.old_values?.name ? `Deleted: ${log.old_values.name}` : 'Deleted record';
                            }
                            return 'Action performed';
                          })()
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Employee:</span>
                        <span className="text-sm text-gray-600">
                          {(() => {
                            if (log.employee_name && log.employee_code) {
                              return `${log.employee_name} (${log.employee_code})`;
                            } else if (log.employee_name && log.employee_id_onboarding) {
                              return `${log.employee_name} (${log.employee_id_onboarding})`;
                            } else if (log.employee_name) {
                              return log.employee_name;
                            }
                            return "System";
                          })()
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Table:</span>
                        <span className="text-sm text-gray-600">{log.table_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Details:</span>
                        <span className="text-sm text-gray-600 text-right max-w-xs truncate">
                          {(() => {
                            if (log.action.includes('CREATE')) {
                              return log.new_values?.name ? `Created: ${log.new_values.name}` : 'Created new record';
                            } else if (log.action.includes('UPDATE')) {
                              const oldName = log.old_values?.name;
                              const newName = log.new_values?.name;
                              if (oldName && newName && oldName !== newName) {
                                return `${oldName} → ${newName}`;
                              }
                              return 'Updated record';
                            } else if (log.action.includes('DELETE')) {
                              return log.old_values?.name ? `Deleted: ${log.old_values.name}` : 'Deleted record';
                            }
                            return 'Action performed';
                          })()
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">IP:</span>
                        <span className="text-sm text-gray-600">{log.ip_address || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}