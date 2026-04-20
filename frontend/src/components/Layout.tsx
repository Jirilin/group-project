import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center px-2 text-gray-900 hover:text-blue-600">Home</Link>
              <Link to="/about" className="flex items-center px-2 text-gray-900 hover:text-blue-600">About</Link>
              <Link to="/analyse" className="flex items-center px-2 text-gray-900 hover:text-blue-600">Analyse</Link>
              <Link to="/records" className="flex items-center px-2 text-gray-900 hover:text-blue-600">Records</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-gray-700 hover:text-blue-600">{user?.full_name}</Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-blue-600">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;