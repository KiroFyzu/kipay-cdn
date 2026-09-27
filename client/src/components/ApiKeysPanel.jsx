import { useState, useEffect } from 'react';
import { apiKeysApi } from '../api/client';

export default function ApiKeysPanel() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await apiKeysApi.list();
      setKeys(data.apiKeys);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setCreating(true);
    try {
      const { data } = await apiKeysApi.create(name.trim());
      setNewKey(data.key);
      setName('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(key) {
    if (!confirm(`Revoke API key "${key.name}"? Apa pun yang masih memakainya akan langsung berhenti bekerja.`)) {
      return;
    }
    setError('');
    try {
      await apiKeysApi.remove(key.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke API key');
    }
  }

  function copyNewKey() {
    navigator.clipboard.writeText(newKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="card">
      <h2>API Keys</h2>
      <p className="page-subtitle">
        Pakai API key untuk akses endpoint <code>/api/*</code> dari script atau aplikasi lain tanpa
        perlu login interaktif — kirim sebagai header <code>Authorization: Bearer &lt;key&gt;</code>.
        Bisa buat banyak key, dan revoke satu-satu kalau bocor.
      </p>

      {newKey && (
        <div className="api-key-reveal">
          <p className="settings-label">Key baru dibuat — salin sekarang, tidak akan ditampilkan lagi:</p>
          <div className="share-link-row">
            <input readOnly value={newKey} onFocus={(e) => e.target.select()} />
            <button type="button" onClick={copyNewKey}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          <button type="button" className="secondary settings-action" onClick={() => setNewKey(null)}>
            Selesai
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="settings-form">
        <label>
          Nama key
          <input
            placeholder="cth. Upload Script"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={creating}>
          {creating ? 'Membuat…' : 'Buat API Key'}
        </button>
      </form>

      {!loading && keys.length > 0 && (
        <div className="table-scroll">
          <table className="file-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Key</th>
                <th>Dibuat</th>
                <th>Terakhir dipakai</th>
                <th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td><code>{k.key_prefix}…</code></td>
                  <td>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Belum pernah'}</td>
                  <td className="row-actions">
                    <button className="danger" onClick={() => handleRevoke(k)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && keys.length === 0 && <p>Belum ada API key.</p>}
    </section>
  );
}
