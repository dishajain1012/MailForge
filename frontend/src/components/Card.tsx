import React from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, icon, children }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/60">
      <div className="flex items-center space-x-3 mb-4">
        {icon && (
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/40">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};
