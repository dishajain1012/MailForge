import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Paperclip, Clock, Send, Upload, ChevronDown } from 'lucide-react';
import { scheduleEmails } from '../services/emails';
import { checkAuth } from '../services/auth';
import { User } from '../types/auth';
import { format, addDays, setHours, setMinutes, parseISO } from 'date-fns';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datePopupRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    recipients: '',
    startTime: '',
    delayBetweenEmails: 2,
    hourlyLimit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStats, setUploadStats] = useState<{ detected: number; duplicates: number; invalid: string[] } | null>(null);

  // Send Later Popup State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    checkAuth().then(res => {
      if (res.success && res.data) setUser(res.data);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (datePopupRef.current && !datePopupRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const rawItems = content.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean);
        
        let valid = new Set<string>();
        let duplicates = 0;
        let invalid: string[] = [];

        for (const item of rawItems) {
          const lower = item.toLowerCase();
          if (isValidEmail(lower)) {
            if (valid.has(lower)) {
              duplicates++;
            } else {
              valid.add(lower);
            }
          } else {
            invalid.push(item);
          }
        }

        const validArray = Array.from(valid);

        if (validArray.length > 0) {
          const existing = new Set(formData.recipients.split(/[\s,;\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean));
          const newEmails = validArray.filter(e => !existing.has(e));
          
          setFormData(prev => {
            const currentStr = prev.recipients.trim();
            const appended = newEmails.join(', ');
            return {
              ...prev,
              recipients: currentStr ? `${currentStr}, ${appended}` : appended
            };
          });
        }
        
        setUploadStats({
          detected: validArray.length,
          duplicates,
          invalid: invalid.slice(0, 5)
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!formData.recipients || !formData.subject || !formData.body) {
      setError('Please fill in all required fields (To, Subject, Body)');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        recipients: formData.recipients.split(',').map(r => r.trim()).filter(Boolean),
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : new Date().toISOString(),
      };
      console.log('Sending payload:', payload);
      const res = await scheduleEmails(payload);
      console.log('Received response:', res);
      if (res.success) {
        navigate('/dashboard?tab=scheduled');
      } else {
        setError(res.message || 'Failed to schedule emails');
      }
    } catch (err: unknown) {
      console.error('API Error:', err);
      const message = axios.isAxiosError(err) ? err.response?.data?.message || err.message : (err as Error).message;
      setError(message || 'An error occurred while connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (hours: number, minutes: number = 0) => {
    const d = addDays(setMinutes(setHours(new Date(), hours), minutes), 1);
    // Format to yyyy-MM-ddThh:mm for datetime-local
    setTempDate(format(d, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleDoneDate = () => {
    setFormData({ ...formData, startTime: tempDate });
    setShowDatePicker(false);
  };

  const clearDate = () => {
    setFormData({ ...formData, startTime: '' });
    setTempDate('');
    setShowDatePicker(false);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 relative">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Compose New Email</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={datePopupRef}>
            <button 
              onClick={() => {
                setTempDate(formData.startTime);
                setShowDatePicker(!showDatePicker);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${formData.startTime ? 'bg-green-50 border-green-200 text-[#00914D]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formData.startTime ? format(parseISO(formData.startTime), 'MMM d, h:mm a') : 'Send Later'}
              </span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>

            {/* Send Later Popup */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900">Send Later</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pick date and time</label>
                    <input 
                      type="datetime-local" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#00A859] focus:border-[#00A859] transition-shadow font-medium"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Presets</label>
                    <div className="space-y-1">
                      <button onClick={() => applyPreset(10)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        Tomorrow, 10:00 AM
                      </button>
                      <button onClick={() => applyPreset(11)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        Tomorrow, 11:00 AM
                      </button>
                      <button onClick={() => applyPreset(15)} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        Tomorrow, 3:00 PM
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <button onClick={clearDate} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Clear
                  </button>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowDatePicker(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDoneDate}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#00A859] hover:bg-[#00914D] rounded-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleSubmit()}
            disabled={loading}
            className="flex items-center space-x-2 bg-[#00A859] hover:bg-[#00914D] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{formData.startTime ? 'Schedule' : 'Send Now'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 text-sm font-medium border-b border-red-100">
          {error}
        </div>
      )}

      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto">
        <form className="flex flex-col h-full" onSubmit={handleSubmit}>
          
          <div className="px-8 py-5 border-b border-gray-100 flex items-center group">
            <label className="w-20 text-gray-400 font-semibold text-[13px] uppercase tracking-wider">From</label>
            <div className="flex-1 text-gray-900 text-[15px]">
              {user?.email || 'Loading...'}
            </div>
          </div>

          <div className="px-8 py-5 border-b border-gray-100 flex items-start group">
            <label className="w-20 text-gray-400 font-semibold text-[13px] uppercase tracking-wider pt-1.5">To</label>
            <div className="flex-1">
              <textarea
                rows={2}
                required
                className="w-full text-gray-900 text-[15px] focus:outline-none resize-none placeholder-gray-300 bg-transparent"
                placeholder="Comma separated emails (e.g. oliver@example.com, sarah@example.com)"
                value={formData.recipients}
                onChange={e => setFormData({...formData, recipients: e.target.value})}
              />
              <div className="mt-2 flex flex-col space-y-2">
                <div className="flex items-center">
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center text-xs text-[#00914D] font-semibold bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload CSV/TXT List
                  </button>
                </div>
                {uploadStats && (
                  <div className="text-xs bg-gray-50 border border-gray-100 p-3 rounded-lg flex flex-col space-y-1">
                    <span className="font-medium text-green-700">{uploadStats.detected} valid emails detected & appended</span>
                    {uploadStats.duplicates > 0 && <span className="text-gray-500">{uploadStats.duplicates} duplicates removed</span>}
                    {uploadStats.invalid.length > 0 && (
                      <span className="text-red-500">Found {uploadStats.invalid.length}+ invalid entries (e.g. "{uploadStats.invalid[0]}")</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-b border-gray-100 flex items-center group">
            <label className="w-20 text-gray-400 font-semibold text-[13px] uppercase tracking-wider">Subject</label>
            <input
              type="text"
              required
              className="flex-1 text-gray-900 text-[15px] font-medium focus:outline-none placeholder-gray-300 bg-transparent"
              placeholder="Enter subject line..."
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
          </div>

          {/* Settings Row */}
          <div className="px-8 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center space-x-12">
            <div className="flex items-center space-x-3">
              <label className="text-gray-600 font-medium text-[13px]">Delay between 2 emails:</label>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <input
                  type="number"
                  min="0"
                  className="w-16 px-3 py-1.5 text-sm text-gray-900 focus:outline-none font-medium"
                  value={formData.delayBetweenEmails}
                  onChange={e => setFormData({...formData, delayBetweenEmails: Number(e.target.value)})}
                />
                <span className="px-3 py-1.5 bg-gray-50 text-gray-500 text-[13px] font-medium border-l border-gray-200">sec</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="text-gray-600 font-medium text-[13px]">Hourly Limit:</label>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <input
                  type="number"
                  min="0"
                  className="w-16 px-3 py-1.5 text-sm text-gray-900 focus:outline-none font-medium"
                  value={formData.hourlyLimit}
                  onChange={e => setFormData({...formData, hourlyLimit: Number(e.target.value)})}
                />
                <span className="px-3 py-1.5 bg-gray-50 text-gray-500 text-[13px] font-medium border-l border-gray-200">/hr</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <textarea
              required
              className="w-full h-full text-gray-800 text-[15px] leading-relaxed focus:outline-none resize-none placeholder-gray-300 bg-transparent"
              placeholder="Write your email content here..."
              value={formData.body}
              onChange={e => setFormData({...formData, body: e.target.value})}
            />
          </div>
          
        </form>
      </div>
    </div>
  );
};
