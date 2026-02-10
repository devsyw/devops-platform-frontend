import api from './axiosConfig';

export const getProjects = (customerId) => api.get('/customers/' + customerId + '/projects');
export const getProject = (customerId, id) => api.get('/customers/' + customerId + '/projects/' + id);
export const createProject = (customerId, data) => api.post('/customers/' + customerId + '/projects', data);
export const updateProject = (customerId, id, data) => api.put('/customers/' + customerId + '/projects/' + id, data);
export const deleteProject = (customerId, id) => api.delete('/customers/' + customerId + '/projects/' + id);
