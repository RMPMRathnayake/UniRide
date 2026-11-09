import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CarFront, CheckCircle2, Clock3, Package, Phone, Printer, RefreshCw, Route as RouteIcon, UserRound } from '../components/Icon';
import api, { getErrorMessage } from '../services/api';
import RouteMap from '../components/RouteMap';
import ReceiptPrint from '../components/ReceiptPrint';
import { EmptyState, PageHeader, RouteEndpoints, ServiceIcon, StatusBadge, formatDate, formatMoney } from '../components/UI';

const tabs = [
  { id: 'ride', label: 'Rides', icon: CarFront },
  { id: 'delivery', label: 'Product deliveries', icon: Package }
];

function getCode(job, type) { return type === 'ride' ? job.bookingCode : job.orderCode; }
function getEarning(job, type) { return type === 'ride' ? job.driverEarning : job.driverEarning; }
function getCustomer(job, type) { return type === 'ride' ? job.passengerName : job.customerName; }

function JobListCard({ job, type, active, onClick, mode }) {
  const code = getCode(job, type);
  return (
    <button className={`job-list-card ${active ? 'selected' : ''}`} onClick={onClick}>
      <div className="job-card-top"><div className="job-card-code"><ServiceIcon type={type} /><span>{code}</span></div><strong>{formatMoney(getEarning(job, type))}</strong></div>
      <div className="job-card-route"><div className="route-mini-dots"><i /><b /><i /></div><div className="route-mini-text"><span>{job.pickup.address}</span><span>{job.dropoff.address}</span></div></div>
      <div className="job-card-bottom"><span className="job-card-customer">{getCustomer(job, type)}</span><StatusBadge status={job.status} /></div>
    </button>
  );
}

export default function Jobs({ mode }) {
  const [service, setService] = useState('ride');
  const [rides, setRides] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async (keepSelection = true) => {
    setLoading(true);
    setError('');
    try {
      const [rideResponse, orderResponse] = await Promise.all([
        api.get('/rides', { params: { scope: mode } }),
        api.get('/deliveries', { params: { scope: mode } })
      ]);
      const nextRides = rideResponse.data.rides || [];
      const nextOrders = orderResponse.data.orders || [];
      setRides(nextRides);
      setOrders(nextOrders);
      const currentIds = [...nextRides.map((item) => `ride:${item._id}`), ...nextOrders.map((item) => `delivery:${item._id}`)];
      setSelectedId((current) => keepSelection && currentIds.includes(current) ? current : currentIds[0] || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { load(false); }, [load]);
  const items = service === 'ride' ? rides : orders;
  const selected = useMemo(() => items.find((job) => `${service}:${job._id}` === selectedId) || null, [items, service, selectedId]);
  const title = mode === 'available' ? 'Available jobs' : mode === 'active' ? 'Active jobs' : 'Completed jobs';
  const description = mode === 'available' ? 'Choose a ride or delivery request that fits your route.' : mode === 'active' ? 'Keep track of accepted trips and deliveries through to completion.' : 'Review your finished work and print delivery receipts.';

  const performAction = async () => {
    if (!selected) return;
    setWorking(true); setError(''); setSuccess('');
    try {
      let response;
      if (mode === 'available') {
        response = service === 'ride'
          ? await api.post(`/rides/${selected._id}/accept`)
          : await api.post(`/deliveries/${selected._id}/accept`);
      } else if (service === 'ride') {
        const status = selected.status === 'accepted' ? 'in_progress' : 'completed';
        response = await api.patch(`/rides/${selected._id}/status`, { status });
      } else {
        const status = selected.status === 'accepted' ? 'picked_up' : 'delivered';
        response = await api.patch(`/deliveries/${selected._id}/status`, { status });
      }
      setSuccess(response.data.message || 'Job updated successfully.');
      await load(false);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setWorking(false); }
  };

  const actionLabel = mode === 'available' ? service === 'ride' ? 'Accept this ride' : 'Accept this delivery' : service === 'ride' ? selected?.status === 'accepted' ? 'Start ride' : 'Complete ride' : selected?.status === 'accepted' ? 'Confirm pickup' : 'Mark as delivered';

  return (
    <div>
      <PageHeader eyebrow="JOB MANAGEMENT" title={title} description={description} action={<button className="button button-secondary" onClick={() => load(true)} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button>} />
      <div className="service-tabs">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={service === id ? 'active' : ''} onClick={() => { setService(id); setSelectedId((id === 'ride' ? rides : orders)[0] ? `${id}:${(id === 'ride' ? rides : orders)[0]._id}` : ''); }}><Icon size={17} />{label}<span>{id === 'ride' ? rides.length : orders.length}</span></button>)}</div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading ? <div className="loading-panel">Loading jobs…</div> : items.length === 0 ? <EmptyState title={mode === 'available' ? 'No available jobs right now' : mode === 'active' ? 'No active jobs' : 'No completed jobs yet'} text={mode === 'available' ? 'Set your status to Available and check back soon. New ride and delivery requests will show here.' : 'Jobs will appear here as you accept and complete work.'} icon={service === 'ride' ? CarFront : Package} /> : (
        <div className="jobs-layout">
          <section className="jobs-list-panel"><div className="panel-heading"><div><strong>{service === 'ride' ? 'Ride requests' : 'Delivery orders'}</strong><span>{items.length} {items.length === 1 ? 'job' : 'jobs'}</span></div><span className="panel-heading-note">Select a job to view</span></div><div className="job-list-scroll">{items.map((job) => <JobListCard key={job._id} job={job} type={service} mode={mode} active={selectedId === `${service}:${job._id}`} onClick={() => setSelectedId(`${service}:${job._id}`)} />)}</div></section>
          {selected ? <section className="job-detail-panel">
            <div className="job-detail-header"><div><div className="eyebrow">{service === 'ride' ? 'RIDE BOOKING' : 'PRODUCT DELIVERY'}</div><h2>{getCode(selected, service)}</h2><div className="job-detail-meta"><StatusBadge status={selected.status} /><span><Clock3 size={13} /> {formatDate(selected.requestedAt, { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="job-detail-earning"><span>YOUR EARNING</span><strong>{formatMoney(getEarning(selected, service))}</strong></div></div>
            <RouteMap origin={selected.pickup} destination={selected.dropoff} height={250} />
            <div className="route-address-card"><RouteEndpoints from={selected.pickup.address} to={selected.dropoff.address} /></div>
            <div className="detail-info-grid"><div className="detail-info-item"><UserRound size={16} /><div><span>{service === 'ride' ? 'Passenger' : 'Customer'}</span><strong>{getCustomer(selected, service)}</strong></div></div><div className="detail-info-item"><Phone size={16} /><div><span>Contact number</span><strong>{(service === 'ride' ? selected.passengerPhone : selected.customerPhone) || 'Not provided'}</strong></div></div><div className="detail-info-item"><RouteIcon size={16} /><div><span>Estimated distance</span><strong>{Number(selected.distanceKm || 0).toFixed(1)} km</strong></div></div><div className="detail-info-item"><ArrowDownLeft size={16} /><div><span>Payment method</span><strong>{selected.paymentMethod || '—'}</strong></div></div></div>
            {service === 'delivery' && <div className="package-info"><div className="package-info-icon"><Package size={17} /></div><div><strong>{selected.packageDescription || 'Delivery package'}</strong><span>{selected.items?.length ? selected.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ') : 'Package details not provided'}</span></div></div>}
            {mode === 'completed' && service === 'delivery' ? <div className="detail-action-row"><div className="completed-note"><CheckCircle2 size={17} /><span>Delivery completed {selected.deliveredAt ? formatDate(selected.deliveredAt) : ''}</span></div><button className="button button-primary" onClick={() => window.print()}><Printer size={16} /> Print receipt</button></div> : mode === 'completed' ? <div className="completed-note standalone"><CheckCircle2 size={17} /><span>Ride completed {selected.completedAt ? formatDate(selected.completedAt) : ''}</span></div> : <div className="detail-action-row"><div className="earn-note"><ArrowUpRight size={17} /><span>You'll earn <strong>{formatMoney(getEarning(selected, service))}</strong> for this {service === 'ride' ? 'ride' : 'delivery'}.</span></div><button className="button button-primary" onClick={performAction} disabled={working}>{working ? 'Updating…' : actionLabel}<ArrowUpRight size={16} /></button></div>}
          </section> : <div className="detail-empty"><EmptyState title="Select a job" text="Choose a job from the list to see its route and details." /></div>}
        </div>
      )}
      {mode === 'completed' && service === 'delivery' && selected && <ReceiptPrint order={selected} />}
    </div>
  );
}
