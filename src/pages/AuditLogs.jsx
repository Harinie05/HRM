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
            <div key={key} className="flex justify-between py-1 border-b-0">
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
        <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Database className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Audit Logs</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Track all system activities and changes</p>
                <p className="text-gray-500 text-xs hidden sm:block">System Activity Monitoring</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs font-medium">Records</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm relative overflow-hidden border p-4 sm:p-6" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="p-2 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <Filter className="h-5 w-5" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="text"
                placeholder="e.g., CREATE_USER"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="text"
                placeholder="e.g., users"
                value={filters.table_name}
                onChange={(e) => handleFilterChange("table_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="text"
                placeholder="Employee name"
                value={filters.employee_name}
                onChange={(e) => handleFilterChange("employee_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="p-4 sm:p-6 border-b-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Database className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
            </div>
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
              <div className="hidden lg:block overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  <div key={log.id} className="p-4 border-b-0 hover:bg-gray-50">
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
            <div className="px-4 sm:px-6 py-3 border-t-0 bg-gray-50">
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center justify-between p-6 border-b-0">
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
                
                <div className="-t-0 pt-4">
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
