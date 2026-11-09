import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import { PageHeader } from '../components/UI';

export default function Settings() {
  const { driver, updateDriver } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => { setForm({ name: driver?.name || '', email: driver?.email || '', phone: driver?.phone || '' }); }, [driver]);
  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changePasswordForm = (event) => setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault(); setProfileLoading(true); setProfileMessage({ type: '', text: '' });
    try {
      const { data } = await api.patch('/driver/profile', form);
      updateDriver(data.driver);
      setProfileMessage({ type: 'success', text: data.message });
    } catch (error) { setProfileMessage({ type: 'error', text: getErrorMessage(error) }); }
    finally { setProfileLoading(false); }
  };

  const savePassword = async (event) => {
    event.preventDefault(); setPasswordMessage({ type: '', text: '' });
    if (passwords.newPassword.length < 8) { setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
    setPasswordLoading(true);
    try {
      const { data } = await api.patch('/driver/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswordMessage({ type: 'success', text: data.message });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { setPasswordMessage({ type: 'error', text: getErrorMessage(error) }); }
    finally { setPasswordLoading(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="ACCOUNT" title="Settings" description="Update your personal details and password." />
      <div className="settings-layout">
        <section className="content-card settings-card">
          <div className="card-heading"><div><div className="eyebrow">PERSONAL DETAILS</div><h2>Contact information</h2><p>Keep the contact details on your driver account up to date.</p></div></div>
          <form onSubmit={saveProfile} className="settings-form">
            <div className="form-field"><label htmlFor="name">Full name</label><input className="plain-input" id="name" name="name" value={form.name} onChange={changeForm} required maxLength={80} /></div>
            <div className="form-field"><label htmlFor="email">Email address</label><input className="plain-input" id="email" type="email" name="email" value={form.email} onChange={changeForm} required /></div>
            <div className="form-field"><label htmlFor="phone">Phone number</label><input className="plain-input" id="phone" name="phone" value={form.phone} onChange={changeForm} required maxLength={24} /></div>
            {profileMessage.text && <div className={`alert alert-${profileMessage.type}`}>{profileMessage.text}</div>}
            <div className="form-actions"><span>Updates are saved to your driver profile.</span><button type="submit" className="button button-primary" disabled={profileLoading}>{profileLoading ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </section>
        <section className="content-card settings-card">
          <div className="card-heading"><div><div className="eyebrow">ACCOUNT SECURITY</div><h2>Change password</h2><p>Use a password that is at least eight characters long.</p></div></div>
          <form onSubmit={savePassword} className="settings-form">
            <div className="form-field"><label htmlFor="currentPassword">Current password</label><input className="plain-input" id="currentPassword" type="password" name="currentPassword" value={passwords.currentPassword} onChange={changePasswordForm} required autoComplete="current-password" /></div>
            <div className="form-two-columns"><div className="form-field"><label htmlFor="newPassword">New password</label><input className="plain-input" id="newPassword" type="password" name="newPassword" value={passwords.newPassword} onChange={changePasswordForm} required minLength={8} autoComplete="new-password" /></div><div className="form-field"><label htmlFor="confirmPassword">Confirm new password</label><input className="plain-input" id="confirmPassword" type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={changePasswordForm} required minLength={8} autoComplete="new-password" /></div></div>
            {passwordMessage.text && <div className={`alert alert-${passwordMessage.type}`}>{passwordMessage.text}</div>}
            <div className="form-actions"><span>Your password is securely hashed before storage.</span><button type="submit" className="button button-primary" disabled={passwordLoading}>{passwordLoading ? 'Updating…' : 'Update password'}</button></div>
          </form>
        </section>
      </div>
    </div>
  );
}
