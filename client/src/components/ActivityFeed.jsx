const ACTION_LABELS = {
  register: { label: 'Account registered', icon: 'fa-user-plus' },
  login: { label: 'Logged in', icon: 'fa-right-to-bracket' },
  upload: { label: 'Uploaded', icon: 'fa-upload' },
  rename: { label: 'Renamed', icon: 'fa-pen' },
  trash: { label: 'Moved to trash', icon: 'fa-trash' },
  restore: { label: 'Restored from trash', icon: 'fa-clock-rotate-left' },
  delete_permanent: { label: 'Permanently deleted', icon: 'fa-trash-can' },
  share_enable: { label: 'Shared publicly', icon: 'fa-link' },
  share_disable: { label: 'Unshared', icon: 'fa-link-slash' },
  password_change: { label: 'Changed password', icon: 'fa-key' },
  '2fa_enable': { label: 'Enabled 2FA', icon: 'fa-shield-halved' },
  '2fa_disable': { label: 'Disabled 2FA', icon: 'fa-shield-halved' },
};

export default function ActivityFeed({ entries, showUser = false }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-clock-rotate-left empty-state-icon" aria-hidden="true" />
        <p>No activity yet.</p>
      </div>
    );
  }

  return (
    <ul className="activity-feed">
      {entries.map((entry) => {
        const meta = ACTION_LABELS[entry.action] || { label: entry.action, icon: 'fa-circle-info' };
        return (
          <li key={entry.id} className="activity-item">
            <i className={`fa-solid ${meta.icon} activity-icon`} aria-hidden="true" />
            <div className="activity-body">
              <span>
                {showUser && entry.user_email && <strong>{entry.user_email}</strong>}{' '}
                {meta.label}
                {entry.target_name && <> — <span className="activity-target">{entry.target_name}</span></>}
              </span>
              <span className="activity-time">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
