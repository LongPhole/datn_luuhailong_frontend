import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useAuth } from '@/stores/authStore';

interface AppLayoutProps {}

const AppLayout: React.FC<AppLayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='border-b bg-white shadow-sm'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center space-x-8'>
              <Link
                to='/'
                className='text-xl font-bold text-gray-900 hover:text-indigo-600'
              >
                HR Management System
              </Link>

              <nav className='hidden space-x-6 md:flex'>
                <Link
                  to='/'
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/') && location.pathname === '/'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to='/departments'
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/departments')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Departments
                </Link>
                <Link
                  to='/employees'
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/employees')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Employees
                </Link>
              </nav>
            </div>

            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-600'>
                Welcome, {user?.fullName || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className='rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default AppLayout;
