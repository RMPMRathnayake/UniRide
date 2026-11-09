export default function StatCard({ title, value, hint, icon: Icon, accent = "blue" }) {
  return <article className="stat-card">
    <div className={`stat-icon accent-${accent}`}><Icon size={22} /></div>
    <div className="stat-content"><span className="muted stat-label">{title}</span><strong>{value}</strong><span className="muted stat-hint">{hint}</span></div>
  </article>;
}
