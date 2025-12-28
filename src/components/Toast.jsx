import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ toast, hideToast }) => {
  if (!toast || !toast.show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center p-3 rounded-lg shadow-lg ${
        toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
        <button
          onClick={hideToast}
          className="ml-3 text-gray-600 hover:text-gray-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;