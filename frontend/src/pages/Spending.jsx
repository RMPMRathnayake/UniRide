import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { CardHeading, EmptyState, Loading, money, PageHeader, shortDate } from '../components/UI';

export default function Spending() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  useEffect(() => { api.get('/rider/spending').then(({ data: result }) => setData(result)).catch((err) => setError(getErrorMessage(err))); }, []);
  const rows = useMemo(() => (data?.transactions || []).filter((row) => filter === 'All' || row.type === filter), [data, filter]);
  const monthly = useMemo(() => {
    const list = Array.from({ length: 6 }, (_x, i) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - i)); return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString([], { month: 'short' }), amount: 0 }; });
    (data?.transactions || []).forEach((row) => { const d = new Date(row.date); const key = `${d.getFullYear()}-${d.getMonth()}`; const found = list.find((x) => x.key === key); if (found) found.amount += row.amount; });
    return list;
  }, [data]);
  const max = Math.max(1, ...monthly.map((x) => x.amount));
  if (!data && !error) return <Loading text="Calculating your spending…"/>;
  return <>
    <PageHeader title="Spending" subtitle="Keep track of what you spend on rides, food and products."/>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="spending-summary-grid"><div className="spending-summary-card spending-primary"><span>Total spending</span><strong>{money(data?.total)}</strong><small>Completed rides and delivered orders</small></div><div className="spending-summary-card"><span>This month</span><strong>{money(data?.monthTotal)}</strong><small>From the start of this month</small></div><div className="spending-summary-card"><span>Transactions</span><strong>{data?.transactions?.length || 0}</strong><small>Completed activities</small></div></div>
    <section className="content-card spending-chart-card"><CardHeading title="Spending overview" subtitle="Your last six months of completed activity."/><div className="spending-chart">{monthly.map((item) => <div className="spending-chart-column" key={item.key}><strong>{item.amount ? money(item.amount) : '—'}</strong><div className="spending-chart-track"><div className="spending-chart-bar" style={{ height: `${Math.max(item.amount ? 6 : 0, item.amount / max * 100)}%` }}></div></div><span>{item.label}</span></div>)}</div></section>
    <section className="content-card spending-transactions"><CardHeading title="Your transactions" subtitle="A detailed list of completed rides and deliveries."/><div className="filter-row">{['All', 'Ride', 'Food order', 'Product order'].map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {rows.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Activity</th><th>Type</th><th>Date</th><th className="align-right">Amount</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.title}</strong></td><td><span className={`transaction-type ${row.type === 'Ride' ? 'ride' : 'delivery'}`}>{row.type}</span></td><td>{shortDate(row.date)}</td><td className="align-right"><strong>{money(row.amount)}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="No transactions found" text="Try another filter or complete your first activity."/>}
    </section>
  </>;
}
