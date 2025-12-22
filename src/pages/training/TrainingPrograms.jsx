import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, Users } from "lucide-react";
import api from "../../api";

export default function TrainingPrograms() {
  const [programs, setPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    trainer: "",
    department: "",
    startDate: "",
    endDate: "",
    duration_hours: "",
    max_participants: "",
    status: "Draft"
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await api.get("/api/training/programs", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setPrograms(res.data?.data || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error("Error fetching training programs:", error);
      }
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingProgram) {
        await api.put(`/api/training/programs/${editingProgram.id}`, formData);
      } else {
        await api.post("/api/training/programs", formData);
      }
      await fetchPrograms();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving training program:", error);
      alert('Failed to save training program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this training program?')) {
      try {
        await api.delete(`/api/training/programs/${id}`);
        await fetchPrograms();
      } catch (error) {
        console.error("Error deleting training program:", error);
        alert('Failed to delete training program. Please try again.');
      }
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.put(`/api/training/programs/${id}`, { status: "Published" });
      await fetchPrograms();
    } catch (error) {
      console.error("Error publishing training program:", error);
      alert('Failed to publish training program. Please try again.');
    }
  };

  const handleOpenModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        title: program.title || "",
        description: program.description || "",
        category: program.category || "",
        type: program.type || "",
        trainer: program.trainer || "",
        department: program.department || "",
        startDate: program.startDate || "",
        endDate: program.endDate || "",
        duration_hours: program.duration_hours || "",
        max_participants: program.max_participants || "",
        status: program.status || "Draft"
      });
    } else {
      setEditingProgram(null);
      setFormData({
        title: "",
        description: "",
        category: "",
        type: "",
        trainer: "",
        department: "",
        startDate: "",
        endDate: "",
        duration_hours: "",
        max_participants: "",
        status: "Draft"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProgram(null);
  };

  const filteredPrograms = (programs || []).filter(program => {
    const matchesSearch = program.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const categories = ["Technical", "Soft Skills", "Compliance", "Leadership", "Safety", "Other"];
  const statuses = ["Draft", "Published", "Archived"];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Training Programs</h2>
            <p className="text-gray-600 mt-1">Create and manage training programs</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New Program
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Programs</p>
                <p className="text-2xl font-semibold text-blue-900">{(programs || []).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-2xl font-semibold text-green-900">{(programs || []).filter(p => p.status === 'Published').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Edit className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Draft</p>
                <p className="text-2xl font-semibold text-yellow-900">{(programs || []).filter(p => p.status === 'Draft').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Categories</p>
                <p className="text-2xl font-semibold text-purple-900">{new Set((programs || []).map(p => p.category)).size}</p>
              </div>
            </div>
          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No training programs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter ? "No programs match your search criteria." : "No training programs have been created yet."}
                    </p>
                    {!searchTerm && !statusFilter && (
                      <div className="mt-6">
                        <button 
                          onClick={() => handleOpenModal()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                        >
                          <Plus size={16} />
                          Create First Program
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{program.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{program.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {program.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{program.trainer || 'TBD'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {program.startDate && program.endDate ? 
                          `${program.startDate} to ${program.endDate}` : 
                          'Not scheduled'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.status === "Published" ? "bg-green-100 text-green-800" :
                        program.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(program)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {program.status === "Draft" && (
                          <button 
                            onClick={() => handlePublish(program.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Publish"
                          >
                            <Calendar size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Programs: {(programs || []).length}</span>
          <span>Published: {(programs || []).filter(p => p.status === 'Published').length}</span>
          <span>Draft: {(programs || []).filter(p => p.status === 'Draft').length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingProgram ? 'Edit Training Program' : 'New Training Program'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                <input
                  type="text"
                  value={formData.trainer}
                  onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Trainer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Target department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  placeholder="Leave empty for unlimited"
                />
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
                  {loading ? "Saving..." : (editingProgram ? "Update Program" : "Create Program")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}