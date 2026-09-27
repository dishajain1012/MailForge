import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmailJob } from '../services/emails';
import { checkAuth } from '../services/auth';
import { EmailJob } from '../types/email';
import { User } from '../types/auth';
import { LoadingState } from '../components/LoadingState';
import { ArrowLeft, MoreVertical, Reply, Forward, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const EmailDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailJob | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emailRes, authRes] = await Promise.all([
          id ? getEmailJob(id) : Promise.resolve(null),
          checkAuth()
        ]);
        
        if (emailRes?.success) setEmail(emailRes.data);
        if (authRes?.success && authRes.data) setUser(authRes.data);
      } catch (error) {
        console.error('Failed to fetch email details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!email) return <div className="flex justify-center py-20 text-gray-500">Email not found</div>;

  const displayDate = email.sentAt ? email.sentAt : email.scheduledAt;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <button className="p-2 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Reply className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Forward className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-2"></div>
          <button className="p-2 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-10 py-8">
          {/* Subject & Status */}
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight leading-tight max-w-2xl">
              {email.subject}
            </h1>
            <span className={`shrink-0 ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
              email.status === 'SCHEDULED' ? 'bg-green-50 text-green-700 border-green-200' :
              email.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
              email.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
              email.status === 'PROCESSING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              {email.status === 'COMPLETED' ? 'SENT' : email.status}
            </span>
          </div>

          {/* Sender & Recipient Info */}
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-[#00914D] font-bold text-lg shadow-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-gray-900">{user?.name || 'You'}</span>
                  <span className="text-sm text-gray-500">&lt;{user?.email}&gt;</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  to <span className="font-medium text-gray-700">{email.recipient}</span>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 font-medium whitespace-nowrap">
              {format(new Date(displayDate), 'MMM d, yyyy, h:mm a')}
            </div>
          </div>

          {/* Email Body */}
          <div className="prose prose-sm sm:prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {email.body}
          </div>

          {/* Error Message if Failed */}
          {email.status === 'FAILED' && email.errorMessage && (
            <div className="mt-12 bg-red-50 border border-red-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Delivery Failed</h4>
              <p className="text-sm text-red-600">{email.errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
