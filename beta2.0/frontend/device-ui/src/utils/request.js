import axios from 'axios';
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: '/api',
  timeout: 20000
});

const handleUnauthorized = () => {
  localStorage.removeItem('auth_user');
  ElMessage.error('登录已过期，请重新登录');
  window.location.reload();
};

service.interceptors.request.use(config => {
  const savedUser = localStorage.getItem('auth_user');

  if (savedUser) {
    const user = JSON.parse(savedUser);

    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }

  return config;
});

service.interceptors.response.use(
  res => {
    if (res.config.responseType === 'blob') {
      return res.data;
    }

    if (res.data.code === 401) {
      handleUnauthorized();
      return Promise.reject(res.data.message);
    }

    if (res.data.code !== 0) {
      ElMessage.error(res.data.message);
      return Promise.reject(res.data.message);
    }
    return res.data.data;
  },
  error => {
    if (error.response?.status === 401) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || error.message || '请求失败';
    ElMessage.error(message);
    return Promise.reject(message);
  }
);

export default service;
