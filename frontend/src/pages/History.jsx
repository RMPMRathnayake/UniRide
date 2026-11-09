import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import RouteMap from '../components/RouteMap';
import ReceiptPrint from '../components/ReceiptPrint';
import ReviewDialog from '../components/ReviewDialog';
import { Button, CardHeading, EmptyState, Loading, money, PageHeader, shortDate, StatusPill } from '../components/UI';

export default function History() {
  const [tab, setTab] = useState('rides');
  const [rides, setRides] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const [rideRes, orderRes, reviewRes] = await Promise.all([api.get('/rides?scope=completed'), api.get('/orders?scope=completed'), api.get('/reviews')]);
      const rideRows = rideRes.data.rides; const orderRows = orderRes.data.orders;
      setRides(rideRows); setOrders(orderRows); setReviews(reviewRes.data.reviews);
      setSelected((prev) => {
        if (!prev) return null;
        const rows = prev.kind === 'ride' ? rideRows : orderRows;
        const next = rows.find((x) => x._id === prev.item._id);
        return next ? { kind: prev.kind, item: next } : null;
      });
      setError('');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const rows = useMemo(() => (tab === 'rides' ? rides.map((item) => ({ kind: 'ride', item })) : orders.map((item) => ({ kind: 'order', item }))), [tab, rides, orders]);
  const reviewFor = (item) => reviews.find((x) => String(x.targetId) === String(item._id));
  const choose = (row) => setSelected(row);
  if (loading) return <Loading text="Loading completed activity…"/>;
  return <>
    <PageHeader title="Your history" subtitle="Completed rides and delivered orders, with routes and receipts." action={<Button variant="secondary" onClick={load}>Refresh</Button>}/>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="service-tabs history-tabs"><button className={tab === 'rides' ? 'active' : ''} onClick={() => { setTab('rides'); setSelected(null); }}>Completed rides <span>{rides.length}</span></button><button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); setSelected(null); }}>Delivered orders <span>{orders.length}</span></button></div>
    <div className="history-layout"><section className="history-list-panel"><div className="panel-heading"><div><strong>{tab === 'rides' ? 'Ride history' : 'Order history'}</strong><span>Select an item to view details</span></div></div>
      {rows.length ? rows.map((row) => {
        const item = row.item; const review = reviewFor(item); const title = row.kind === 'ride' ? `${item.pickup.address.split(',').slice(0, 2).join(', ')} to ${item.destination.address.split(',').slice(0, 2).join(', ')}` : item.shop;
        return <button type="button" className={`history-list-item ${selected?.item?._id === item._id ? 'selected' : ''}`} key={item._id} onClick={() => choose(row)}><div className="history-item-top"><span className="history-item-type">{row.kind === 'ride' ? item.rideType : item.orderType === 'food' ? 'Food' : 'Product'}</span><StatusPill status={row.kind === 'ride' ? item.status : item.status}/></div><strong>{title}</strong><small>{shortDate(row.kind === 'ride' ? item.completedAt || item.createdAt : item.deliveredAt || item.createdAt)}</small><div className="history-item-bottom"><strong>{money(row.kind === 'ride' ? item.fare : item.total)}</strong>{review ? <span className="reviewed-label">{review.rating} / 5 reviewed</span> : <span className="review-pending-label">Review pending</span>}</div></button>;
      }) : <EmptyState title={tab === 'rides' ? 'No completed rides yet' : 'No delivered orders yet'} text="Your completed activity will appear here."/>}
    </section>
    <section className="history-detail-panel">{selected ? <>
      <div className="history-detail-header"><div><div className="eyebrow">{selected.kind === 'ride' ? 'COMPLETED RIDE' : 'DELIVERED ORDER'}</div><h2>{selected.kind === 'ride' ? 'Trip details' : 'Order details'}</h2><p>{shortDate(selected.item.completedAt || selected.item.deliveredAt || selected.item.createdAt)}</p></div><StatusPill status={selected.item.status}/></div>
      {selected.kind === 'ride' ? <><RouteMap origin={selected.item.pickup} destination={selected.item.destination} height={275}/><div className="history-route-addresses"><div><small>PICKUP</small><strong>{selected.item.pickup.address}</strong></div><div><small>DESTINATION</small><strong>{selected.item.destination.address}</strong></div></div><div className="history-info-grid"><div><span>Ride type</span><strong>{selected.item.rideType}</strong></div><div><span>Distance</span><strong>{Number(selected.item.distanceKm).toFixed(1)} km</strong></div><div><span>Duration</span><strong>{Math.round(selected.item.durationMin || 0)} min</strong></div><div><span>Driver</span><strong>{selected.item.driver?.name || 'UniRide driver'}</strong></div></div><div className="history-total-row"><span>Total ride fare</span><strong>{money(selected.item.fare)}</strong></div></> : <><RouteMap origin={{ address: selected.item.pickupAddress || selected.item.shop, coordinates: selected.item.pickupCoordinates?.length === 2 ? selected.item.pickupCoordinates : [81.8592, 7.3021] }} destination={{ address: selected.item.deliveryAddress, coordinates: selected.item.deliveryCoordinates?.length === 2 ? selected.item.deliveryCoordinates : [81.856875, 7.300617] }} height={275}/><div className="history-order-heading"><div><small>MERCHANT</small><strong>{selected.item.shop}</strong></div><span>{selected.item.orderType === 'food' ? `${selected.item.meal} · Food` : 'Product order'}</span></div><div className="history-order-items">{selected.item.items?.map((item, index) => <div key={`${item.itemId}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="history-route-addresses"><div><small>PICKUP FROM</small><strong>{selected.item.pickupAddress || selected.item.shop}</strong></div><div><small>DELIVERED TO</small><strong>{selected.item.deliveryAddress}</strong></div></div><div className="history-total-row"><span>Order total</span><strong>{money(selected.item.total)}</strong></div><div className="history-action-row"><Button variant="secondary" onClick={() => setReceipt(selected.item)}>Print receipt</Button></div></>}
      <div className="history-review-area">{reviewFor(selected.item) ? <div className="existing-review"><span>Your rating</span><strong>{reviewFor(selected.item).rating} / 5</strong>{reviewFor(selected.item).comment && <p>“{reviewFor(selected.item).comment}”</p>}</div> : <><div><strong>How was your experience?</strong><small>Share feedback about this {selected.kind === 'ride' ? 'ride' : 'delivery'}.</small></div><Button onClick={() => setReviewTarget(selected)}>Rate & review</Button></>}</div>
      </> : <EmptyState title="Select a completed item" text="Choose a ride or delivered order from the list to see its route, details and receipt."/>}</section></div>
    <ReviewDialog target={reviewTarget?.item} targetType={reviewTarget?.kind === 'ride' ? 'ride' : 'delivery'} onClose={() => setReviewTarget(null)} onSaved={load}/>
    <ReceiptPrint order={receipt} onClose={() => setReceipt(null)}/>
  </>;
}
