import { Link } from 'react-router-dom';

export const money = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
export const dateTime = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const shortDate = (value) => value ? new Date(value).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export function PageHeader({ eyebrow = 'UNIRIDE RIDER', title, subtitle, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}
export function CardHeading({ title, subtitle, action }) {
  return <div className="card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}
export function Button({ children, variant = 'primary', type = 'button', className = '', block = false, ...props }) {
  return <button type={type} className={`button button-${variant} ${block ? 'button-block' : ''} ${className}`} {...props}>{children}</button>;
}
export function StatCard({ label, value, note }) {
  return <div className="stat-card"><div className="stat-content"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div></div>;
}
export function EmptyState({ title = 'Nothing here yet', text = 'Your activity will appear here.' }) {
  return <div className="empty-state"><strong>{title}</strong><p>{text}</p></div>;
}
export function StatusPill({ status }) {
  const labels = { available: 'Finding driver', searching: 'Finding driver', accepted: 'Driver assigned', driver_assigned: 'Driver assigned', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled', pending: 'Order placed', placed: 'Order placed', preparing: 'Driver assigned', picked_up: 'On the way', on_the_way: 'On the way', delivered: 'Delivered' };
  const className = ({ available: 'searching', accepted: 'driver_assigned', pending: 'placed', picked_up: 'on_the_way' }[status] || status);
  return <span className={`status-pill status-${className}`}>{labels[status] || status?.replaceAll('_', ' ') || 'Pending'}</span>;
}
export function Stars({ value = 0, onChange, size = 'normal' }) {
  return <div className={`stars ${size === 'large' ? 'stars-large' : ''}`} role={onChange ? 'group' : 'img'} aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => onChange ? <button key={n} type="button" className={n <= value ? 'filled' : ''} onClick={() => onChange(n)} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} title={`${n} ${n === 1 ? 'star' : 'stars'}`}>{n <= value ? '★' : '☆'}</button> : <span key={n} className={n <= value ? 'filled' : ''} aria-hidden="true">{n <= value ? '★' : '☆'}</span>)}</div>;
}
export function Field({ label, children, hint }) {
  return <div className="form-field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}
export function Loading({ text = 'Loading…' }) { return <div className="loading-panel">{text}</div>; }
export function PageLink({ to, children }) { return <Link className="text-link" to={to}>{children}</Link>; }
