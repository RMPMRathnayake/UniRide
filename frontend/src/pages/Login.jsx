import { useState } from 'react';
import { Eye, EyeOff } from '../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';


function NavBrand() {
  return <div className="login-brand-mark">
    <img src="/logo.png" alt="UniRide" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />
    <span className="brand-context">DRIVER PORTAL</span>
  </div>;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/', { replace: true }); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <main className="login-screen">
      <div className="login-content">
        <section className="login-intro">
          <NavBrand />
          <div className="login-brand-copy">
            <div className="eyebrow">UNIVERSITY RIDE &amp; DELIVERY PLATFORM</div>
            <h1>Make your day easy.</h1>
            <p>One platform for university rides, deliveries and the people who keep them moving.</p>
          </div>
          <div className="login-brand-footer"><span className="brand-accent-line" />Built for the University community</div>
        </section>
        <section className="login-card">
          <div className="login-form-inner">
            <div className="eyebrow">DRIVER WORKSPACE</div>
            <h2>Welcome back</h2>
            <p className="login-subtitle">Sign in to manage your rides, deliveries and earnings.</p>
            <form onSubmit={submit} className="login-form">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" className="plain-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required autoComplete="username" />
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrap">
                <input id="login-password" className="plain-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
            </form>
            <p className="login-legal">Secure access for registered UniRide drivers.</p>
          </div>
        </section>
      </div>
      <footer className="login-footer">© 2026 Uni Ride · University Ride &amp; Delivery Platform</footer>
    </main>
  );
}
