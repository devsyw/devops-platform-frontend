import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => {
    // blob 응답은 그대로 반환
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    // blob 요청의 에러는 별도 처리
    if (error.response?.config?.responseType === 'blob') {
      console.error('Download Error:', error.response.status);
      return Promise.reject(error);
    }
    const message = error.response?.data?.message || '서버 오류가 발생했습니다.';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default api;