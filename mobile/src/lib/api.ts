import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://192.168.0.13:8000/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");
    }
    return Promise.reject(err);
  }
);

export default api;
