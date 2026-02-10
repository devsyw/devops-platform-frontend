import api from './axiosConfig';
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getRecentBuilds = () => api.get('/dashboard/recent-builds');
export const getExpiringCerts = (days) => api.get('/certificates/expiring', { params: { days: days || 30 } });
