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
    <div className="apple-form-group">
      {label && (
        <label className={`apple-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <input 
        className={`apple-input ${error ? 'error' : success ? 'success' : ''} ${className}`}
        {...props}
      />
      {error && <div className="apple-error-message">{error}</div>}
      {success && <div className="apple-success-message">{success}</div>}
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
    <div className="apple-form-group">
      {label && (
        <label className={`apple-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <textarea 
        className={`apple-textarea ${error ? 'error' : success ? 'success' : ''} ${className}`}
        {...props}
      />
      {error && <div className="apple-error-message">{error}</div>}
      {success && <div className="apple-success-message">{success}</div>}
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
    <div className="apple-form-group">
      {label && (
        <label className={`apple-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select 
        className={`apple-select ${error ? 'error' : success ? 'success' : ''} ${className}`}
        {...props}
      >
        {children || options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && <div className="apple-error-message">{error}</div>}
      {success && <div className="apple-success-message">{success}</div>}
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
  const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';
  const widthClass = fullWidth ? 'full-width' : '';
  
  return (
    <button 
      className={`apple-button ${variant} ${sizeClass} ${widthClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    <label className={`apple-checkbox ${className}`}>
      <input type="checkbox" {...props} />
      <span className="checkmark"></span>
      {label && <span className="label">{label}</span>}
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
      className={`apple-form-container ${className}`}
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
  const colsClass = cols > 1 ? `cols-${cols}` : '';
  
  return (
    <div className={`apple-form-row ${colsClass} ${className}`}>
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
    <div className={`apple-form-section ${className}`}>
      {title && <h3 className="apple-form-section-title">{title}</h3>}
      {subtitle && <p className="apple-form-section-subtitle">{subtitle}</p>}
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
    <div className={`apple-form-actions ${className}`}>
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