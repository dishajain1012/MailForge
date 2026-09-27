import React from 'react';
import { JobStatus } from '../types/email';

const statusColors: Record<JobStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
};

export const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColors[status]}`}>
      {status}
    </span>
  );
};
