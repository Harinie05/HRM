import { useState } from 'react';

const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    
    // Different timeout durations based on message type
    const timeout = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
    
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), timeout);
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  return { toast, showToast, hideToast };
};

export default useToast;