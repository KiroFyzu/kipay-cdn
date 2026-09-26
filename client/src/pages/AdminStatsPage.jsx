import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { formatBytes } from '../utils/fileType';

const TYPE_COLORS = {
  image: 'var(--chart-image)',
  video: 'var(--chart-video)',
  document: 'var(--chart-document)',
  other: 'var(--chart-other)',
};

const TYPE_LABELS = {
  image: 'Images',
  video: 'Videos',
  document: 'Documents',
  other: 'Other',
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .stats()
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load stats'));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) {
    return (
      <div className="admin-page">
        <div className="stat-tiles">
          <div className="skeleton skeleton-tile" />
          <div className="skeleton skeleton-tile" />
          <div className="skeleton skeleton-tile" />
        </div>
      </div>
    );
  }

  const usagePercent = stats.totalStorageQuota
    ? Math.min(100, Math.round((stats.totalStorageUsed / stats.totalStorageQuota) * 100))
    : 0;

  const maxUserUsage = Math.max(1, ...stats.usersByUsage.map((u) => u.usedBytes));
  const totalFilesForTypes = Object.values(stats.filesByType).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="admin-page">
      <h1><i className="fa-solid fa-chart-pie" aria-hidden="true" /> Storage Statistics</h1>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.totalUsers}</span>
          <span className="stat-tile-label">Total Users</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.totalFiles}</span>
          <span className="stat-tile-label">Total Files</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{formatBytes(stats.totalStorageUsed)}</span>
          <span className="stat-tile-label">Storage Used ({usagePercent}% of {formatBytes(stats.totalStorageQuota)})</span>
        </div>
      </div>

      <section className="card">
        <h2>Top Users by Storage Usage</h2>
        {stats.usersByUsage.length === 0 && <p className="empty-state">No usage data yet.</p>}
        <div className="bar-chart">
          {stats.usersByUsage.map((u) => (
            <div className="bar-chart-row" key={u.id}>
              <span className="bar-chart-label" title={u.email}>{u.email}</span>
              <div className="bar-chart-track">
                <div
                  className="bar-chart-fill"
                  style={{ width: `${Math.max(2, (u.usedBytes / maxUserUsage) * 100)}%` }}
                />
              </div>
              <span className="bar-chart-value">{formatBytes(u.usedBytes)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Files by Type</h2>
        {Object.keys(stats.filesByType).length === 0 && <p className="empty-state">No files yet.</p>}
        <div className="type-breakdown-bar">
          {Object.entries(stats.filesByType).map(([type, count]) => (
            <div
              key={type}
              className="type-breakdown-segment"
              style={{ width: `${(count / totalFilesForTypes) * 100}%`, background: TYPE_COLORS[type] || TYPE_COLORS.other }}
              title={`${TYPE_LABELS[type] || type}: ${count}`}
            />
          ))}
        </div>
        <div className="type-breakdown-legend">
          {Object.entries(stats.filesByType).map(([type, count]) => (
            <span className="type-breakdown-legend-item" key={type}>
              <span className="legend-dot" style={{ background: TYPE_COLORS[type] || TYPE_COLORS.other }} />
              {TYPE_LABELS[type] || type} ({count})
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
