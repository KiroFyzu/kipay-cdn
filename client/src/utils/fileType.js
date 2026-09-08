export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function categoryOf(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/msword' ||
    mimeType.startsWith('application/vnd.openxmlformats') ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return 'document';
  }
  return 'other';
}

export function iconClassFor(mimeType) {
  switch (categoryOf(mimeType)) {
    case 'image':
      return 'fa-solid fa-image';
    case 'video':
      return 'fa-solid fa-film';
    case 'document':
      return 'fa-solid fa-file-lines';
    default:
      return 'fa-solid fa-box-archive';
  }
}

export function canPreview(mimeType = '') {
  return (
    mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType === 'application/pdf'
  );
}
