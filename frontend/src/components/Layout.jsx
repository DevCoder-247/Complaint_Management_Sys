import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.userType) {
      case 'citizen':
        return '/';
      case 'department':
        return '/department';
      case 'l2_officer':
        return '/l2-dashboard';
      case 'l3_officer':
        return '/l3-dashboard';
      default:
        return '/';
    }
  };

  const getUserRoleLabel = () => {
    if (!user) return '';
    
    const labels = {
      'citizen': 'Citizen',
      'department': 'Department',
      'l2_officer': 'L2 Officer',
      'l3_officer': 'L3 Officer',
      'admin': 'Admin'
    };
    return labels[user.userType] || user.userType;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                Complaint System
              </Link>
              
              <div className="hidden md:flex ml-10 space-x-4">
                <Link
                  to={getDashboardLink()}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                
                {user?.userType === 'citizen' && (
                  <Link
                    to="/create-complaint"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Create Complaint
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:block">
                    <span className="text-sm text-gray-600">
                      {user.name} ({getUserRoleLabel()})
                      {user.department && ` - ${user.department}`}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Complaint Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;