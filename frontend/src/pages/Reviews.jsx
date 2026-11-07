import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { EmptyState, PageHeader, Stars, formatDate } from '../components/UI';

export default function Reviews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/driver/reviews').then((response) => setData(response.data)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); }, []);
  const stats = data?.stats;

  return (
    <div>
      <PageHeader eyebrow="CUSTOMER FEEDBACK" title="Ratings & reviews" description="Customer feedback from your completed rides and deliveries." />
      {error && <div className="alert alert-error">{error}</div>}
      <section className="content-card rating-score-card">
        <div className="eyebrow">YOUR DRIVER RATING</div>
        <div className="rating-score">{stats?.average?.toFixed(1) || '0.0'}<span>/5</span></div>
        <Stars rating={stats?.average || 0} size={22} />
        <p>Based on {stats?.count || 0} customer reviews</p>
      </section>
      <section className="content-card reviews-list-card">
        <div className="card-heading"><div><div className="eyebrow">RECENT FEEDBACK</div><h2>Customer reviews</h2><p>Reviews shared after completed jobs.</p></div><span className="count-pill">{stats?.count || 0} reviews</span></div>
        {loading ? <div className="loading-panel">Loading reviews…</div> : !data?.reviews?.length ? <EmptyState title="No reviews yet" text="Customer feedback will appear after a completed ride or delivery." /> : <div className="review-list">{data.reviews.map((review) => <article className="review-item" key={review._id}><div className="review-avatar">{review.customerName?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div className="review-content"><div className="review-topline"><strong>{review.customerName}</strong><span>{formatDate(review.createdAt)}</span></div><div className="review-rating-line"><Stars rating={review.rating} size={15} /><span className={`type-pill ${review.serviceType}`}>{review.serviceType === 'ride' ? 'Ride' : 'Delivery'}</span></div><p>{review.comment || 'Customer left a rating without a comment.'}</p></div></article>)}</div>}
      </section>
    </div>
  );
}
