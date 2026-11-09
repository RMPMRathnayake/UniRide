import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/UI';

export default function Profile() {
  const { driver } = useAuth();
  const initials = driver?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'DR';
  return (
    <div>
      <PageHeader eyebrow="DRIVER ACCOUNT" title="Driver profile" description="Your personal and vehicle information." />
      <section className="profile-hero-card">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-hero-info"><h2>{driver?.name}</h2><p>{driver?.email}</p><div className="profile-hero-meta"><span>{driver?.vehicleType || 'Vehicle details not set'}</span><span>{driver?.vehicleNumber || 'Registration not set'}</span></div></div>
        <span className={`profile-online-pill ${driver?.status === 'online' ? 'online' : ''}`}><i /> {driver?.status === 'online' ? 'Available' : 'Not Available'}</span>
      </section>
      <div className="profile-details-grid">
        <section className="content-card profile-details-card"><div className="card-heading"><div><div className="eyebrow">PERSONAL INFORMATION</div><h2>Contact details</h2></div></div>
          <div className="profile-detail-row"><div><span>Full name</span><strong>{driver?.name || '—'}</strong></div></div>
          <div className="profile-detail-row"><div><span>Email address</span><strong>{driver?.email || '—'}</strong></div></div>
          <div className="profile-detail-row"><div><span>Phone number</span><strong>{driver?.phone || '—'}</strong></div></div>
          <div className="profile-detail-row"><div><span>Driver licence number</span><strong>{driver?.licenseNumber || 'Not provided'}</strong></div></div>
          <div className="profile-detail-row"><div><span>Account verification</span><strong>{driver?.documentStatus === 'approved' ? 'Approved' : driver?.documentStatus === 'rejected' ? 'Rejected' : 'Pending approval'}</strong></div></div>
        </section>
        <section className="content-card profile-details-card"><div className="card-heading"><div><div className="eyebrow">VEHICLE INFORMATION</div><h2>Your vehicle</h2></div></div>
          <div className="profile-detail-row"><div><span>Vehicle type</span><strong>{driver?.vehicleType || '—'}</strong></div></div>
          <div className="profile-detail-row"><div><span>Registration number</span><strong>{driver?.vehicleNumber || '—'}</strong></div></div>
          <p className="profile-footnote">Vehicle information is managed by your platform administrator.</p>
        </section>
      </div>
    </div>
  );
}
