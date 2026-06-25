
const axios = require('axios'); 

const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
});

service.interceptors.response.use(res => {
  if (res.data.code !== 0) {
    alert(res.data.message);
    return Promise.reject(res.data.message);
  }
  return res.data.data;
});

export default service;