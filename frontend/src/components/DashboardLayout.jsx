import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Route, Package, Clock3, Wallet, MessageSquare,
  UserRound, Settings, Menu, X, LogOut, FileText, Activity
} from '../admin/components/icons';

const navGroups = [
  { title: 'STUDENT PORTAL', items: [
    { to: '/rider', label: 'Overview', Icon: LayoutDashboard, end: true }
  ]},
  { title: 'SERVICES', items: [
    { to: '/rider/book-ride', label: 'Book a ride', Icon: Route },
    { to: '/rider/products', label: 'Products', Icon: FileText },
    { to: '/rider/food', label: 'Food orders', Icon: Package }
  ]},
  { title: 'MY ACTIVITY', items: [
    { to: '/rider/active', label: 'Active bookings', Icon: Activity },
    { to: '/rider/history', label: 'History', Icon: Clock3 },
    { to: '/rider/spending', label: 'Spending', Icon: Wallet },
    { to: '/rider/reviews', label: 'Reviews', Icon: MessageSquare }
  ]},
  { title: 'ACCOUNT', items: [
    { to: '/rider/profile', label: 'Profile', Icon: UserRound },
    { to: '/rider/settings', label: 'Settings', Icon: Settings }
  ]}
];

export default function DashboardLayout() {
  const { rider, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = () => { logout(); navigate('/', { replace: true }); };
  const initials = (rider?.name || 'Student').trim().charAt(0).toUpperCase();

  return (
    <div className="app-shell portal-shell">
      {menuOpen && <button className="portal-sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`portal-sidebar ${menuOpen ? 'portal-sidebar-open' : ''}`}>
        <div className="portal-brand">
          <img src="/logo.PNG" alt="UniRide logo" />
          <div className="portal-brand-copy"><strong>UniRide</strong><span>STUDENT PORTAL</span></div>
          <button className="portal-icon-button portal-sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close sidebar"><X size={19} /></button>
        </div>

        <nav className="portal-side-nav" aria-label="Student navigation">
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
            <div className="portal-heading-copy"><strong>Student Dashboard</strong><span>University Mobility & Delivery Platform</span></div>
          </div>
          <div className="portal-topbar-user">
            <div className="portal-avatar">{initials}</div>
            <div className="portal-user-copy"><strong>{rider?.name || 'Student'}</strong><span>Student account</span></div>
            <button className="portal-signout" type="button" onClick={signOut} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button>
          </div>
        </header>
        <div className="portal-page-content page-container"><Outlet /></div>
      </main>
    </div>
  );
}
