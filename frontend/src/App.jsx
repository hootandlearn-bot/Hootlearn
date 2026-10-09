import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Homepage Components
import NewNavbar from './components/NewNavbar';
import HeroSection from './components/HeroSection';
import SpecialFeatures from './components/SpecialFeatures';
import CoreValues from './components/CoreValues';
import HootPrograms from './components/HootPrograms';
import AboutSection from './components/AboutSection';
import FounderSection from './components/FounderSection';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';

const Homepage = () => {
  useEffect(() => {
    const preventAction = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('dragstart', preventAction);
    return () => {
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('dragstart', preventAction);
    };
  }, []);

  return (
    <div className="no-select-global">
      <NewNavbar />
      <main>
        <HeroSection />
        <FounderSection />
        <SpecialFeatures />
        <AboutSection />
        <HootPrograms />
        <CoreValues />
      </main>
      <Footer />
    </div>
  );
};

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
