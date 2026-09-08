import { useState, useEffect } from 'react';
import { authApi, activityApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import TwoFactorSetupModal from '../components/TwoFactorSetupModal.jsx';
import DisableTwoFactorModal from '../components/DisableTwoFactorModal.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    activityApi.listMine(20).then(({ data }) => setActivity(data.entries));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  const usagePercent = user
    ? Math.min(100, Math.round((user.storage_used_bytes / user.storage_quota_bytes) * 100))
    : 0;

  return (
    <div className="settings-page">
      <h1>Account Settings</h1>

      <section className="card">
        <h2>Profile</h2>
        <div className="settings-profile-grid">
          <div>
            <p className="settings-label">Email</p>
            <p>{user?.email}</p>
          </div>
          <div>
            <p className="settings-label">Role</p>
            <p className={`role-badge role-${user?.role}`}>{user?.role}</p>
          </div>
          <div>
            <p className="settings-label">Storage used</p>
            <p>
              {formatBytes(user?.storage_used_bytes || 0)} / {formatBytes(user?.storage_quota_bytes || 0)}
            </p>
            <div className="quota-bar">
              <div className="quota-bar-fill" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
          <div>
            <p className="settings-label">Member since</p>
            <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
          </div>
          <div>
            <p className="settings-label">Two-Factor Authentication</p>
            <p className={`status-badge ${user?.totp_enabled ? 'status-on' : 'status-off'}`}>
              {user?.totp_enabled ? 'Aktif' : 'Tidak Aktif'}
            </p>
            {!user?.totp_enabled && (
              <button className="primary" style={{ marginTop: 8 }} onClick={() => setShow2FASetup(true)}>
                <i className="fa-solid fa-shield-halved" /> Aktifkan 2FA
              </button>
            )}
            {user?.totp_enabled && (
              <button className="danger" style={{ marginTop: 8 }} onClick={() => setShow2FADisable(true)}>
                Nonaktifkan 2FA
              </button>
            )}
          </div>
        </div>
      </section>

      {show2FASetup && (
        <TwoFactorSetupModal
          onClose={() => setShow2FASetup(false)}
          onEnabled={() => refresh()}
        />
      )}
      {show2FADisable && (
        <DisableTwoFactorModal
          onClose={() => setShow2FADisable(false)}
          onDisabled={() => refresh()}
        />
      )}

      <section className="card">
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit} className="settings-form">
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Recent Activity</h2>
        <ActivityFeed entries={activity} />
      </section>
    </div>
  );
}
