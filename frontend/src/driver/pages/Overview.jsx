import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Star } from '../components/Icon';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, PageHeader, StatCard, StatusBadge, formatMoney } from '../components/UI';

export default function Overview() {
  const { driver } = useAuth();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [dashboard, rideResponse, orderResponse] = await Promise.all([
        api.get('/driver/dashboard'), api.get('/rides', { params: { scope: 'available' } }), api.get('/deliveries', { params: { scope: 'available' } })
      ]);
      setStats(dashboard.data.stats);
      const rides = (rideResponse.data.rides || []).map((item) => ({ ...item, jobType: 'ride', code: item.bookingCode, earning: item.driverEarning }));
      const orders = (orderResponse.data.orders || []).map((item) => ({ ...item, jobType: 'delivery', code: item.orderCode, earning: item.driverEarning }));
      setJobs([...rides, ...orders].slice(0, 4));
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader eyebrow="DRIVER OVERVIEW" title={`${greeting}, ${driver?.name?.split(' ')[0] || 'Driver'}.`} description="Your rides, deliveries and earnings in one place." action={<button className="button button-secondary" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh</button>} />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Today's earnings" value={formatMoney(stats?.todayEarnings)} note="Completed jobs today" />
        <StatCard label="Available jobs" value={stats?.availableJobs ?? '—'} note={`${stats?.availableRides ?? 0} rides · ${stats?.availableOrders ?? 0} deliveries`} />
        <StatCard label="Active jobs" value={stats?.activeJobs ?? '—'} note="Accepted and in progress" />
        <StatCard label="Driver rating" value={stats ? `${stats.averageRating.toFixed(1)} / 5` : '—'} note={`${stats?.reviewCount ?? 0} customer reviews`} />
      </div>
      <section className="content-card overview-jobs-card">
        <div className="card-heading">
          <div><div className="eyebrow">NEW OPPORTUNITIES</div><h2>Available jobs</h2><p>Recent ride requests and product deliveries.</p></div>
          <Link className="text-link" to="/driver/available">View all <span>→</span></Link>
        </div>
        {loading ? <div className="loading-panel compact">Finding available jobs…</div> : jobs.length === 0 ? <EmptyState title="No new requests" text="New requests will appear here when they're available." /> : <div className="overview-job-list">{jobs.map((job) => <div className="overview-job-row" key={`${job.jobType}-${job._id}`}><div className={`overview-job-type ${job.jobType}`}>{job.jobType === 'ride' ? 'RIDE' : 'DELIVERY'}</div><div className="overview-job-main"><div><strong>{job.code}</strong><StatusBadge status={job.status} /></div><span>{job.pickup.address}</span><small>to {job.dropoff.address}</small></div><div className="overview-job-price"><strong>{formatMoney(job.earning)}</strong><span>{job.jobType === 'ride' ? 'Ride' : 'Delivery'}</span></div></div>)}</div>}
        <Link className="wide-link" to="/driver/available">Explore available work <span>→</span></Link>
      </section>
      <div className="overview-bottom-line"><span>{stats?.completedJobs ?? 0} completed jobs</span><span><Star size={14} /> {stats?.averageRating?.toFixed(1) || '0.0'} driver rating</span><Link to="/driver/earnings">View earnings →</Link></div>
    </div>
  );
}
