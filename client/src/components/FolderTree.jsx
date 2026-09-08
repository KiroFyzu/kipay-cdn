export default function FolderTree({ folders, currentFolderId, onNavigate, onRename, onDelete }) {
  return (
    <ul className="folder-list">
      {folders.map((folder) => (
        <li key={folder.id} className={folder.id === currentFolderId ? 'active' : ''}>
          <button className="link-button" onClick={() => onNavigate(folder.id)}>
            <i className="fa-solid fa-folder" /> {folder.name}
          </button>
          <span className="folder-item-actions">
            <button className="icon-button" title="Rename folder" onClick={() => onRename(folder)}>
              <i className="fa-solid fa-pen" />
            </button>
            <button className="icon-button" title="Delete folder" onClick={() => onDelete(folder.id)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
