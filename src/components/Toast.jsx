import React from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ toast, hideToast }) => {
  if (!toast?.show) return null;
  
  const { message, type } = toast;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: <Info className="w-4 h-4" />
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: <Info className="w-4 h-4" />
        };
    }
  };

  const config = getToastConfig();

  return (
    <div className="fixed top-20 right-4 z-[9999] animate-in slide-in-from-right duration-300">
      <div className={`flex items-center p-2 rounded-lg shadow-lg border max-w-xs ${
        config.bgColor
      } ${
        config.textColor
      } ${
        config.borderColor
      }`}>
        <div className="flex items-center flex-1">
          <div className="w-4 h-4 mr-2 flex-shrink-0">{config.icon}</div>
          <span className="font-medium text-xs">{message}</span>
        </div>
        <button
          onClick={hideToast}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Toast;