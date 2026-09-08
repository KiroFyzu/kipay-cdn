import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../api/client';
import FileList from '../components/FileList.jsx';
import FileGrid from '../components/FileGrid.jsx';
import ShareLinkModal from '../components/ShareLinkModal.jsx';
import PreviewModal from '../components/PreviewModal.jsx';
import RenameModal from '../components/RenameModal.jsx';

export default function RecentPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('driveView') || 'list');
  const [shareFile, setShareFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);

  const load = useCallback(async () => {
    const { data } = await filesApi.listRecent();
    setFiles(data.files);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleDelete(file) {
    if (!confirm(`Move "${file.original_name}" to Trash?`)) return;
    await filesApi.remove(file.id);
    await load();
  }

  async function handleToggleVisibility(file, isPublic) {
    const { data } = await filesApi.setVisibility(file.id, isPublic, null);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
    if (isPublic) setShareFile(data.file);
  }

  async function handleToggleStar(file, starred) {
    const { data } = await filesApi.setStarred(file.id, starred);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
  }

  async function handleRename(file, name) {
    const { data } = await filesApi.rename(file.id, name);
    setFiles((prev) => prev.map((f) => (f.id === file.id ? data.file : f)));
  }

  const Component = view === 'grid' ? FileGrid : FileList;

  return (
    <div className="page-with-toolbar">
      <div className="page-header-row">
        <h1><i className="fa-solid fa-clock-rotate-left" /> Recent</h1>
        <div className="toolbar-view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <i className="fa-solid fa-list" />
          </button>
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
            <i className="fa-solid fa-table-cells-large" />
          </button>
        </div>
      </div>
      <p className="page-subtitle">Your most recently uploaded or viewed files, across all folders.</p>

      {loading && <p>Loading…</p>}
      {!loading && (
        <Component
          files={files}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          onShare={setShareFile}
          onRename={setRenameFile}
          onPreview={setPreviewFile}
          onToggleStar={handleToggleStar}
        />
      )}

      {shareFile && (
        <ShareLinkModal
          file={shareFile}
          onClose={() => setShareFile(null)}
          onUpdated={(f) => {
            setFiles((prev) => prev.map((x) => (x.id === f.id ? f : x)));
            setShareFile(f);
          }}
        />
      )}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {renameFile && (
        <RenameModal
          title="Rename file"
          initialName={renameFile.original_name}
          onClose={() => setRenameFile(null)}
          onSubmit={(name) => handleRename(renameFile, name)}
        />
      )}
    </div>
  );
}
