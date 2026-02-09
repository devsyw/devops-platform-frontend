import api from './axiosConfig';
export const getAddons = (category) => api.get('/addons', { params: { category } });
export const getAddon = (id) => api.get('/addons/' + id);
export const getAddonVersions = (id) => api.get('/addons/' + id + '/versions');
