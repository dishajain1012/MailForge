import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="w-8 h-8 text-[#00A859] animate-spin mb-4" />
    <p className="text-gray-500 text-sm font-medium">Loading...</p>
  </div>
);
