import React from 'react';
import { EmailJob } from '../types/email';
import { EmailRow } from './EmailRow';

export const EmailList: React.FC<{ emails: EmailJob[]; onEmailClick: (id: string) => void }> = ({ emails, onEmailClick }) => {
  if (emails.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No emails found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {emails.map(email => (
        <EmailRow key={email.id} email={email} onClick={onEmailClick} />
      ))}
    </div>
  );
};
