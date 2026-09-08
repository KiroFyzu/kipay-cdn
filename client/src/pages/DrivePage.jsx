import { useState, useEffect, useCallback, useRef } from 'react';
import { filesApi, foldersApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { formatBytes } from '../utils/fileType';
import FileList from '../components/FileList.jsx';
import FileGrid from '../components/FileGrid.jsx';
import FolderTree from '../components/FolderTree.jsx';
import Toolbar from '../components/Toolbar.jsx';
import ShareLinkModal from '../components/ShareLinkModal.jsx';
import PreviewModal from '../components/PreviewModal.jsx';
import RenameModal from '../components/RenameModal.jsx';
import UploadQueue from '../components/UploadQueue.jsx';

let uploadIdCounter = 0;

export default function DrivePage() {
  const { user, refresh } = useAuth();
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [view, setView] = useState(() => localStorage.getItem('driveView') || 'list');

  const [shareFile, setShareFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null); // { kind: 'file'|'folder', item }

  const [uploads, setUploads] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    localStorage.setItem('driveView', view);
  }, [view]);

  const load = useCallback(async () => {
    const [foldersRes, filesRes] = await Promise.all([
      foldersApi.list(folderId),
      filesApi.list(folderId, { search: debouncedSearch, type, sortBy, sortOrder }),
    ]);
    setFolders(foldersRes.data.folders);
    setFiles(filesRes.data.files);
  }, [folderId, debouncedSearch, type, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeleteFile(file) {
    if (!confirm(`Move "${file.original_name}" to Trash?`)) return;
    await filesApi.remove(file.id);
    await load();
    await refresh();
  }

  async function handleToggleStar(file, starred) {
    const { data } = await filesApi.setStarred(file.id, starred);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
  }

  async function handleToggleVisibility(file, isPublic) {
    const { data } = await filesApi.setVisibility(file.id, isPublic, null);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
    if (isPublic) setShareFile(data.file);
  }

  function handleShareUpdated(updatedFile) {
    setFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)));
    setShareFile(updatedFile);
  }

  async function handleRenameFile(file, name) {
    const { data } = await filesApi.rename(file.id, name);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
  }

  async function handleRenameFolder(folder, name) {
    await foldersApi.rename(folder.id, name);
    await load();
  }

  async function handleCreateFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await foldersApi.create(newFolderName.trim(), folderId);
    setNewFolderName('');
    await load();
  }

  async function handleDeleteFolder(id) {
    if (!confirm('Delete this folder? (files inside are moved to root)')) return;
    await foldersApi.remove(id);
    await load();
  }

  function enqueueFiles(fileList) {
    const list = Array.from(fileList || []);
    if (list.length === 0) return;

    const entries = list.map((file) => ({
      id: ++uploadIdCounter,
      file,
      name: file.name,
      progress: 0,
      status: 'uploading',
      error: null,
    }));
    setUploads((prev) => [...prev, ...entries]);

    entries.forEach((entry) => {
      filesApi
        .upload(entry.file, folderId, (evt) => {
          if (!evt.total) return;
          const progress = Math.round((evt.loaded / evt.total) * 100);
          setUploads((prev) => prev.map((u) => (u.id === entry.id ? { ...u, progress } : u)));
        })
        .then(async () => {
          setUploads((prev) => prev.map((u) => (u.id === entry.id ? { ...u, status: 'done', progress: 100 } : u)));
          await load();
          await refresh();
        })
        .catch((err) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === entry.id
                ? { ...u, status: 'error', error: err.response?.data?.error || 'Upload failed' }
                : u
            )
          );
        });
    });
  }

  function handleFileInputChange(e) {
    enqueueFiles(e.target.files);
    e.target.value = '';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    enqueueFiles(e.dataTransfer.files);
  }

  const usagePercent = user
    ? Math.min(100, Math.round((user.storage_used_bytes / user.storage_quota_bytes) * 100))
    : 0;

  return (
    <div
      className="drive-page"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="drop-overlay">
          <div className="drop-overlay-message">Drop files to upload</div>
        </div>
      )}

      <aside className="drive-panel">
        <button className="primary" onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-upload" /> Upload file(s)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileInputChange}
        />
        <form onSubmit={handleCreateFolder} className="new-folder-form">
          <input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
        <div className="quota-box">
          <p>
            {formatBytes(user?.storage_used_bytes || 0)} / {formatBytes(user?.storage_quota_bytes || 0)}
          </p>
          <div className="quota-bar">
            <div className="quota-bar-fill" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
        <h3>Folders</h3>
        {folderId && (
          <button className="link-button" onClick={() => setFolderId(null)}>
            <i className="fa-solid fa-arrow-left" /> Back to root
          </button>
        )}
        <FolderTree
          folders={folders}
          currentFolderId={folderId}
          onNavigate={setFolderId}
          onRename={(folder) => setRenameTarget({ kind: 'folder', item: folder })}
          onDelete={handleDeleteFolder}
        />
      </aside>
      <section className="content">
        <h1>My Drive{folderId ? ' / (folder)' : ''}</h1>
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          type={type}
          onTypeChange={setType}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          view={view}
          onViewChange={setView}
        />
        {view === 'list' ? (
          <FileList
            files={files}
            onDelete={handleDeleteFile}
            onToggleVisibility={handleToggleVisibility}
            onShare={setShareFile}
            onRename={(file) => setRenameTarget({ kind: 'file', item: file })}
            onPreview={setPreviewFile}
            onToggleStar={handleToggleStar}
          />
        ) : (
          <FileGrid
            files={files}
            onDelete={handleDeleteFile}
            onToggleVisibility={handleToggleVisibility}
            onShare={setShareFile}
            onRename={(file) => setRenameTarget({ kind: 'file', item: file })}
            onPreview={setPreviewFile}
            onToggleStar={handleToggleStar}
          />
        )}
      </section>

      {shareFile && (
        <ShareLinkModal file={shareFile} onClose={() => setShareFile(null)} onUpdated={handleShareUpdated} />
      )}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {renameTarget && (
        <RenameModal
          title={renameTarget.kind === 'file' ? 'Rename file' : 'Rename folder'}
          initialName={renameTarget.kind === 'file' ? renameTarget.item.original_name : renameTarget.item.name}
          onClose={() => setRenameTarget(null)}
          onSubmit={(name) =>
            renameTarget.kind === 'file'
              ? handleRenameFile(renameTarget.item, name)
              : handleRenameFolder(renameTarget.item, name)
          }
        />
      )}
      <UploadQueue uploads={uploads} onDismiss={() => setUploads([])} />
    </div>
  );
}
