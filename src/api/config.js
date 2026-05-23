// src/api/config.js 
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://khovdteatrbackend.onrender.com/api';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};
const removeUser = () => localStorage.removeItem('user');

// ✅ Нийтлэг header үүсгэх helper
const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
});

// ✅ Нийтлэг options үүсгэх helper  
const getOptions = (method, data) => ({
  method,
  headers: getHeaders(),
  credentials: 'include', // ← ЭНЭ Л ГҮЙДЭГ БАЙСАН
  ...(data ? { body: JSON.stringify(data) } : {})
});

const requestWithTimeout = async (url, options, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const api = {
  get: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('GET request to:', url);
    
    const response = await requestWithTimeout(url, getOptions('GET'));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('GET Response not OK:', response.status, text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  post: async (endpoint, data) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('POST request to:', url, data);
    
    const response = await requestWithTimeout(url, getOptions('POST', data));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('POST Response not OK:', response.status, text);
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || `HTTP error! status: ${response.status}`);
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw parseError;
      }
    }
    return response.json();
  },

  put: async (endpoint, data) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('PUT request to:', url, data);
    
    const response = await requestWithTimeout(url, getOptions('PUT', data));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('PUT Response not OK:', response.status, text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('DELETE request to:', url);
    
    const response = await requestWithTimeout(url, getOptions('DELETE'));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('DELETE Response not OK:', response.status, text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

export { 
  api, 
  getToken, 
  setToken, 
  removeToken, 
  getUser,
  setUser, 
  removeUser 
};
