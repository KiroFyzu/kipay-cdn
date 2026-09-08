import { useState } from 'react';

export default function RenameModal({ initialName, title, onClose, onSubmit }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Rename failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={submitting ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit} className="settings-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onFocus={(e) => e.target.select()}
            required
          />
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
