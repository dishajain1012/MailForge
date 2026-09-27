import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';
import { loginWithEmail, demoLogin } from '../services/auth';
import { User } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const performSuccessRedirect = (userData: User) => {
    localStorage.setItem('mailforge_user', JSON.stringify(userData));
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetEmail = email.trim() || 'demo@mailforge.com';

    try {
      const res = await loginWithEmail(targetEmail);
      if (res.success && res.data) {
        performSuccessRedirect(res.data);
      } else {
        performSuccessRedirect({
          id: 'demo-user-id',
          email: targetEmail,
          name: targetEmail.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
        });
      }
    } catch (err) {
      performSuccessRedirect({
        id: 'demo-user-id',
        email: targetEmail,
        name: targetEmail.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const demoUser: User = {
      id: 'demo-user-id',
      email: 'demo@mailforge.com',
      name: 'Demo User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
    };

    try {
      const res = await demoLogin();
      if (res.success && res.data) {
        performSuccessRedirect(res.data);
      } else {
        performSuccessRedirect(demoUser);
      }
    } catch (err) {
      performSuccessRedirect(demoUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-900">
      
      {/* Top Left Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-semibold text-gray-700 shadow-sm bg-gray-50">
            M
          </div>
          <span className="font-bold text-xl tracking-tight">MailForge</span>
        </div>
      </div>

      <div className="w-full max-w-[440px] px-4">
        {/* Card */}
        <div className="bg-white border border-gray-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-2xl py-10 px-8 sm:px-10">
          
          <h2 className="text-[28px] font-semibold text-center mb-6 text-gray-800 tracking-tight">
            Login to your account
          </h2>

          {error && (
            <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 text-center font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors mb-4"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">
                or sign in with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div>
              <input
                type="email"
                placeholder="Email ID (e.g. demo@mailforge.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50/50"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50/50"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#00A859] hover:bg-[#00914D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                🚀 1-Click Quick Demo Login
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

