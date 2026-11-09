import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { Button, CardHeading, Loading, PageHeader, shortDate } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { rider } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/rider/profile').then(({ data: result }) => setData(result)).catch((err) => setError(getErrorMessage(err))); }, []);
  if (!data && !error) return <Loading text="Loading your profile…"/>;
  const name = data?.rider?.name || rider?.name || 'UniRide Rider';
  const initials = name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return <>
    <PageHeader title="Your profile" subtitle="Your account information and UniRide activity at a glance." action={<Link to="/rider/settings"><Button variant="secondary">Edit profile</Button></Link>}/>
    {error && <div className="alert alert-error">{error}</div>}
    <section className="profile-hero-card"><div className="profile-avatar-large">{initials}</div><div className="profile-hero-info"><div className="eyebrow">UNIRIDE RIDER ACCOUNT</div><h2>{name}</h2><p>{data?.rider?.email || rider?.email}</p><div className="profile-hero-meta"><span>Member since {shortDate(data?.rider?.createdAt || rider?.createdAt)}</span><span>Rider account</span></div></div><div className="profile-account-status">Active account</div></section>
    <div className="profile-stats-grid"><div className="profile-stat"><strong>{data?.stats?.completedRides || 0}</strong><span>Completed rides</span></div><div className="profile-stat"><strong>{data?.stats?.completedOrders || 0}</strong><span>Delivered orders</span></div><div className="profile-stat"><strong>{data?.stats?.rating ? data.stats.rating.toFixed(1) : '—'}</strong><span>Average review rating</span></div><div className="profile-stat"><strong>{data?.stats?.reviews || 0}</strong><span>Reviews submitted</span></div></div>
    <div className="profile-details-layout"><section className="content-card"><CardHeading title="Personal information" subtitle="Contact details used for your UniRide account."/><div className="profile-details-grid"><div className="profile-detail-row"><span>Full name</span><strong>{data?.rider?.name}</strong></div><div className="profile-detail-row"><span>Email address</span><strong>{data?.rider?.email}</strong></div><div className="profile-detail-row"><span>Phone number</span><strong>{data?.rider?.phone || 'Not added'}</strong></div><div className="profile-detail-row"><span>Account created</span><strong>{shortDate(data?.rider?.createdAt)}</strong></div></div><Link to="/rider/settings" className="wide-link">Manage account settings </Link></section>
      <section className="content-card"><CardHeading title="Your UniRide activity" subtitle="Manage the services you use."/><div className="profile-menu-list"><Link to="/rider/history"><div><strong>Ride & order history</strong><small>View your completed trips and orders</small></div></Link><Link to="/rider/spending"><div><strong>Spending</strong><small>Review your transaction history</small></div></Link><Link to="/rider/reviews"><div><strong>Your reviews</strong><small>View the feedback you have shared</small></div></Link></div></section></div>
  </>;
}
