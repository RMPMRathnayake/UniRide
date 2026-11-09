import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button, CardHeading, dateTime, EmptyState, Loading, money, PageHeader, PageLink, StatCard, StatusPill } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Overview() {
  const { rider } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/rider/dashboard').then(({ data: result }) => setData(result)).catch((err) => setError(err.response?.data?.message || 'Could not load your dashboard.')); }, []);
  if (!data && !error) return <Loading text="Loading your UniRide dashboard…"/>;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return <>
    <PageHeader eyebrow="YOUR UNIRIDE DASHBOARD" title={`${greeting}, ${rider?.name?.split(' ')[0] || 'there'}.`} subtitle="Your rides, deliveries and spending — all in one place." action={<Link to="/rider/book-ride"><Button>Book a ride</Button></Link>}/>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="stats-grid rider-stats"><StatCard label="Completed rides" value={data?.stats.rides ?? '—'} note="All-time rides"/><StatCard label="Delivered orders" value={data?.stats.orders ?? '—'} note="Food & products"/><StatCard label="Total spending" value={money(data?.stats.totalSpent)} note="Across rides & orders"/><StatCard label="Your rating" value={data?.stats.rating ? `${data.stats.rating.toFixed(1)} / 5` : 'New'} note="Based on your reviews"/></div>
    <div className="quick-actions-grid">
      <Link to="/rider/book-ride" className="quick-action-card"><div><strong>Book a ride</strong><span>Choose pickup and destination</span></div></Link>
      <Link to="/rider/products" className="quick-action-card"><div><strong>Shop products</strong><span>Browse everyday essentials</span></div></Link>
      <Link to="/rider/food" className="quick-action-card"><div><strong>Order food</strong><span>Breakfast, lunch and dinner</span></div></Link>
    </div>
    <section className="content-card overview-recent-card"><CardHeading title="Recent activity" subtitle="Your latest rides and deliveries" action={<PageLink to="/rider/history">View history</PageLink>}/>
      {data?.recent?.length ? <div className="activity-list">{data.recent.map((item) => <div className="activity-row" key={`${item.kind}-${item._id}`}><div className="activity-main"><strong>{item.kind === 'ride' ? 'Ride' : item.orderType === 'food' ? 'Food order' : 'Product order'}</strong><span>{item.kind === 'ride' ? `${item.pickup.address} to ${item.destination.address}` : `${item.shop} · ${item.items?.map((x) => x.name).join(', ')}`}</span><small>{dateTime(item.date)}</small></div><div className="activity-end"><strong>{money(item.amount)}</strong><StatusPill status={item.status}/></div></div>)}</div> : <EmptyState title="Your next journey starts here" text="Book a ride or place an order to see your activity."/>}
    </section>
    <div className="overview-bottom-grid"><section className="content-card"><CardHeading title="Need a quick ride?" subtitle="Your pickup location and destination are just a few taps away."/><div className="simple-feature-content"><div className="feature-copy"><span className="feature-eyebrow">RIDE WITH UNIRIDE</span><strong>Get there with ease.</strong><p>Set your route, choose your ride type and see the estimated fare before confirming.</p><Link to="/rider/book-ride" className="text-link">Start booking</Link></div></div></section>
      <section className="content-card"><CardHeading title="Order something good" subtitle="Fresh meals and useful products, delivered."/><div className="mini-links"><Link to="/rider/food"><div><strong>Food delivery</strong><small>Choose a meal time and restaurant</small></div></Link><Link to="/rider/products"><div><strong>Product delivery</strong><small>Shop from curated collections</small></div></Link></div></section></div>
  </>;
}
