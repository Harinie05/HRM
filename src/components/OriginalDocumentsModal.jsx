import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../api';
import useToast from '../utils/useToast';
import Toast from './Toast';

const OriginalDocumentsModal = ({ isOpen, onClose, employee }) => {
  const { toast, showToast, hideToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState('');

  useEffect(() => {
    if (isOpen && employee) {
      fetchDocuments();
    }
  }, [isOpen, employee]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/original-documents/${employee.id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...documents];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    
    // Auto-set collected date to today when marking as collected
    if (field === 'is_collected' && value) {
      updatedDocs[index].collected_date = new Date().toISOString().split('T')[0];
    }
    
    setDocuments(updatedDocs);
  };

  const addCustomDocument = () => {
    if (!newDocumentType.trim()) {
      showToast('Please enter a document type', 'error');
      return;
    }

    const newDoc = {
      id: `temp_${Date.now()}`,
      document_type: newDocumentType.trim(),
      is_collected: false,
      collected_date: null,
      remarks: '',
      is_custom: true
    };

    setDocuments([...documents, newDoc]);
    setNewDocumentType('');
  };

  const removeCustomDocument = (index) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUserId = localStorage.getItem('user_id') || 1;
      
      const updates = documents.map(doc => ({
        document_type: doc.document_type,
        is_collected: doc.is_collected,
        collected_date: doc.collected_date,
        remarks: doc.remarks
      }));

      await api.post(`/api/original-documents/?employee_id=${employee.id}&collected_by=${currentUserId}`, updates);
      showToast('Saved successfully!', 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving documents:', error);
      showToast('Failed to save documents collection status', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl border border-black max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border border-black rounded-lg flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Original Documents Collected</h2>
                <p className="text-sm text-gray-600">
                  {employee?.candidate_name} • ID: {employee?.employee_id || employee?.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Add Custom Document */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Custom Document Type</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newDocumentType}
                  onChange={(e) => setNewDocumentType(e.target.value)}
                  placeholder="Enter document type (e.g., Medical Certificate, ID Proof)"
                  className="flex-1 bg-white text-black border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomDocument()}
                />
                <button
                  onClick={addCustomDocument}
                  className="px-4 py-2 bg-black text-white border border-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <FiPlus size={16} />
                  Add
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      {/* Document Type */}
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Type
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900">{doc.document_type}</p>
                          {doc.is_custom && (
                            <button
                              onClick={() => removeCustomDocument(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove custom document"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Collected Checkbox */}
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Collected
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={doc.is_collected}
                            onChange={(e) => handleDocumentChange(index, 'is_collected', e.target.checked)}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {doc.is_collected ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {/* Collected Date */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Collected Date
                        </label>
                        <input
                          type="date"
                          value={doc.collected_date || ''}
                          onChange={(e) => handleDocumentChange(index, 'collected_date', e.target.value)}
                          disabled={!doc.is_collected}
                          className="w-full bg-white text-black border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-black flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-black text-white border border-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </>
  );
};

export default OriginalDocumentsModal;