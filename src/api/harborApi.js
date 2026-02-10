import api from './axiosConfig';

export const manualSync = () => api.post('/harbor/sync');
export const getSyncLogs = (params) => api.get('/harbor/sync-logs', { params });
