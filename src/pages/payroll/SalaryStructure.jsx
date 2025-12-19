import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import api from "../../api";

export default function SalaryStructure() {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ctc: 0,
    basic_percent: 40,
    hra_percent: 20,
    allowances: "",
    deductions: "",
    is_active: true
  });

  useEffect(() => {
    fetchStructures();
    fetchEmployees();
    fetchGrades();
  }, []);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/payroll/salary-structures");
      setStructures(res.data || []);
    } catch (error) {
      console.error("Error fetching salary structures:", error);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenantDb = localStorage.getItem('tenant_db');
      const res = await api.get(`/api/users/${tenantDb}/list`);
      setEmployees(res.data?.users?.filter(u => u.is_employee) || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await api.get("/api/organization/grades");
      setGrades(res.data || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        allowances: formData.allowances || "",
        deductions: formData.deductions || ""
      };
      
      if (editingStructure) {
        await api.put(`/api/payroll/salary-structures/${editingStructure.id}`, payload);
      } else {
        await api.post("/api/payroll/salary-structures", payload);
      }
      await fetchStructures();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving salary structure:", error);
      alert("Failed to save salary structure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this salary structure?")) {
      try {
        await api.delete(`/api/payroll/salary-structures/${id}`);
        fetchStructures();
      } catch (error) {
        console.error("Error deleting salary structure:", error);
      }
    }
  };

  const handleOpenModal = (structure = null) => {
    if (structure) {
      setEditingStructure(structure);
      setFormData({
        name: structure.name || "",
        ctc: structure.ctc || 0,
        basic_percent: structure.basic_percent || 40,
        hra_percent: structure.hra_percent || 20,
        allowances: structure.allowances || "",
        deductions: structure.deductions || "",
        is_active: structure.is_active ?? true
      });
    } else {
      setEditingStructure(null);
      setFormData({
        name: "",
        ctc: 0,
        basic_percent: 40,
        hra_percent: 20,
        allowances: "",
        deductions: "",
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStructure(null);
  };

  const handleViewStructure = (structure) => {
    alert(`Structure Details:\n\nName: ${structure.name}\nAnnual CTC: ₹${structure.ctc?.toLocaleString()}\nMonthly: ₹${((structure.ctc || 0) / 12).toLocaleString()}\nBasic: ${structure.basic_percent}%\nHRA: ${structure.hra_percent}%\nStatus: ${structure.is_active ? 'Active' : 'Inactive'}`);
  };

  const filteredStructures = structures.filter(structure =>
    structure.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Salary Structure</h2>
            <p className="text-gray-600 mt-1">Define CTC structure, earnings and deductions</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Salary Structure
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search salary structures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual CTC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HRA %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? "No salary structures found matching your search." : "No salary structures configured yet."}
                  </td>
                </tr>
              ) : (
                filteredStructures.map((structure) => {
                  const employeeCount = employees.filter(emp => 
                    emp.designation && structure.name.toLowerCase().includes(emp.designation.toLowerCase())
                  ).length;
                  
                  return (
                    <tr key={structure.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{structure.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{structure.ctc?.toLocaleString()}/year</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{structure.basic_percent}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{structure.hra_percent}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employeeCount} employees</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          structure.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {structure.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewStructure(structure)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(structure)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Structure"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(structure.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Structure"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total: {structures.length} salary structures</span>
          <span>Active: {structures.filter(s => s.is_active).length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingStructure ? "Edit Salary Structure" : "Add Salary Structure"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Structure Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Senior Developer, Manager Level"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost to Company (CTC) - Annually</label>
                <input
                  type="number"
                  value={formData.ctc}
                  onChange={(e) => setFormData({...formData, ctc: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter annual CTC amount"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the total annual cost to company</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic %</label>
                  <input
                    type="number"
                    value={formData.basic_percent}
                    onChange={(e) => setFormData({...formData, basic_percent: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HRA %</label>
                  <input
                    type="number"
                    value={formData.hra_percent}
                    onChange={(e) => setFormData({...formData, hra_percent: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  Active
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : (editingStructure ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
