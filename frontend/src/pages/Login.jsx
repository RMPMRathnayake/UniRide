import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';

export default function Login() {
  const { loginRider, registerRider } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') await loginRider(form.email, form.password);
      else await registerRider(form);
      navigate('/rider', { replace: true });
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  };
  const change = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  return <div className="login-page">
    <header className="login-nav"><Link to="/" className="brand-name"><img src="/logo.PNG" alt=""/><strong>UniRide</strong></Link><span>STUDENT PORTAL</span></header>
    <main className="login-content"><section className="login-intro"><div className="eyebrow">YOUR EVERYDAY TRAVEL & DELIVERY APP</div><h1>One place for<br/><span>every journey.</span></h1><p>Book a ride, order the things you need, and get great food delivered right to your door.</p><div className="login-benefits"><span>Easy ride booking</span><span>Product and food delivery</span><span>One place to track everything</span></div></section>
      <section className="login-card"><div className="login-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="login-subtitle">{mode === 'login' ? 'Sign in to continue to your UniRide dashboard.' : 'A few details and you are ready to go.'}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="login-form" onSubmit={submit}>
          {mode === 'register' && <><label>Full name<input required className="plain-input" value={form.name} onChange={change('name')} placeholder="Your name"/></label><label>Phone number<input className="plain-input" value={form.phone} onChange={change('phone')} placeholder="+94 77 000 0000"/></label></>}
          <label>Email address<input required type="email" className="plain-input" value={form.email} onChange={change('email')} placeholder="Enter your email address"/></label>
          <label>Password<input required type="password" minLength={6} className="plain-input" value={form.password} onChange={change('password')} placeholder="Enter your password"/></label>
          <Button type="submit" className="login-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in to UniRide' : 'Create account'} </Button>
        </form>
        {mode === 'login' && <div className="auth-links"><Link to="/forgot-password" state={{ role: 'rider' }}>Forgot password?</Link><Link to="/register/student">Student registration</Link></div>}
      </section>
    </main><footer className="login-footer">UniRide Rider · Ride booking and on-demand delivery</footer>
  </div>;
}
