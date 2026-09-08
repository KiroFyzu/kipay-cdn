import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { formatBytes, iconClassFor } from '../utils/fileType';

const RETENTION_DAYS = 30;

function daysLeft(deletedAt) {
  const deletedTime = new Date(deletedAt).getTime();
  const purgeTime = deletedTime + RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((purgeTime - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export default function TrashPage() {
  const { refresh } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await filesApi.listTrash();
    setFiles(data.files);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRestore(file) {
    await filesApi.restore(file.id);
    await load();
  }

  async function handlePermanentDelete(file) {
    if (!confirm(`Permanently delete "${file.original_name}"? This cannot be undone.`)) return;
    await filesApi.permanentDelete(file.id);
    await load();
    await refresh();
  }

  return (
    <div className="page-with-toolbar">
      <h1><i className="fa-solid fa-trash" /> Trash</h1>
      <p className="page-subtitle">
        Files here are automatically deleted forever after {RETENTION_DAYS} days. They still count
        against your storage quota until then.
      </p>

      {loading && <p>Loading…</p>}
      {!loading && files.length === 0 && <p className="empty-state">Trash is empty.</p>}
      {!loading && files.length > 0 && (
        <table className="file-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Deleted</th>
              <th>Auto-delete in</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>
                  <i className={iconClassFor(file.mime_type)} /> {file.original_name}
                </td>
                <td>{formatBytes(file.size_bytes)}</td>
                <td>{new Date(file.deleted_at).toLocaleString()}</td>
                <td>{daysLeft(file.deleted_at)} day(s)</td>
                <td className="row-actions">
                  <button onClick={() => handleRestore(file)}>
                    <i className="fa-solid fa-clock-rotate-left" /> Restore
                  </button>
                  <button className="danger" onClick={() => handlePermanentDelete(file)}>
                    <i className="fa-solid fa-trash-can" /> Delete Forever
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
