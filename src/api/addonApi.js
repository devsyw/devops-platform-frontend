import api from './axiosConfig';

// Addon CRUD
export const getAddons = (category) => api.get('/addons', { params: { category } });
export const getAllAddons = () => api.get('/addons', { params: { includeInactive: true } });
export const getAddon = (id) => api.get('/addons/' + id);
export const createAddon = (data) => api.post('/addons', data);
export const updateAddon = (id, data) => api.put('/addons/' + id, data);
export const deleteAddon = (id) => api.delete('/addons/' + id);
export const activateAddon = (id) => api.patch('/addons/' + id + '/activate');

// Version
export const getAddonVersions = (addonId) => api.get('/addons/' + addonId + '/versions');
export const addAddonVersion = (addonId, data) => api.post('/addons/' + addonId + '/versions', data);
export const deleteAddonVersion = (versionId) => api.delete('/addons/versions/' + versionId);
