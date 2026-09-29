import React from 'react';
import { Link } from 'react-router-dom';
import './NewNavbar.css';

const NewNavbar = () => {
  const userToken = sessionStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');
  const isLoggedIn = !!userToken || !!adminToken;
  const dashboardRoute = userToken ? '/dashboard' : '/admin';

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
          <img src="/logo.jpeg" alt="HOOT Logo" className="navbar-logo" />
        </div>
        
        <ul className="navbar-links">
          <li><a href="#home" className="active">Home</a></li>
          <li><a href="#about">About HOOT</a></li>
          <li><a href="#programs">HOOT Programs</a></li>
        </ul>

        <div className="navbar-cta">
          {isLoggedIn ? (
            <Link to={dashboardRoute} style={{ textDecoration: 'none' }}>
              <button className="navbar-btn">
                Dashboard
                <span className="arrow">→</span>
              </button>
            </Link>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button className="navbar-btn">
                Login
                <span className="arrow">→</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NewNavbar;
