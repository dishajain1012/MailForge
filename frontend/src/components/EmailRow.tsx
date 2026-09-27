import React from 'react';
import { EmailJob } from '../types/email';
import { StatusBadge } from './StatusBadge';
import { Mail } from 'lucide-react';

export const EmailRow: React.FC<{ email: EmailJob; onClick: (id: string) => void }> = ({ email, onClick }) => {
  return (
    <div 
      onClick={() => onClick(email.id)}
      className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors"
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#00A859]">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{email.recipient}</h4>
          <p className="text-sm text-gray-500 truncate max-w-md">{email.subject}</p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="text-right">
          <p className="text-sm text-gray-900 font-medium">
            {new Date(email.scheduledAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(email.scheduledAt).toLocaleTimeString()}
          </p>
        </div>
        <StatusBadge status={email.status} />
      </div>
    </div>
  );
};
