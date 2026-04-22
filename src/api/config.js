// src/api/config.js 
const API_BASE_URL = 'http://localhost:5000/api'; // Back-end URL

// Хэрэглэгчийн токен авах
const getToken = () => localStorage.getItem('token');

// Токен хадгалах
const setToken = (token) => localStorage.setItem('token', token);

// Токен устгах
const removeToken = () => localStorage.removeItem('token');

// Хэрэглэгчийн мэдээлэл хадгалах
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Хэрэглэгчийн мэдээлэл авах
const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Хэрэглэгчийн мэдээлэл устгах
const removeUser = () => localStorage.removeItem('user');

// API дуудалт хийх үндсэн функц
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Хэрэв response амжилтгүй бол
    if (!response.ok) {
      const text = await response.text();
      // HTML хариу ирсэн эсэхийг шалгах
      if (text.startsWith('<!DOCTYPE')) {
        throw new Error('Сервер ажиллахгүй байна. Та back-end серверээ асаана уу.');
      }
      try {
        const data = JSON.parse(text);
        throw new Error(data.message || 'Алдаа гарлаа');
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// API методууд - GET, POST, PUT, DELETE бүгдийг нэмэх
const api = {
  get: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('GET request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      }
    });
    
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('POST Response not OK:', response.status, text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  put: async (endpoint, data) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('PUT request to:', url, data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      },
      body: JSON.stringify(data)
    });
    
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
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('DELETE Response not OK:', response.status, text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

// Бүх экспортууд
export { 
  api, 
  getToken, 
  setToken, 
  removeToken, 
  getUser,
  setUser, 
  removeUser 
};