import { filesApi } from '../api/client';
import { categoryOf, formatBytes } from '../utils/fileType';
import { useEscapeToClose } from '../utils/useEscapeToClose';

export default function PreviewModal({ file, onClose }) {
  useEscapeToClose(onClose);
  const category = categoryOf(file.mime_type);
  const src = filesApi.contentUrl(file.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <h2 id="preview-modal-title" title={file.original_name}>{file.original_name}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close preview">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="preview-modal-body">
          {category === 'image' && <img src={src} alt={file.original_name} />}
          {category === 'video' && <video src={src} controls autoPlay={false} />}
          {category === 'document' && file.mime_type === 'application/pdf' && (
            <iframe src={src} title={file.original_name} />
          )}
          {(category === 'other' || (category === 'document' && file.mime_type !== 'application/pdf')) && (
            <div className="preview-fallback">
              <p>No preview available for this file type.</p>
            </div>
          )}
        </div>

        <div className="preview-modal-footer">
          <span>{formatBytes(file.size_bytes)}</span>
          <a className="secondary" href={src} target="_blank" rel="noreferrer" download={file.original_name}>
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
