import React from 'react';
import { Mail, ShieldCheck, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-emerald-600 to-green-500 p-2 rounded-xl shadow-lg shadow-green-500/20">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              ReachInbox <span className="text-xs bg-green-500/10 text-green-400 font-medium px-2 py-0.5 rounded-full border border-green-500/20">Foundation</span>
            </h1>
            <p className="text-xs text-slate-400">Email Job Scheduler</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>BullMQ + Redis</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prisma + Postgres</span>
          </div>
        </div>
      </div>
    </header>
  );
};
