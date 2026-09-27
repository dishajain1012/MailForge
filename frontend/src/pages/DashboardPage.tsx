import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Star } from 'lucide-react';
import { getScheduledEmails, getSentEmails } from '../services/emails';
import { EmailJob } from '../types/email';
import { format } from 'date-fns';
import { LoadingState } from '../components/LoadingState';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'scheduled';
  
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = activeTab === 'scheduled' ? await getScheduledEmails() : await getSentEmails();
      if (res.success) {
        setEmails(res.data);
      } else {
        setError('Failed to load emails.');
      }
    } catch (err) {
      setError('An error occurred while fetching emails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-gray-200 overflow-hidden">
      
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          {activeTab === 'scheduled' ? 'Scheduled Campaigns' : 'Sent Campaigns'}
        </h1>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00A859] focus:border-[#00A859] transition-shadow w-64 text-gray-900"
            />
          </div>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchEmails}
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center flex-col text-gray-500">
            <p className="mb-4">{error}</p>
            <button 
              onClick={fetchEmails}
              className="px-4 py-2 bg-green-50 text-[#00914D] rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : emails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No emails found</p>
            <p className="text-sm mt-1">There are no {activeTab} emails to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {emails.map((email) => (
              <div 
                key={email.id} 
                onClick={() => navigate(`/emails/${email.id}`)}
                className="flex items-center px-6 py-4 hover:bg-gray-50 group cursor-pointer transition-colors"
              >
                
                <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                  
                  {/* Recipient */}
                  <div className="col-span-3 flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">To:</span>
                    <span className="text-gray-900 font-semibold text-[14px] truncate">{email.recipient}</span>
                  </div>

                  {/* Badges */}
                  <div className="col-span-3 flex flex-col items-start space-y-1 justify-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                      email.status === 'SCHEDULED' ? 'bg-green-50 text-[#00914D] border-green-200' :
                      email.status === 'COMPLETED' ? 'bg-[#00A859]/10 text-[#00914D] border-[#00A859]/20' :
                      email.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                      email.status === 'PROCESSING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {email.status === 'COMPLETED' ? 'SENT' : email.status}
                    </span>
                    <span className="text-[12px] text-gray-500 font-medium">
                      {activeTab === 'scheduled' 
                        ? format(new Date(email.scheduledAt), 'MMM d, h:mm a') 
                        : email.sentAt 
                          ? format(new Date(email.sentAt), 'MMM d, h:mm a')
                          : ''}
                    </span>
                  </div>

                  {/* Subject & Preview */}
                  <div className="col-span-6 flex items-center pr-8 truncate">
                    <span className="text-gray-900 font-medium text-[14px] truncate mr-2">{email.subject}</span>
                    <span className="text-gray-400 text-[14px] truncate">- {email.body.substring(0, 80)}...</span>
                  </div>

                </div>

                {/* Actions / Star */}
                <div className="flex items-center justify-end shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-yellow-50 transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
