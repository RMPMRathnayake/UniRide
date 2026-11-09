import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, CarFront, Route, Package,
  Wallet, MessageSquare, ChartNoAxesCombined, Bell, Settings, ScrollText,
  Shield, Menu, X, LogOut, ChevronDown, PanelLeftClose
} from "./icons";

const groups = [
  { title: "OPERATIONS", items: [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Users", "/admin/users", Users],
    ["Drivers & Verification", "/admin/drivers", ShieldCheck],
    ["Vehicles", "/admin/vehicles", CarFront],
    ["Trips & Rides", "/admin/rides", Route],
    ["Deliveries", "/admin/deliveries", Package]
  ]},
  { title: "FINANCE & REPORTS", items: [
    ["Payments", "/admin/payments", Wallet],
    ["Pricing", "/admin/pricing", Settings],
    ["Feedback", "/admin/feedback", MessageSquare],
    ["Reports", "/admin/reports", ChartNoAxesCombined]
  ]},
  { title: "SYSTEM", items: [
    ["Notifications", "/admin/notifications", Bell],
    ["Roles & Permissions", "/admin/roles", Shield],
    ["Audit Logs", "/admin/audit-logs", ScrollText]
  ]}
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("uniride_admin_user") || "{}");
  const logout = () => {
    localStorage.removeItem("uniride_admin_token");
    localStorage.removeItem("uniride_admin_user");
    navigate("/admin/login");
  };
  return <div className="admin-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand">
        <img src="/logo.PNG" alt="UniRide logo" onError={e => { e.currentTarget.style.display = "none"; }} />
        <div><strong>UniRide</strong><span>Admin Control Center</span></div>
        <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close sidebar"><X size={18}/></button>
      </div>
      <nav className="side-nav">
        {groups.map(group => <section className="nav-group" key={group.title}>
          <p className="nav-heading">{group.title}</p>
          {group.items.map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === "/admin"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={18}/><span>{label}</span>
          </NavLink>)}
        </section>)}
      </nav>
      <div className="sidebar-footer"><div className="secure-dot"/> Secure administration</div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
          <span className="topbar-title">System Administrator</span>
        </div>
        <div className="topbar-user">
          <div className="avatar">{(user.name || "A").slice(0,1).toUpperCase()}</div>
          <div className="topbar-user-copy"><strong>{user.name || "Administrator"}</strong><span>Super Admin</span></div>
          <button className="icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button>
        </div>
      </header>
      <div className="page-content"><Outlet /></div>
    </main>
  </div>;
}
