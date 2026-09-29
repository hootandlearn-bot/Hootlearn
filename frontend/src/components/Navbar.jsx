import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !!sessionStorage.getItem('userToken') || !!localStorage.getItem('adminToken');

  return (
    <nav className="navbar-fun">
      <div className="container nav-fun-inner">
        
        {/* Logo */}
        <a href="#" className="nav-logo-link">
          <img src="/logo.jpeg" alt="Hoot Logo" className="nav-logo-img" />
          <span className="nav-brand-text">Hoot</span>
        </a>

        {/* Links */}
        <div className={`nav-fun-links ${menuOpen ? 'open' : ''}`}>
          <a href="#resources" className="nav-fun-link"><span className="nav-icon">📚</span> Story Books</a>
          <a href="#activities" className="nav-fun-link"><span className="nav-icon">🎨</span> Fun Activities</a>
          <a href="#printables" className="nav-fun-link"><span className="nav-icon">🖍️</span> Printables</a>
        </div>

        {/* Actions */}
        <div className="nav-fun-actions">
          {isLoggedIn ? (
            <Link to="/dashboard">
              <button className="btn-fun btn-fun-sm">Dashboard</button>
            </Link>
          ) : (
            <Link to="/login">
              <button className="btn-fun btn-fun-sm">Log In!</button>
            </Link>
          )}
          
          <button 
            className={`hamburger-fun ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
