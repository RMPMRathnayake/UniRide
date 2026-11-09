import { useEffect, useState } from 'react';
import api from '../services/api';

const locationSearchCache = new Map();

export default function LocationSearch({ label, value, onChange, placeholder = 'Search a place or address', helper, onPickOnMap, picking = false }) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (value?.address) setQuery(value.address); }, [value?.address]);

  const search = async () => {
    const term = query.trim();
    if (term.length < 3) { setError('Enter at least 3 characters to search.'); setResults([]); setOpen(true); return; }
    const cacheKey = term.toLocaleLowerCase();
    const cached = locationSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) {
      setResults(cached.results);
      setError(cached.results.length ? '' : 'No places found. Try a more specific address.');
      setOpen(true);
      return;
    }
    setLoading(true); setError(''); setResults([]); setOpen(true);
    try {
      const { data } = await api.get('/geocoding/search', { params: { q: term }, timeout: 10000 });
      const found = data.results || [];
      locationSearchCache.set(cacheKey, { results: found, savedAt: Date.now() });
      if (locationSearchCache.size > 80) locationSearchCache.delete(locationSearchCache.keys().next().value);
      setResults(found);
      if (!found.length) setError('No places found. Try a more specific address.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Location search failed.');
    } finally { setLoading(false); }
  };
  const select = (result) => { onChange(result); setQuery(result.address); setResults([]); setOpen(false); setError(''); };
  const edit = (next) => { setQuery(next); setResults([]); setOpen(false); setError(''); if (value) onChange(null); };
  return <div className="form-field location-field">
    <label>{label}</label>
    <div className="location-input-wrap">
      <input className="plain-input" value={query} onChange={(event) => edit(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); search(); } }} placeholder={placeholder} autoComplete="off" />
      <button type="button" className="location-search-button" onClick={search} disabled={loading || query.trim().length < 3}>{loading ? 'Searching…' : 'Search'}</button>
      {onPickOnMap && <button type="button" className={`location-map-pick-button ${picking ? 'active' : ''}`} onClick={onPickOnMap}>{picking ? 'Select on map' : 'Pick on map'}</button>}
    </div>
    {helper && <small>{helper}</small>}
    {error && <div className="location-result-error">{error}</div>}
    {open && results.length > 0 && <div className="location-results">{results.map((item, index) => <button type="button" key={`${item.coordinates.join(',')}-${index}`} className="location-result" onClick={() => select(item)}><strong>{item.address.split(',').slice(0, 2).join(', ')}</strong><span>{item.address}</span></button>)}</div>}
    {value && <div className="selected-location">Selected: {value.address.split(',').slice(0, 3).join(', ')}</div>}
  </div>;
}
