import React from 'react';

// Apple-style Input Component
export const AppleInput = ({ 
  label, 
  required = false, 
  error = '', 
  success = '', 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label className={`block text-sm font-medium text-white ${required ? 'after:content-["*"] after:text-red-400 after:ml-1' : ''}`}>
          {label}
        </label>
      )}
      <input 
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${error ? 'border-red-500' : success ? 'border-green-500' : ''} ${className}`}
        {...props}
      />
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
      {success && <div className="text-green-400 text-xs mt-1">{success}</div>}
    </div>
  );
};

// Apple-style Textarea Component
export const AppleTextarea = ({ 
  label, 
  required = false, 
  error = '', 
  success = '', 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label className={`block text-sm font-medium text-white ${required ? 'after:content-["*"] after:text-red-400 after:ml-1' : ''}`}>
          {label}
        </label>
      )}
      <textarea 
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical ${error ? 'border-red-500' : success ? 'border-green-500' : ''} ${className}`}
        {...props}
      />
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
      {success && <div className="text-green-400 text-xs mt-1">{success}</div>}
    </div>
  );
};

// Apple-style Select Component
export const AppleSelect = ({ 
  label, 
  required = false, 
  error = '', 
  success = '', 
  options = [], 
  className = '', 
  children,
  ...props 
}) => {
  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label className={`block text-sm font-medium text-white ${required ? 'after:content-["*"] after:text-red-400 after:ml-1' : ''}`}>
          {label}
        </label>
      )}
      <select 
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${error ? 'border-red-500' : success ? 'border-green-500' : ''} ${className}`}
        {...props}
      >
        {children || options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
      {success && <div className="text-green-400 text-xs mt-1">{success}</div>}
    </div>
  );
};

// Apple-style Button Component
export const AppleButton = ({ 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  loading = false,
  children, 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};

// Apple-style Checkbox Component
export const AppleCheckbox = ({ 
  label, 
  className = '', 
  ...props 
}) => {
  return (
    <label className={`flex items-center space-x-3 cursor-pointer ${className}`}>
      <input 
        type="checkbox" 
        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
        {...props} 
      />
      {label && <span className="text-sm text-white">{label}</span>}
    </label>
  );
};

// Apple-style Form Container
export const AppleForm = ({ 
  children, 
  onSubmit, 
  className = '', 
  ...props 
}) => {
  return (
    <form 
      className={`space-y-4 sm:space-y-6 ${className}`}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  );
};

// Apple-style Form Row
export const AppleFormRow = ({ 
  children, 
  cols = 1, 
  className = '' 
}) => {
  const colsClass = cols > 1 ? `grid grid-cols-1 sm:grid-cols-${cols} gap-4` : '';
  
  return (
    <div className={`${colsClass} ${className}`}>
      {children}
    </div>
  );
};

// Apple-style Form Section
export const AppleFormSection = ({ 
  title, 
  subtitle, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {title && <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-300 mb-3 sm:mb-4">{subtitle}</p>}
      {children}
    </div>
  );
};

// Apple-style Form Actions
export const AppleFormActions = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 pt-4 ${className}`}>
      {children}
    </div>
  );
};

export default {
  AppleInput,
  AppleTextarea,
  AppleSelect,
  AppleButton,
  AppleCheckbox,
  AppleForm,
  AppleFormRow,
  AppleFormSection,
  AppleFormActions
};