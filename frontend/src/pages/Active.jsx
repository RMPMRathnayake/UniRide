import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import RouteMap from '../components/RouteMap';
import { Button, CardHeading, EmptyState, Loading, money, PageHeader, StatusPill } from '../components/UI';

const rideStatusLabel = (status) => ({ available: 'searching', accepted: 'driver_assigned' }[status] || status);
const orderStatusLabel = (status) => ({ pending: 'placed', accepted: 'preparing', picked_up: 'on_the_way' }[status] || status);

export default function Active() {
  const location = useLocation();
  const [rides, setRides] = useState([]);
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const [rideRes, orderRes] = await Promise.all([api.get('/rides?scope=active'), api.get('/orders?scope=active')]);
      setRides(rideRes.data.rides || []); setOrders(orderRes.data.orders || []); setError('');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const cancelRide = async (ride) => {
    setBusyId(ride._id); setError('');
    try { const { data } = await api.patch(`/rides/${ride._id}/status`, { status: 'cancelled' }); setNotice(data.message); await load(); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusyId(''); }
  };
  const cancelOrder = async (order) => {
    setBusyId(order._id); setError('');
    try { const { data } = await api.patch(`/orders/${order._id}/status`, { status: 'cancelled' }); setNotice(data.message); await load(); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusyId(''); }
  };
  if (loading) return <Loading text="Loading your active trips and orders…"/>;
  return <>
    <PageHeader title="Active activity" subtitle="Follow your current ride requests and delivery orders." action={<Button variant="secondary" onClick={load}>Refresh</Button>}/>
    {notice && <div className="alert alert-success">{notice}<button type="button" onClick={() => setNotice('')}>Close</button></div>}{error && <div className="alert alert-error">{error}</div>}
    <div className="active-section"><CardHeading title="Your rides" subtitle={`${rides.length} active ${rides.length === 1 ? 'ride' : 'rides'}`}/>
      {rides.length ? <div className="active-card-list">{rides.map((ride) => <article className="active-journey-card" key={ride._id}><div className="active-journey-main"><div className="active-card-top"><span className="activity-type-tag">RIDE · {ride.rideType}</span><StatusPill status={rideStatusLabel(ride.status)}/></div><div className="journey-endpoints"><div><span><small>PICKUP</small><strong>{ride.pickup.address}</strong></span></div><div><span><small>DESTINATION</small><strong>{ride.destination?.address || ride.dropoff?.address}</strong></span></div></div><div className="active-trip-meta"><span>{Number(ride.distanceKm || 0).toFixed(1)} km</span><span>{Math.round(ride.durationMin || 0)} min est.</span><strong>{money(ride.fare ?? ride.estimatedFare)}</strong></div>
            {ride.driver?.name && <div className="driver-assigned-box"><span className="driver-avatar">{ride.driver.name.slice(0, 1)}</span><div><strong>{ride.driver.name}</strong><small>{ride.driver.vehicle || 'Your UniRide driver'}</small></div>{ride.driver.phone && <a href={`tel:${ride.driver.phone}`} className="text-link">Call</a>}</div>}
            <div className="active-actions">{ride.status === 'available' && <Button variant="secondary" disabled={busyId === ride._id} onClick={() => cancelRide(ride)}>{busyId === ride._id ? 'Cancelling…' : 'Cancel request'}</Button>}{ride.status === 'accepted' && <span className="trip-progress-note">Your driver accepted this ride and is preparing to start the trip.</span>}{ride.status === 'in_progress' && <span className="trip-progress-note">Your trip is in progress. You will see it in History when your driver completes it.</span>}</div>
          </div><div className="active-map-preview"><RouteMap origin={ride.pickup} destination={ride.destination || ride.dropoff} height={190} compact/></div></article>)}</div> : <div className="content-card"><EmptyState title="No active rides" text="Your ride requests will appear here after you book."/></div>}
    </div>
    <div className="active-section"><CardHeading title="Your orders" subtitle={`${orders.length} active ${orders.length === 1 ? 'order' : 'orders'}`}/>
      {orders.length ? <div className="active-card-list">{orders.map((order) => <article className="active-journey-card" key={order._id}><div className="active-journey-main"><div className="active-card-top"><span className="activity-type-tag">{order.orderType === 'food' ? 'FOOD ORDER' : 'PRODUCT ORDER'} · {order.shop}</span><StatusPill status={orderStatusLabel(order.status)}/></div><div className="order-item-summary">{order.items?.slice(0, 3).map((item, index) => <span key={`${item.itemId || item.name}-${index}`}>{item.quantity} × {item.name}</span>)}</div><div className="journey-endpoints"><div><span><small>PICKUP</small><strong>{order.pickupAddress || order.shop}</strong></span></div><div><span><small>DELIVERY TO</small><strong>{order.deliveryAddress}</strong></span></div></div><div className="active-trip-meta"><span>{order.receiptNumber}</span><strong>{money(order.total)}</strong></div>{order.driver?.name && <div className="driver-assigned-box"><span className="driver-avatar">{order.driver.name.slice(0, 1)}</span><div><strong>{order.driver.name}</strong><small>UniRide delivery partner</small></div>{order.driver.phone && <a href={`tel:${order.driver.phone}`} className="text-link">Call</a>}</div>}
            <div className="active-actions">{order.status === 'pending' && <Button variant="secondary" disabled={busyId === order._id} onClick={() => cancelOrder(order)}>{busyId === order._id ? 'Cancelling…' : 'Cancel order'}</Button>}{order.status === 'accepted' && <span className="trip-progress-note">A driver has accepted your order and is heading to the shop.</span>}{order.status === 'picked_up' && <span className="trip-progress-note">Your order is on the way to your delivery address.</span>}</div>
          </div><div className="active-map-preview"><RouteMap origin={{ address: order.pickupAddress || order.shop, coordinates: order.pickupCoordinates?.length === 2 ? order.pickupCoordinates : [81.8592, 7.3021] }} destination={{ address: order.deliveryAddress, coordinates: order.deliveryCoordinates?.length === 2 ? order.deliveryCoordinates : [81.856875, 7.300617] }} height={190} compact/></div></article>)}</div> : <div className="content-card"><EmptyState title="No active orders" text="Your product and food orders will appear here."/></div>}
      <p className="demo-note">Your booking status is shared with the driver portal. When a driver accepts or completes a job, the update appears here automatically after you refresh.</p>
    </div>
  </>;
}
