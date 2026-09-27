import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { checkAuth, logout } from './services/auth';
import { User } from './types/auth';
import { Sidebar } from './components/Sidebar';
import { LoadingState } from './components/LoadingState';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComposePage } from './pages/ComposePage';
import { EmailDetailsPage } from './pages/EmailDetailsPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await checkAuth();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingState /></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          element={user ? (
            <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
              <Sidebar user={user} onLogout={handleLogout} />
              <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
                <Outlet />
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )}
        >
          <Route path="/dashboard" element={
            <div className="p-8 h-full overflow-y-auto bg-gray-50">
              <DashboardPage />
            </div>
          } />
          <Route path="/compose" element={
            <div className="p-8 h-full overflow-y-auto bg-gray-50">
              <ComposePage />
            </div>
          } />
          <Route path="/emails/:id" element={
            <div className="p-8 h-full overflow-y-auto bg-gray-50">
              <EmailDetailsPage />
            </div>
          } />
        </Route>
        
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
