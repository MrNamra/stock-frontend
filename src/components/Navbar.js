import { Link } from 'react-router-dom';
import config from '../config/config';

const Navbar = ({ user, setUser, onLogout }) => {
  const handleLogout = () => {
    onLogout();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        📈 {config.APP.NAME}
      </Link>
      
      <div className="navbar-nav">
        {user ? (
          <>
            <span className="nav-link">
              Welcome, <strong>{user.name || user.email}</strong>
            </span>
            <button 
              onClick={handleLogout}
              style={{ 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;