import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import api from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (localStorage.getItem("uniride_admin_token")) return <Navigate to="/admin" replace />;
  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("uniride_admin_token", data.token);
      localStorage.setItem("uniride_admin_user", JSON.stringify(data.user));
      navigate("/admin");
    } catch (err) { setError(err.response?.data?.message || "Unable to sign in. Check the API connection."); }
    finally { setLoading(false); }
  }
  return <div className="login-page">
    <section className="login-brand-panel">
      <div className="login-brand">
        <img src="/logo.PNG" alt="UniRide logo" onError={e => { e.currentTarget.style.display = "none"; }} />
        <div><strong>UniRide</strong><span>University Mobility & Delivery Platform</span></div>
      </div>
      <div className="login-hero">
        <span className="eyebrow">ADMIN CONTROL CENTER</span>
        <h1>Manage campus mobility with confidence.</h1>
        <p>A central workspace for student accounts, driver verification, rides, deliveries and service performance.</p>
        <div className="login-feature"><ShieldCheck size={19}/><span>Secure administration for the UniRide community</span></div>
      </div>
      <span className="login-brand-foot">University Mobility & Delivery Platform</span>
    </section>
    <section className="login-form-panel">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-mobile-brand"><img src="/logo.PNG" alt="UniRide logo" onError={e => { e.currentTarget.style.display = "none"; }}/><strong>UniRide</strong></div>
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Administrator sign in</h2>
        <p className="muted">Enter your administrator credentials to continue.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label htmlFor="email">EMAIL ADDRESS</label>
        <div className="input-with-icon"><Mail size={18}/><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@uniride.lk" required autoComplete="username"/></div>
        <label htmlFor="password">PASSWORD</label>
        <div className="input-with-icon"><LockKeyhole size={18}/><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password"/></div>
        <button className="btn btn-primary login-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in to dashboard"} <ArrowRight size={18}/></button>
        <p className="login-note">Restricted access. Only authorized administrators may sign in.</p>
      </form>
    </section>
  </div>;
}
