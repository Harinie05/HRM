import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ show, message, type, hideToast }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border ${
        type === 'success' 
          ? 'bg-green-50 text-green-800 border-green-200' 
          : 'bg-red-50 text-red-800 border-red-200'
      }`}>
        <div className="flex items-center">
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-3" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3" />
          )}
          <span className="font-medium text-sm">{message}</span>
        </div>
        <button
          onClick={hideToast}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;