import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const linkClasses = 'px-4 py-2 hover:bg-gray-700 rounded-md';
  const activeClasses = 'bg-gray-700';

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        {user?.roles?.includes('admin') && (
          <Link
            to="/admin"
            className={`${linkClasses} ${
              location.pathname === '/admin' ? activeClasses : ''
            }`}
          >
            Admin
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 