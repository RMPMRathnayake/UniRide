export function FullPageLoader() {
  return <div className="full-loader"><span className="loading-mark" aria-hidden="true" /> <span>Loading driver workspace…</span></div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}

export function StatCard({ label, value, note }) {
  return <div className="stat-card"><div className="stat-content"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div></div>;
}

export function StatusBadge({ status }) {
  const labels = { available: 'Available', pending: 'New order', accepted: 'Accepted', in_progress: 'In progress', picked_up: 'Picked up', completed: 'Completed', delivered: 'Delivered', cancelled: 'Cancelled' };
  return <span className={`status-badge ${status}`}>{labels[status] || status?.replaceAll('_', ' ')}</span>;
}

export function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here when it is available.' }) {
  return <div className="empty-state"><strong>{title}</strong><p>{text}</p></div>;
}

export function Stars({ rating = 0 }) {
  return <span className="stars" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>)}</span>;
}

export function formatMoney(amount = 0) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

export function formatDate(date, options = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(date));
}

export function RouteEndpoints({ from, to }) {
  return <div className="route-endpoints"><div className="endpoint pickup"><i /> <span>{from || 'Pickup location'}</span></div><div className="route-endpoint-line" /><div className="endpoint dropoff"><i /> <span>{to || 'Destination'}</span></div></div>;
}

export function ServiceIcon({ type }) {
  return <span className={`service-icon ${type}`}>{type === 'ride' ? 'RIDE' : 'DROP'}</span>;
}
