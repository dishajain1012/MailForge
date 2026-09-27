import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Edit, Clock, Send, LogOut } from 'lucide-react';
import { User } from '../types/auth';
import { getScheduledEmails, getSentEmails } from '../services/emails';
import { API_BASE_URL } from '../services/api';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const [scheduled, sent] = await Promise.all([
        getScheduledEmails(),
        getSentEmails()
      ]);
      if (scheduled.success) setScheduledCount(scheduled.data.length);
      if (sent.success) setSentCount(sent.data.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCounts();
    // In a real app we might use websockets or polling, but this works for the foundation
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const activeTab = new URLSearchParams(location.search).get('tab') || 'scheduled';

  return (
    <div className="w-[260px] bg-gray-50 border-r border-gray-200 min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-[#00A859] flex items-center justify-center font-bold text-white shadow-sm">
          M
        </div>
        <span className="font-bold text-xl text-gray-900 tracking-tight">MailForge</span>
      </div>

      {/* User Profile Dropdown */}
      <div className="px-3 mx-3 py-2 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00914D] font-bold shrink-0">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </div>

      {/* Compose Button */}
      <div className="px-4 mt-6 mb-4">
        <button 
          onClick={() => navigate('/compose')}
          className="w-full flex items-center justify-center space-x-2 bg-[#00A859] hover:bg-[#00914D] text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Edit className="w-4 h-4" />
          <span>Compose</span>
        </button>
      </div>

      <div className="px-3 py-2">
        <p className="px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Core</p>
        <nav className="space-y-0.5">
          <button 
            onClick={() => navigate('/dashboard?tab=scheduled')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeTab === 'scheduled' && location.pathname === '/dashboard' ? 'bg-green-50 text-[#00914D] font-semibold' : 'text-gray-600 hover:bg-gray-100/50'}`}
          >
            <div className="flex items-center space-x-3">
              <Clock className={`w-4 h-4 ${activeTab === 'scheduled' && location.pathname === '/dashboard' ? 'text-[#00A859]' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">Scheduled</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeTab === 'scheduled' && location.pathname === '/dashboard' ? 'bg-green-100 text-[#00914D]' : 'bg-gray-200 text-gray-500'}`}>
              {scheduledCount}
            </span>
          </button>

          <button 
            onClick={() => navigate('/dashboard?tab=sent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeTab === 'sent' && location.pathname === '/dashboard' ? 'bg-green-50 text-[#00914D] font-semibold' : 'text-gray-600 hover:bg-gray-100/50'}`}
          >
            <div className="flex items-center space-x-3">
              <Send className={`w-4 h-4 ${activeTab === 'sent' && location.pathname === '/dashboard' ? 'text-[#00A859]' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">Sent</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeTab === 'sent' && location.pathname === '/dashboard' ? 'bg-green-100 text-[#00914D]' : 'bg-gray-200 text-gray-500'}`}>
              {sentCount}
            </span>
          </button>
        </nav>
      </div>

      <div className="mt-auto p-4 flex flex-col space-y-2">
        <a 
          href={`${API_BASE_URL}/slack/connect`}
          className="w-full flex items-center justify-center space-x-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" className="w-4 h-4" />
          <span>Connect Slack</span>
        </a>
        <button 
          onClick={onLogout} 
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
