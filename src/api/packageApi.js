import api from './axiosConfig';

export const startBuild = (data) => api.post('/packages/build', data);
export const getBuilds = (params) => api.get('/packages', { params });
export const getBuild = (id) => api.get('/packages/' + id);
export const getBuildByHash = (hash) => api.get('/packages/hash/' + hash);
export const getBuildStatus = (hash) => api.get('/packages/hash/' + hash + '/status');

// 다운로드는 blob으로 받아야 함
export const downloadPackage = (hash) =>
  api.get('/packages/download/' + hash, { responseType: 'blob', timeout: 300000 });
