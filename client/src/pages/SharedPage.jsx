import { useEffect, useState } from 'react';
import { filesApi } from '../api/client';
import ShareLinkModal from '../components/ShareLinkModal.jsx';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function SharedPage() {
  const [files, setFiles] = useState([]);
  const [shareFile, setShareFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    filesApi
      .listPublic()
      .then(({ data }) => setFiles(data.files))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="shared-page">
      <h1>Public Links</h1>
      <p className="page-subtitle">Files you've made publicly accessible via a direct CDN link.</p>

      {loading && <p>Loading…</p>}
      {!loading && files.length === 0 && (
        <p className="empty-state">You haven't shared any files publicly yet.</p>
      )}
      {!loading && files.length > 0 && (
        <table className="file-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Shared on</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td>{f.original_name}</td>
                <td>{formatBytes(f.size_bytes)}</td>
                <td>{new Date(f.created_at).toLocaleString()}</td>
                <td className="row-actions">
                  <button className="link-button" onClick={() => setShareFile(f)}>
                    View link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {shareFile && <ShareLinkModal file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}
