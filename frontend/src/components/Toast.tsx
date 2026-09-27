import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 hover:opacity-75 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
