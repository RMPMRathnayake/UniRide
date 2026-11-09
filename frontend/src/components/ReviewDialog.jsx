import { useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { Button, Stars } from './UI';

export default function ReviewDialog({ target, targetType, onClose, onSaved }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!target) return null;
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/reviews', { targetType, targetId: target._id, rating, comment });
      onSaved(); onClose();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="review-modal"><button type="button" className="modal-close" onClick={onClose}>Close</button><div className="eyebrow">SHARE YOUR EXPERIENCE</div><h2>How was your {targetType === 'ride' ? 'ride' : 'delivery'}?</h2><p>{targetType === 'ride' ? `${target.pickup?.address || ''} to ${target.destination?.address || ''}` : `${target.shop || ''} order`}</p><form onSubmit={submit}><div className="review-rating-select"><Stars value={rating} onChange={setRating} size="large"/><span>{rating} / 5 · {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}</span></div><label className="form-field">Your review<textarea className="plain-input review-textarea" rows="4" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell us about your experience (optional)" maxLength={1000}/></label>{error && <div className="alert alert-error">{error}</div>}<div className="form-actions"><Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</Button><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></div></form></div></div>;
}
