import api from './axiosConfig';

export const getCertificates = (params) => api.get('/certificates', { params });
export const getCertificate = (id) => api.get('/certificates/' + id);
export const getExpiringCerts = (days) => api.get('/certificates/expiring', { params: { days } });
export const createCertificate = (data) => api.post('/certificates', data);
export const updateCertificate = (id, data) => api.put('/certificates/' + id, data);
export const renewCertificate = (id, data) => api.post('/certificates/' + id + '/renew', data);
export const deleteCertificate = (id) => api.delete('/certificates/' + id);
