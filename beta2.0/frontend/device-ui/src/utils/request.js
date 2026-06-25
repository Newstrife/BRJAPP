import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';

const service = axios.create({
  baseURL: `${window.location.protocol}//${apiHost}:3000/api`,
  timeout: 20000
});

service.interceptors.request.use(config => {
  const savedUser = localStorage.getItem('auth_user');

  if (savedUser) {
    const user = JSON.parse(savedUser);
    config.headers['x-user-name'] = user.username;
    config.headers['x-user-nickname'] = encodeURIComponent(user.nickname || user.username);
  }

  return config;
});

service.interceptors.response.use(
  res => {
    if (res.config.responseType === 'blob') {
      return res.data;
    }

    if (res.data.code !== 0) {
      alert(res.data.message);
      return Promise.reject(res.data.message);
    }
    return res.data.data;
  },
  error => {
    const message = error.response?.data?.message || error.message || '请求失败';
    alert(message);
    return Promise.reject(message);
  }
);

export default service;
