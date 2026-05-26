import axios from 'axios';
import toast from 'react-hot-toast';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api", 
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      const isToneRequest = error.config?.url?.includes("/ai/tone");
      if (!isToneRequest) {
        const message = error.response.data?.message || "Too many requests. Please try again later.";
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);