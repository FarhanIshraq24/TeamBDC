import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [loc]);

  const active = (path) => loc.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <img src="/logo.jpg" alt="TeamBDC" className="nav-logo" />
          <div className="nav-brand-text">
            <span className="brand-main">TeamBDC</span>
            <span className="brand-sub">Shut Up Legs</span>
          </div>
        </Link>

        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={active('/')}>Home</Link>
          <Link to="/team" className={active('/team')}>Team</Link>
          <Link to="/leaderboard" className={active('/leaderboard')}>Leaderboard</Link>
          <Link to="/gallery" className={active('/gallery')}>Gallery</Link>
          {user && <Link to="/dashboard" className={active('/dashboard')}>Dashboard</Link>}
          {isAdmin && <Link to="/admin" className={active('/admin')}>Admin</Link>}
          {isSuperAdmin && <Link to="/superadmin" className={active('/superadmin')}>Super Admin</Link>}
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="nav-user">
              <img
                src={user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=00e676&textColor=000000`}
                alt={user.name}
                className="nav-avatar"
              />
              <span className="nav-username">{user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Team</Link>
            </div>
          )}
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
