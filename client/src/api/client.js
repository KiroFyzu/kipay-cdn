import axios from 'axios';

const client = axios.create({ baseURL: '/' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (email, password) => client.post('/api/auth/register', { email, password }),
  verifySetup: (setupToken, code) =>
    client.post('/api/auth/2fa/setup/verify', { setupToken, code }),
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  verifyLogin: (loginToken, code) =>
    client.post('/api/auth/2fa/login/verify', { loginToken, code }),
  enable2FAStart: () => client.post('/api/auth/2fa/enable/start'),
  enable2FAVerify: (code) => client.post('/api/auth/2fa/enable/verify', { code }),
  disable2FA: (currentPassword) => client.post('/api/auth/2fa/disable', { currentPassword }),
  me: () => client.get('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    client.patch('/api/auth/password', { currentPassword, newPassword }),
};

export const filesApi = {
  list: (folderId, filters = {}) =>
    client.get('/api/files', { params: { folderId, ...filters } }),
  listPublic: () => client.get('/api/files/public'),
  listStarred: () => client.get('/api/files/starred'),
  listRecent: () => client.get('/api/files/recent'),
  listTrash: () => client.get('/api/files/trash'),
  upload: (file, folderId, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    if (folderId) form.append('folderId', folderId);
    return client.post('/api/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  remove: (id) => client.delete(`/api/files/${id}`),
  restore: (id) => client.post(`/api/files/${id}/restore`),
  permanentDelete: (id) => client.delete(`/api/files/${id}/permanent`),
  setStarred: (id, starred) => client.patch(`/api/files/${id}/star`, { starred }),
  rename: (id, name) => client.patch(`/api/files/${id}/rename`, { name }),
  setVisibility: (id, isPublic, expiresAt) =>
    client.patch(`/api/files/${id}/visibility`, { isPublic, expiresAt: expiresAt || null }),
  contentUrl: (id) => {
    const token = localStorage.getItem('token');
    return `/api/files/${id}/content?token=${encodeURIComponent(token || '')}`;
  },
};

export const foldersApi = {
  list: (parentId) => client.get('/api/folders', { params: { parentId } }),
  create: (name, parentId) => client.post('/api/folders', { name, parentId }),
  rename: (id, name) => client.patch(`/api/folders/${id}`, { name }),
  remove: (id) => client.delete(`/api/folders/${id}`),
};

export const adminApi = {
  listUsers: () => client.get('/api/admin/users'),
  setQuota: (id, quotaBytes) => client.patch(`/api/admin/users/${id}/quota`, { quotaBytes }),
  deleteUser: (id) => client.delete(`/api/admin/users/${id}`),
  listAllFiles: () => client.get('/api/admin/files'),
  stats: () => client.get('/api/admin/stats'),
  listActivity: (limit, cursor) => client.get('/api/admin/activity', { params: { limit, cursor } }),
};

export const activityApi = {
  listMine: (limit, cursor) => client.get('/api/activity', { params: { limit, cursor } }),
};

export default client;
