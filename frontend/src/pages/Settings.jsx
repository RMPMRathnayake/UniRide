import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { Button, CardHeading, Field, PageHeader } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { rider, updateRider } = useAuth();
  const [profile, setProfile] = useState({ name: rider?.name || '', email: rider?.email || '', phone: rider?.phone || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  useEffect(() => { setProfile({ name: rider?.name || '', email: rider?.email || '', phone: rider?.phone || '' }); }, [rider]);
  const changeProfile = (key) => (event) => setProfile((prev) => ({ ...prev, [key]: event.target.value }));
  const changePassword = (key) => (event) => setPassword((prev) => ({ ...prev, [key]: event.target.value }));
  const saveProfile = async (event) => {
    event.preventDefault(); setProfileError(''); setProfileMessage(''); setSavingProfile(true);
    try {
      const { data } = await api.patch('/rider/profile', profile);
      updateRider(data.rider);
      setProfileMessage(data.message);
    } catch (err) { setProfileError(getErrorMessage(err)); }
    finally { setSavingProfile(false); }
  };
  const savePassword = async (event) => {
    event.preventDefault(); setPasswordError(''); setPasswordMessage('');
    if (password.newPassword !== password.confirmPassword) { setPasswordError('The new passwords do not match.'); return; }
    if (password.newPassword.length < 6) { setPasswordError('New password must contain at least 6 characters.'); return; }
    setSavingPassword(true);
    try {
      const { data } = await api.patch('/rider/password', { currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPasswordMessage(data.message); setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPasswordError(getErrorMessage(err)); }
    finally { setSavingPassword(false); }
  };
  return <>
    <PageHeader title="Settings" subtitle="Update your personal details and keep your account secure."/>
    <div className="settings-layout rider-settings-layout"><section className="content-card settings-card"><CardHeading title="Personal details" subtitle="Change the name, email and phone number on your account."/>
      {profileMessage && <div className="alert alert-success">{profileMessage}</div>}{profileError && <div className="alert alert-error">{profileError}</div>}
      <form className="settings-form" onSubmit={saveProfile}><Field label="Full name"><input className="plain-input" required value={profile.name} onChange={changeProfile('name')} placeholder="Your name"/></Field><Field label="Email address"><input className="plain-input" required type="email" value={profile.email} onChange={changeProfile('email')} placeholder="you@example.com"/></Field><Field label="Phone number"><input className="plain-input" value={profile.phone} onChange={changeProfile('phone')} placeholder="+94 77 000 0000"/></Field><div className="form-actions"><Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</Button></div></form>
    </section><section className="content-card settings-card"><CardHeading title="Change password" subtitle="Use a strong password that you do not use elsewhere."/>
      {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}{passwordError && <div className="alert alert-error">{passwordError}</div>}
      <form className="settings-form" onSubmit={savePassword}><Field label="Current password"><input className="plain-input" required type="password" value={password.currentPassword} onChange={changePassword('currentPassword')} autoComplete="current-password"/></Field><Field label="New password" hint="At least 6 characters."><input className="plain-input" required minLength={6} type="password" value={password.newPassword} onChange={changePassword('newPassword')} autoComplete="new-password"/></Field><Field label="Confirm new password"><input className="plain-input" required minLength={6} type="password" value={password.confirmPassword} onChange={changePassword('confirmPassword')} autoComplete="new-password"/></Field><div className="form-actions"><Button type="submit" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update password'}</Button></div></form>
    </section></div>
    <div className="settings-security-note"><p>Your account details are stored securely. Passwords are hashed before saving, and all private account endpoints require your sign-in token.</p></div>
  </>;
}
