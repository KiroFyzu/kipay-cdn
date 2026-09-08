import { useState, useEffect } from 'react';
import { authApi } from '../api/client';

export default function TwoFactorSetupModal({ onClose, onEnabled }) {
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null); // { qrCode, secret }
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authApi
      .enable2FAStart()
      .then(({ data }) => setSetup(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to start 2FA setup'))
      .finally(() => setLoading(false));
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await authApi.enable2FAVerify(code);
      onEnabled(data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-form-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Enable Two-Factor Authentication</h2>

        {loading && <p>Generating QR code…</p>}

        {!loading && setup && (
          <>
            <p className="page-subtitle">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the
              6-digit code to confirm.
            </p>
            <img src={setup.qrCode} alt="2FA QR code" className="totp-qr" />
            <p className="settings-label">Can't scan? Enter this key manually:</p>
            <code className="totp-secret">{setup.secret}</code>
            <form onSubmit={handleVerify}>
              <input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                autoFocus
              />
              {error && <p className="error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'Verifying…' : 'Verify & Enable'}
                </button>
              </div>
            </form>
          </>
        )}

        {!loading && !setup && (
          <>
            {error && <p className="error">{error}</p>}
            <button className="secondary" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}
