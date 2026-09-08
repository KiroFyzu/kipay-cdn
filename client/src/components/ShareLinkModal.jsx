import { useState } from 'react';
import { filesApi } from '../api/client';

export default function ShareLinkModal({ file, onClose, onUpdated }) {
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState(
    file.expires_at ? new Date(file.expires_at).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const link = `${window.location.origin}/cdn/${file.public_token}`;

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleSaveExpiry(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isoExpiry = expiresAt ? new Date(expiresAt).toISOString() : null;
      const { data } = await filesApi.setVisibility(file.id, true, isoExpiry);
      onUpdated?.(data.file);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update expiry');
    } finally {
      setSaving(false);
    }
  }

  const isExpired = file.expires_at && new Date(file.expires_at).getTime() <= Date.now();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Share "{file.original_name}"</h2>
        <p>Anyone with this link can view/download the file — no login required.</p>
        <div className="share-link-row">
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>

        {isExpired && <p className="error">This link has expired.</p>}

        <form onSubmit={handleSaveExpiry} className="settings-form">
          <label>
            Link expiry (optional)
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            {expiresAt && (
              <button type="button" className="secondary" onClick={() => setExpiresAt('')}>
                Clear expiry
              </button>
            )}
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save expiry'}
            </button>
          </div>
        </form>

        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
