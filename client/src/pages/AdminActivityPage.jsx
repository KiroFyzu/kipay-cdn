import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import ActivityFeed from '../components/ActivityFeed.jsx';

export default function AdminActivityPage() {
  const [entries, setEntries] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 50;

  async function loadPage(nextCursor) {
    setLoading(true);
    const { data } = await adminApi.listActivity(PAGE_SIZE, nextCursor);
    setEntries((prev) => (nextCursor === 0 ? data.entries : [...prev, ...data.entries]));
    setHasMore(data.entries.length === PAGE_SIZE);
    setCursor(nextCursor + data.entries.length);
    setLoading(false);
  }

  useEffect(() => {
    loadPage(0);
  }, []);

  return (
    <div className="admin-page">
      <h1><i className="fa-solid fa-clipboard-list" /> Activity Log</h1>
      <p className="page-subtitle">Audit trail of uploads, deletes, shares, logins, and account changes across all users.</p>

      <section className="card">
        <ActivityFeed entries={entries} showUser />
        {hasMore && (
          <button className="secondary" style={{ marginTop: 12 }} onClick={() => loadPage(cursor)} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </section>
    </div>
  );
}
