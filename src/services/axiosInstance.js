import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_REACT_BASE_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
    
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {

      window.location.href = '/login';
      return Promise.reject(error);
    }

    // console.log(error.response.data.message || "Access denied");
    if (error.response.status === 403) {
     
      window.location.href = '/login';
      return Promise.reject({ message: error.response.data.message || "Access denied" });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 