// src/api/config.js
const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = 'https://khovdteatrbackend.onrender.com/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => (
  error?.name === 'AbortError' ||
  error?.message?.includes('Failed to fetch') ||
  error?.message?.includes('Back-end server')
);

const isRetryableStatus = (status) => [502, 503, 504].includes(status);

const requestWithTimeout = async (url, options, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort('request_timeout');
  }, timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Back-end server асаж байна. Түр хүлээгээд дахин оролдоно уу.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const requestWithRetry = async (url, options, { retries = 4, timeoutMs = 45000 } = {}) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await requestWithTimeout(url, options, timeoutMs);

      if (!isRetryableStatus(response.status) || attempt === retries) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }
    }

    await sleep(3000 * (attempt + 1));
  }

  throw lastError || new Error('Хүсэлт амжилтгүй боллоо.');
};

const readErrorMessage = async (response, fallback) => {
  const text = await response.text();
  console.error(fallback, response.status, text);
  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.error || `HTTP error! status: ${response.status}`;
  } catch {
    return `HTTP error! status: ${response.status}`;
  }
};

const api = {
  get: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('GET request to:', url);
    
    const response = await requestWithRetry(url, getOptions('GET'));
    
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'GET Response not OK:'));
    }
    return response.json();
  },

  post: async (endpoint, data) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('POST request to:', url, data);
    
    const response = await requestWithTimeout(url, getOptions('POST', data));
    
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'POST Response not OK:'));
    }
    return response.json();
  },

  put: async (endpoint, data) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('PUT request to:', url, data);
    
    const response = await requestWithTimeout(url, getOptions('PUT', data));
    
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'PUT Response not OK:'));
    }
    return response.json();
  },

  delete: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('DELETE request to:', url);
    
    const response = await requestWithTimeout(url, getOptions('DELETE'));
    
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'DELETE Response not OK:'));
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
