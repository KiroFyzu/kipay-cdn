import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await adminApi.listUsers();
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleQuotaChange(userRow, gbValue) {
    setError('');
    const quotaBytes = Math.round(Number(gbValue) * 1024 * 1024 * 1024);
    if (!Number.isFinite(quotaBytes) || quotaBytes < 0) return;
    try {
      await adminApi.setQuota(userRow.id, quotaBytes);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update quota');
    }
  }

  async function handleDelete(userRow) {
    if (!confirm(`Delete user ${userRow.email} and all their files?`)) return;
    await adminApi.deleteUser(userRow.id);
    await load();
  }

  return (
    <div className="admin-page">
      <h1>Admin — Users</h1>
      {error && <p className="error">{error}</p>}
      <table className="file-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Usage</th>
            <th>Quota (GB)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{formatBytes(u.storage_used_bytes)}</td>
              <td>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={(u.storage_quota_bytes / (1024 * 1024 * 1024)).toFixed(2)}
                  onBlur={(e) => handleQuotaChange(u, e.target.value)}
                />
              </td>
              <td className="row-actions">
                <button className="danger" onClick={() => handleDelete(u)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
