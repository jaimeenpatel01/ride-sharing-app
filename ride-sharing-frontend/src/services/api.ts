import axios, { AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

const api = axios.create({
    baseURL: "http://192.168.1.20:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, // 10 second timeout
});

// Add token to every request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for caching
api.interceptors.response.use(
    (response) => {
        // Cache GET requests
        if (response.config.method === 'get' && response.config.url) {
            const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
            apiCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now(),
                ttl: CACHE_TTL
            });
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Enhanced API methods with caching
export const apiWithCache = {
    get: async (url: string, config?: AxiosRequestConfig & { cacheTtl?: number }) => {
        const cacheKey = `${url}?${JSON.stringify(config?.params || {})}`;
        const cached = apiCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < (config?.cacheTtl || cached.ttl)) {
            return { data: cached.data };
        }
        
        const response = await api.get(url, config);
        return response;
    },
    post: api.post.bind(api),
    put: api.put.bind(api),
    delete: api.delete.bind(api),
};

export default api;
