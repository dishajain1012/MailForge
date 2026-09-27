import React from 'react';
import { User } from '../types/auth';

export const UserProfile: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-3">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#00A859] flex items-center justify-center text-white font-bold">
          {user.name?.charAt(0) || user.email.charAt(0)}
        </div>
      )}
      <div>
        <p className="font-medium text-gray-900">{user.name || 'User'}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </div>
  );
};
