import { useState } from 'react';
import { authApi } from '../api/client';
import { useEscapeToClose } from '../utils/useEscapeToClose';

export default function DisableTwoFactorModal({ onClose, onDisabled }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEscapeToClose(onClose, !submitting);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await authApi.disable2FA(password);
      onDisabled(data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={submitting ? undefined : onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="totp-disable-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="totp-disable-title">Disable Two-Factor Authentication</h2>
        <p>Enter your current password to confirm disabling 2FA on this account.</p>
        <form onSubmit={handleSubmit} className="settings-form">
          <input
            type="password"
            placeholder="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="danger" disabled={submitting}>
              {submitting ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
