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
    <div className="space-y-6">

      {/* Filters */}
      <div className="rounded-xl shadow-sm border border-black p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Training Programs</h3>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Program
          </button>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <BookOpen className="mx-auto h-12 w-12 text-muted" />
                      <h3 className="mt-2 text-sm font-medium text-primary">No training programs</h3>
                      <p className="mt-1 text-sm text-muted">
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
                    <tr key={program.id} className="hover:bg-gray-50 border-b border-black">
                      <td className="px-6 py-4 border-r border-black">
                        <div className="text-sm font-medium text-gray-900">{program.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{program.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {program.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <div className="text-sm text-gray-900">{program.trainer || 'TBD'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <div className="text-sm text-gray-900">
                          {program.startDate && program.endDate ? 
                            `${program.startDate} to ${program.endDate}` : 
                            'Not scheduled'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          program.status === "Published" ? "bg-green-100 text-green-800" :
                          program.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-900"
                        }`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(program)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {program.status === "Draft" && (
                            <button 
                              onClick={() => handlePublish(program.id)}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Publish"
                            >
                              <Calendar size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(program.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
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
            
            {/* Stats Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-black">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total Programs: {(programs || []).length}</span>
                <span>Published: {(programs || []).filter(p => p.status === 'Published').length}</span>
                <span>Draft: {(programs || []).filter(p => p.status === 'Draft').length}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProgram ? 'Edit Training Program' : 'New Training Program'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter program title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    rows="2"
                    placeholder="Describe the training program"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Hours"
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                    <input
                      type="text"
                      value={formData.trainer}
                      onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Trainer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Target department"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? "Saving..." : (editingProgram ? "Update Program" : "Create Program")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
