import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// Setup the auth interceptor with a function to get the token
// This function will be called before each request to get the token
// It should return a Promise that resolves to the token or null
let getTokenFn: (() => Promise<string | null>) | null = null;

export function setupAuthInterceptor(getToken: () => Promise<string | null>) {
  getTokenFn = getToken;
}

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Failed to get Clerk token:", err);
    }
  }
  return config;
});

export default api;
