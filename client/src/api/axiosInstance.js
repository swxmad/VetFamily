import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Запрос:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Ошибка запроса:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Ответ:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('Ошибка ответа:', error.response?.status, error.config?.url);
    if (error.response?.status === 401) {
      console.log('401 — перенаправление на /login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;