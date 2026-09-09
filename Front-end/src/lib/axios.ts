import axios from 'axios';
import { MOCK_USERS, MOCK_ROLES, User, AuthResponse } from './mockData';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'; // Default to true if not explicitly 'false'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Authorization Token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to simulate network delay for mock responses
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Response Interceptor: Handle Mock Mode or Standard API Responses
api.interceptors.request.use(async (config) => {
  if (!USE_MOCK) return config;

  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  // Simulated Mock Routing
  if (url.includes('/auth/login') && method === 'post') {
    await delay(400);
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const user = MOCK_USERS.find((u) => u.Email === body?.email) || MOCK_USERS[2]; // Default to Customer

    const mockResponse: AuthResponse = {
      token: 'mock-jwt-token-plotfarm-team4-2026',
      user,
    };

    config.adapter = async () => ({
      data: { success: true, message: 'Đăng nhập thành công (Mock Data)', data: mockResponse },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  } else if (url.includes('/users') && method === 'get') {
    await delay(300);
    config.adapter = async () => ({
      data: { success: true, data: MOCK_USERS },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  } else if (url.includes('/roles') && method === 'get') {
    await delay(200);
    config.adapter = async () => ({
      data: { success: true, data: MOCK_ROLES },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  } else if (url.includes('/auth/me') && method === 'get') {
    await delay(200);
    config.adapter = async () => ({
      data: { success: true, data: MOCK_USERS[2] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  return config;
});

// Global Response Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
