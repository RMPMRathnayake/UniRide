import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import {
  LayoutDashboard, Route, Activity, Clock3, Wallet, MessageSquare,
  UserRound, Settings, Menu, X, LogOut
} from '../../admin/components/icons';

const navGroups = [
  { title: 'DRIVER PORTAL', items: [
    { to: '/driver', label: 'Overview', Icon: LayoutDashboard, end: true }
  ]},
  { title: 'JOB MANAGEMENT', items: [
    { to: '/driver/available', label: 'Available jobs', Icon: Route },
    { to: '/driver/active', label: 'Active jobs', Icon: Activity },
    { to: '/driver/completed', label: 'Completed jobs', Icon: Clock3 }
  ]},
  { title: 'PERFORMANCE', items: [
    { to: '/driver/earnings', label: 'Earnings', Icon: Wallet },
    { to: '/driver/reviews', label: 'Reviews', Icon: MessageSquare }
  ]},
  { title: 'ACCOUNT', items: [
    { to: '/driver/profile', label: 'Profile', Icon: UserRound },
    { to: '/driver/settings', label: 'Settings', Icon: Settings }
  ]}
];

export default function DashboardLayout() {
  const { driver, logout, updateDriver } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [toast, setToast] = useState('');
  const signOut = () => { logout(); navigate('/', { replace: true }); };
  const initials = (driver?.name || 'Driver').trim().charAt(0).toUpperCase();

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
    } finally {
      setSavingStatus(false);
    }
  };

  const approvalPending = driver?.documentStatus !== 'approved';
  const available = driver?.status === 'online';

  return (
    <div className="app-shell portal-shell">
      {menuOpen && <button className="portal-sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`portal-sidebar ${menuOpen ? 'portal-sidebar-open' : ''}`}>
        <div className="portal-brand">
          <img src="/logo.PNG" alt="UniRide logo" />
          <div className="portal-brand-copy"><strong>UniRide</strong><span>DRIVER PORTAL</span></div>
          <button className="portal-icon-button portal-sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close sidebar"><X size={19} /></button>
        </div>

        <nav className="portal-side-nav" aria-label="Driver navigation">
          {navGroups.map((group) => (
            <section className="portal-nav-group" key={group.title}>
              <p className="portal-nav-heading">{group.title}</p>
              {group.items.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} /><span>{label}</span>
                </NavLink>
              ))}
            </section>
          ))}
        </nav>

      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button className="portal-icon-button portal-menu-toggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
            <div className="portal-heading-copy"><strong>Driver Dashboard</strong><span>Manage jobs and availability</span></div>
          </div>
          <div className="portal-topbar-user">
            <button
              className={`portal-availability ${available ? 'is-available' : ''}`}
              type="button"
              onClick={toggleAvailability}
              disabled={savingStatus || approvalPending}
              title={approvalPending ? 'Administrator approval is required before becoming available.' : 'Change your availability'}
            >
              <span className="portal-availability-dot" />
              {savingStatus ? 'Updating…' : approvalPending ? 'Pending Approval' : available ? 'Available' : 'Not Available'}
            </button>
            <div className="portal-avatar">{initials}</div>
            <div className="portal-user-copy"><strong>{driver?.name || 'Driver'}</strong><span>Driver account</span></div>
            <button className="portal-signout" type="button" onClick={signOut} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button>
          </div>
        </header>
        <div className="portal-page-content page-container"><Outlet /></div>
      </main>
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}
