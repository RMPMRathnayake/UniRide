import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { CardHeading, EmptyState, Loading, PageHeader, shortDate, Stars } from '../components/UI';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/reviews').then(({ data }) => setReviews(data.reviews)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); }, []);
  const average = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0;
  if (loading) return <Loading text="Loading your reviews…"/>;
  return <>
    <PageHeader title="Your reviews" subtitle="All the feedback you have shared about your UniRide experiences." action={<Link to="/rider/history" className="button button-secondary">Review completed activity</Link>}/>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="review-overview-grid"><div className="rating-score-card"><div className="rating-score">{average ? average.toFixed(1) : '—'}<span>/ 5</span></div><Stars value={Math.round(average)}/><p>Average rating you have given</p></div><div className="review-count-card"><strong>{reviews.length}</strong><span>Reviews submitted</span><small>Your ratings help UniRide improve its service.</small></div><div className="review-count-card"><strong>{reviews.filter((x) => x.targetType === 'ride').length}</strong><span>Ride reviews</span><small>Feedback about your completed trips.</small></div><div className="review-count-card"><strong>{reviews.filter((x) => x.targetType === 'delivery').length}</strong><span>Delivery reviews</span><small>Feedback about delivered orders.</small></div></div>
    <section className="content-card reviews-list-card"><CardHeading title="Review history" subtitle="Your submitted ratings and comments."/>
      {reviews.length ? <div className="reviews-list">{reviews.map((item) => <article className="review-item" key={item._id}><div className="review-content"><div className="review-topline"><div><strong>{item.targetType === 'ride' ? 'Ride experience' : 'Delivery experience'}</strong><small>{item.targetName}</small></div><span>{shortDate(item.createdAt)}</span></div><div className="review-rating-line"><Stars value={item.rating}/><span>{item.rating}.0 / 5</span></div>{item.comment && <p>“{item.comment}”</p>}</div></article>)}</div> : <EmptyState title="No reviews yet" text="After a ride is completed or an order is delivered, you can leave a rating in your history."/>}
    </section>
  </>;
}
