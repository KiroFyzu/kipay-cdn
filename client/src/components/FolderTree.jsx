export default function FolderTree({ folders, currentFolderId, onNavigate, onRename, onDelete }) {
  return (
    <ul className="folder-list">
      {folders.map((folder) => (
        <li key={folder.id} className={folder.id === currentFolderId ? 'active' : ''}>
          <button className="link-button" onClick={() => onNavigate(folder.id)}>
            <i className="fa-solid fa-folder" aria-hidden="true" /> {folder.name}
          </button>
          <span className="folder-item-actions">
            <button className="icon-button" title="Rename folder" aria-label={`Rename folder ${folder.name}`} onClick={() => onRename(folder)}>
              <i className="fa-solid fa-pen" aria-hidden="true" />
            </button>
            <button className="icon-button" title="Delete folder" aria-label={`Delete folder ${folder.name}`} onClick={() => onDelete(folder.id)}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
