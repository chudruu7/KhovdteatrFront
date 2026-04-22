// src/auth/auth.js
import { api, setToken, removeToken, getUser as getStoredUser, setUser as setStoredUser, removeUser } from '../api/config';

// Нэвтрэх
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    console.log('Login response:', response); // ← нэмэх
    console.log('avatarUrl:', response.user?.avatarUrl); // ← нэмэх
    
    if (response.success && response.token) {
      setToken(response.token);
      setStoredUser(response.user);
      return { success: true, user: response.user };
    }
    
    return { success: false, message: response.message || 'Нэвтрэхэд алдаа гарлаа' };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Серверт холбогдоход алдаа гарлаа' 
    };
  }
};

// Бүртгэл үүсгэх
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);

    if (response.success) {
      const loginResult = await api.post('/auth/login', {
        email:    userData.email,
        password: userData.password
      });

      if (loginResult.success && loginResult.token) {
        setToken(loginResult.token);
        setStoredUser(loginResult.user);
        return { success: true, user: loginResult.user };
      }

       return { success: true, message: 'Бүртгэл амжилттай үүслээ' };
    }
return { success: false, message: response.message || 'Бүртгэл үүсгэхэд алдаа гарлаа' };

    // ← ЭНИЙГ НЭМЭХ: давхар имэйл бол login хийгээд avatarUrl шинэчилнэ
    if (response.message?.toLowerCase().includes('давхар') ||
        response.message?.toLowerCase().includes('exist') ||
        response.message?.toLowerCase().includes('already') ||
        response.statusCode === 409) {

      const loginResult = await api.post('/auth/login', {
        email:    userData.email,
        password: userData.password
      });

      if (loginResult.success && loginResult.token) {
        setToken(loginResult.token);

        // avatarUrl шинэчилнэ (Google зургийг хадгална)
        if (userData.avatarUrl) {
          await api.put('/auth/profile', { avatarUrl: userData.avatarUrl });
        }

        setStoredUser(loginResult.user);
        return { success: true, user: loginResult.user };
      }
    }

    return { success: false, message: response.message || 'Бүртгэл үүсгэхэд алдаа гарлаа' };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Серверт холбогдоход алдаа гарлаа'
    };
  }
};

// Гарах
export const logout = () => {
  removeToken();
  removeUser();
  return { success: true };
};

// Одоогийн хэрэглэгч авах
export const getCurrentUser = () => {
  return getStoredUser();
};

// Хэрэглэгчийн мэдээлэл хадгалах - ЭНЭ ФУНКЦИЙГ НЭМЭХ
export const setUser = (user) => {
  setStoredUser(user);
};

// Нэвтэрсэн эсэх
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Хэрэглэгчийн мэдээлэл шинэчлэх
export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    
    if (response.success) {
      setStoredUser(response.user);
      return { success: true, user: response.user };
    }
    
    return { success: false, message: response.message || 'Мэдээлэл шинэчлэхэд алдаа гарлаа' };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Серверт холбогдоход алдаа гарлаа' 
    };
  }
};

// Нууц үг солих
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', { oldPassword, newPassword });
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Нууц үг солиход алдаа гарлаа' 
    };
  }
};

// Хэрэглэгчийн захиалгууд авах
export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/user');
    return { success: true, bookings: response.bookings || [] };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Захиалгуудыг татахад алдаа гарлаа' 
    };
  }
};