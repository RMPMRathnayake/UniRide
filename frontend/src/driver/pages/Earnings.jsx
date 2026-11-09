import { useEffect, useState } from 'react';
import { ArrowDownToLine } from '../components/Icon';
import api, { getErrorMessage } from '../services/api';
import { EmptyState, PageHeader, StatCard, formatDate, formatMoney } from '../components/UI';

export default function Earnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/driver/earnings').then((response) => setData(response.data)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const rows = [['Date', 'Reference', 'Type', 'From', 'To', 'Driver earnings'], ...(data?.transactions || []).map((item) => [item.date ? new Date(item.date).toISOString() : '', item.code, item.type, item.from, item.to, item.amount])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'uniride-driver-earnings.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const daily = data?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((item) => Number(item.amount) || 0));

  return (
    <div>
      <PageHeader eyebrow="MONEY & PAYOUTS" title="Earnings" description="Track earnings from your completed rides and deliveries." action={<button className="button button-secondary" onClick={exportCsv} disabled={!data?.transactions?.length}><ArrowDownToLine size={17} /> Export CSV</button>} />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stats-grid earnings-stats"><StatCard label="Total earnings" value={formatMoney(data?.summary.total)} note="All completed jobs" /><StatCard label="Ride earnings" value={formatMoney(data?.summary.rideTotal)} note="Passenger trips" /><StatCard label="Delivery earnings" value={formatMoney(data?.summary.deliveryTotal)} note="Product deliveries" /><StatCard label="Average per job" value={formatMoney(data?.summary.averagePerJob)} note={`${data?.summary.completedJobs || 0} completed jobs`} /></div>
      <section className="content-card earnings-chart-card"><div className="card-heading"><div><div className="eyebrow">LAST 7 DAYS</div><h2>Earnings activity</h2><p>Your daily earnings from completed work.</p></div></div>
        {loading ? <div className="loading-panel">Loading earnings…</div> : daily.length === 0 ? <EmptyState title="No earnings activity yet" text="Daily earnings will appear here when jobs are completed." /> : <div className="simple-chart" role="img" aria-label="Daily earnings bar chart">{daily.map((item, index) => <div className="simple-chart-column" key={`${item.label}-${index}`}><strong>{formatMoney(item.amount)}</strong><div className="simple-chart-track"><i style={{ height: `${Math.max(3, ((Number(item.amount) || 0) / maxDaily) * 100)}%` }} /></div><span>{item.label}</span></div>)}</div>}
      </section>
      <section className="content-card transactions-card"><div className="card-heading"><div><div className="eyebrow">PAYMENT HISTORY</div><h2>Completed transactions</h2><p>Driver earnings recorded for each completed job.</p></div><span className="count-pill">{data?.transactions?.length || 0} records</span></div>{loading ? <div className="loading-panel compact">Loading transactions…</div> : !data?.transactions?.length ? <EmptyState title="No earnings yet" text="Your completed rides and deliveries will be listed here." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>JOB</th><th>ROUTE</th><th>DATE</th><th>TYPE</th><th className="align-right">EARNINGS</th></tr></thead><tbody>{data.transactions.map((item) => <tr key={item.id}><td><strong>{item.code}</strong></td><td><div className="transaction-route"><span>{item.from}</span><small>to {item.to}</small></div></td><td>{formatDate(item.date)}</td><td><span className={`type-pill ${item.type.toLowerCase()}`}>{item.type}</span></td><td className="align-right amount-cell">+{formatMoney(item.amount)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}
