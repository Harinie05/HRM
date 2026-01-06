import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Database, Eye, Filter, Calendar, User, Activity, Search, Download, X } from "lucide-react";
import api from "../api";

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
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

  const openModal = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setShowModal(false);
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

  const formatFieldName = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  const renderDataDetails = (data, title) => {
    if (!data || typeof data !== 'object') return null;
    
    return (
      <div className="mb-3">
        <strong className="text-gray-700">{title}:</strong>
        <div className="mt-1 space-y-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 border-b border-gray-100">
              <span className="font-medium text-gray-600">{formatFieldName(key)}:</span>
              <span className="text-gray-800 max-w-xs text-right break-words">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-black shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Database className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-sm sm:text-base text-gray-600">Track all system activities and changes</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-black shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                placeholder="e.g., CREATE_USER"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <input
                type="text"
                placeholder="e.g., users"
                value={filters.table_name}
                onChange={(e) => handleFilterChange("table_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <input
                type="text"
                placeholder="Employee name"
                value={filters.employee_name}
                onChange={(e) => handleFilterChange("employee_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-black shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
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
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-32 truncate">{formatDate(log.created_at)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-40 break-words">
                            {log.employee_name || "System"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-24 truncate">{log.table_name}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {(() => {
                                if (log.action.includes('CREATE')) {
                                  return 'Created new record';
                                } else if (log.action.includes('UPDATE')) {
                                  return 'Updated record';
                                } else if (log.action.includes('DELETE')) {
                                  return 'Deleted record';
                                } else if (log.action.includes('VIEW')) {
                                  return 'Action performed';
                                }
                                return 'Action performed';
                              })()
                              }
                            </div>
                            {(log.old_values || log.new_values) && (
                              <button
                                onClick={() => openModal(log)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-900">Employee:</span>
                        <span className="text-sm text-gray-600 text-right max-w-48 break-words">
                          {log.employee_name || "System"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Table:</span>
                        <span className="text-sm text-gray-600">{log.table_name}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-900">Details:</span>
                        <div className="text-right max-w-48">
                          <div className="text-sm text-gray-600 truncate">
                            {(() => {
                              if (log.action.includes('CREATE')) {
                                return 'Created new record';
                              } else if (log.action.includes('UPDATE')) {
                                return 'Updated record';
                              } else if (log.action.includes('DELETE')) {
                                return 'Deleted record';
                              }
                              return 'Action performed';
                            })()
                            }
                          </div>
                          {(log.old_values || log.new_values) && (
                            <button
                              onClick={() => openModal(log)}
                              className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer mt-1"
                            >
                              View Details
                            </button>
                          )}
                        </div>
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
            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total records)
                </div>
                <div className="flex gap-2 justify-center sm:justify-end">
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

      {/* Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Action:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Table:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedLog.table_name}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm font-medium text-gray-500">Employee:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {selectedLog.employee_name || "System"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Timestamp:</span>
                    <span className="ml-2 text-sm text-gray-900">{formatDate(selectedLog.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">IP Address:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedLog.ip_address || "N/A"}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  {selectedLog.action.includes('CREATE') && selectedLog.new_values && 
                    renderDataDetails(selectedLog.new_values, 'Created Data')
                  }
                  {selectedLog.action.includes('UPDATE') && (
                    <div className="space-y-4">
                      {selectedLog.old_values && renderDataDetails(selectedLog.old_values, 'Previous Values')}
                      {selectedLog.new_values && renderDataDetails(selectedLog.new_values, 'Updated Values')}
                    </div>
                  )}
                  {selectedLog.action.includes('DELETE') && selectedLog.old_values && 
                    renderDataDetails(selectedLog.old_values, 'Deleted Data')
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}