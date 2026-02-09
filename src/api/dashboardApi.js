import api from './axiosConfig';
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getRecentInstallations = () => api.get('/dashboard/recent-installations');
export const getCertAlerts = () => api.get('/dashboard/cert-alerts');
export const getVersionAlerts = () => api.get('/dashboard/version-alerts');
