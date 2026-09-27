import React from 'react';

export const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-900">
      
      {/* Top Left Logo / Header if any, but description says "white page, centered bordered login card" */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8">
        <div className="flex items-center space-x-2">
          {/* Logo mock if needed */}
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-semibold text-gray-700 shadow-sm">
            M
          </div>
          <span className="font-bold text-xl tracking-tight">MailForge</span>
        </div>
      </div>

      <div className="w-full max-w-[440px] px-4">
        {/* Card */}
        <div className="bg-white border border-gray-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-2xl py-10 px-8 sm:px-10">
          
          <h2 className="text-[28px] font-semibold text-center mb-8 text-gray-800 tracking-tight">
            Login to your account
          </h2>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors mb-6"
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
                or sign up through email
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <input
                type="email"
                placeholder="Email ID"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50/50"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50/50"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#00A859] hover:bg-[#00914D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Login
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
