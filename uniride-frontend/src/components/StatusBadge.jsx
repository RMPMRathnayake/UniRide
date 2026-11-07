export default function StatusBadge({ status = "pending" }) {
  const normalized = String(status).toLowerCase().replaceAll("_", "-");
  return <span className={`status-badge status-${normalized}`}>{String(status).replaceAll("_", " ")}</span>;
}
