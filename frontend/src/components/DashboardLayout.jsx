import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/available', label: 'Available' },
  { to: '/active', label: 'Active' },
  { to: '/completed', label: 'Completed' },
  { to: '/earnings', label: 'Earnings' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' }
];

export default function DashboardLayout() {
  const { driver, logout, updateDriver } = useAuth();
  const [savingStatus, setSavingStatus] = useState(false);
  const [toast, setToast] = useState('');

  const toggleAvailability = async () => {
    const next = driver.status === 'online' ? 'offline' : 'online';
    setSavingStatus(true);
    try {
      const { data } = await api.patch('/driver/availability', { status: next });
      updateDriver(data.driver);
      setToast(data.message);
      window.setTimeout(() => setToast(''), 2800);
    } catch (error) {
      setToast(getErrorMessage(error));
      window.setTimeout(() => setToast(''), 3500);
    } finally { setSavingStatus(false); }
  };

  return (
    <div className="app-shell">
      <header className="site-nav">
        <div className="site-nav-inner">
          <NavLink to="/" className="brand-link" aria-label="UniRide driver dashboard">
            <img className="brand-logo" src="/logo.png" alt="UniRide" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />
            <span className="brand-fallback" hidden>UniRide</span>
            <span className="brand-context">DRIVER PORTAL</span>
          </NavLink>
          <nav className="main-nav" aria-label="UniRide driver navigation">
            {navItems.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
          </nav>
          <div className="nav-actions">
            <button className={`availability-toggle ${driver?.status === 'online' ? 'online' : ''}`} onClick={toggleAvailability} disabled={savingStatus}>
              <span className="availability-indicator" />{savingStatus ? 'Updating…' : driver?.status === 'online' ? 'Available' : 'Not Available'}
            </button>
            <span className="nav-driver-name">{driver?.name || 'Driver'}</span>
            <button className="logout-button" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="main-area">
        <div className="page-container"><Outlet /></div>
      </main>
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}
