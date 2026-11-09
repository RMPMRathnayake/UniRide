import { useState } from 'react';
import { Eye, EyeOff } from '../components/Icon';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { loginDriver } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await loginDriver(email, password); navigate('/driver', { replace: true }); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <main className="login-screen">
      <nav className="login-nav"><Link to="/" className="brand-name"><img src="/logo.PNG" alt=""/><strong>UniRide</strong></Link><span>DRIVER PORTAL</span></nav>
      <div className="login-content">
        <div className="login-intro"><div className="eyebrow">UNIRIDE DRIVER PORTAL</div><h1>Your work.<br />Your road.</h1><p>Sign in to manage rides, product deliveries and earnings.</p></div>
        <section className="login-card">
          <div className="eyebrow">WELCOME BACK</div><h2>Sign in</h2><p className="login-subtitle">Enter your driver account details.</p>
          <form onSubmit={submit} className="login-form">
            <label htmlFor="login-email">Email address</label><input id="login-email" className="plain-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required autoComplete="username" />
            <label htmlFor="login-password">Password</label><div className="password-input-wrap"><input id="login-password" className="plain-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="button button-primary login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
          </form>
          <div className="auth-links"><Link to="/register/driver">Register as a driver</Link><Link to="/forgot-password" state={{ role: 'driver' }}>Forgot password?</Link></div>
        </section>
      </div>
      <footer className="login-footer">© 2026 UniRide Driver Portal</footer>
    </main>
  );
}
