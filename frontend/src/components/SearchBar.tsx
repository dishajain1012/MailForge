import React from 'react';
import { Search } from 'lucide-react';

export const SearchBar: React.FC = () => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#00A859] focus:border-[#00A859] sm:text-sm transition duration-150 ease-in-out text-gray-900"
        placeholder="Search emails..."
      />
    </div>
  );
};
