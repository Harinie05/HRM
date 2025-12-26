import { useEffect, useState } from "react";
import { Plus, Building2, Users, Search, Filter, Eye, Edit3, Trash2, MapPin, Calendar } from "lucide-react";
import api from "../../api";

export default function OrgDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const tenant_db = localStorage.getItem("tenant_db");

  const [newDept, setNewDept] = useState({
    name: "",
    description: "",
    location: "",
    head: ""
  });

  const departmentColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
  ];

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.log("Error loading departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const createDepartment = async () => {
    if (!newDept.name) {
      alert("Please enter a department name");
      return;
    }
    
    try {
      const response = await api.post(`/hospitals/departments/${tenant_db}/create`, newDept);
      alert("Department created successfully");
      setNewDept({ name: "", description: "", location: "", head: "" });
      setShowCreateDept(false);
      await fetchDepartments();
    } catch (err) {
      console.error("Failed to create department", err);
      alert(`Failed to create department: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteDepartment = async (id) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/hospitals/departments/${tenant_db}/${id}`);
      alert("Department deleted successfully");
      await fetchDepartments();
    } catch (err) {
      console.error("Failed to delete department", err);
      alert(`Failed to delete department: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDepartmentColor = (index) => {
    return departmentColors[index % departmentColors.length];
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDepartments.map((dept, index) => (
        <div key={dept.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${getDepartmentColor(index)} rounded-lg flex items-center justify-center text-white`}>
                <Building2 size={24} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => deleteDepartment(dept.id)}
                  className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary mb-1">{dept.name}</h3>
              <p className="text-sm text-muted line-clamp-2">
                {dept.description || 'No description provided'}
              </p>
            </div>
            
            <div className="space-y-2">
              {dept.location && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <MapPin size={14} />
                  <span>{dept.location}</span>
                </div>
              )}
              {dept.head && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Users size={14} />
                  <span>Head: {dept.head}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Calendar size={14} />
                <span>Created: {new Date(dept.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full divide-y">
          <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Head</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-white divide-y">
            {filteredDepartments.map((dept, index) => (
              <tr key={dept.id} className="hover:bg-content">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${getDepartmentColor(index)} rounded-lg flex items-center justify-center text-white mr-3`}>
                      <Building2 size={20} />
                    </div>
                    <div className="text-sm font-medium text-primary">{dept.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-muted max-w-xs truncate">
                    {dept.description || <span className="italic text-muted">No description</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-muted">
                    {dept.location || <span className="italic text-muted">Not specified</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-muted">
                    {dept.head || <span className="italic text-muted">Not assigned</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b  px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Department Overview</h1>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>View all departments configured in the system</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="" style={{color: 'var(--text-secondary, #374151)'}} />
              <span className="text-sm font-medium text-secondary">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-secondary hover:text-primary'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-secondary hover:text-primary'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-3 h-3">
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                  </div>
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Create Department Form */}
        {showCreateDept && (
          <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="px-6 py-4 border-b ">
              <h3 className="text-lg font-semibold text-primary">Create New Department</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Department Name</label>
                  <input
                    type="text"
                    value={newDept.name}
                    onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Human Resources, IT Department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Location</label>
                  <input
                    type="text"
                    value={newDept.location}
                    onChange={(e) => setNewDept({...newDept, location: e.target.value})}
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Building A, Floor 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Department Head</label>
                  <input
                    type="text"
                    value={newDept.head}
                    onChange={(e) => setNewDept({...newDept, head: e.target.value})}
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Description</label>
                  <textarea
                    value={newDept.description}
                    onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe the department's role and responsibilities..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createDepartment}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Department
                </button>
                <button
                  onClick={() => setShowCreateDept(false)}
                  className="px-4 py-2 bg-white border-dark text-secondary text-sm font-medium rounded-lg hover:bg-content transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Departments Display */}
        <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="px-6 py-4 border-b ">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">Departments</h2>
                <p className=" text-sm" style={{color: 'var(--text-secondary, #374151)'}}>Manage organizational departments and their details</p>
              </div>
              <div className="text-sm text-muted">
                {filteredDepartments.length} of {departments.length} departments
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 size={32} className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {searchTerm ? 'No matching departments found' : 'No departments found'}
                </h3>
                <p className="" style={{color: 'var(--text-muted, #6b7280)'}}>
                  {searchTerm 
                    ? 'Try adjusting your search criteria' 
                    : 'Create your first department to get started'}
                </p>
              </div>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderTableView()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
