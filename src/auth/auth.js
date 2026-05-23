import {
  api,
  setToken,
  removeToken,
  getUser as getStoredUser,
  setUser as setStoredUser,
  removeUser,
} from '../api/config';

const persistAuth = (response) => {
  if (response?.success && response?.token && response?.user) {
    setToken(response.token);
    setStoredUser(response.user);
    return { success: true, user: response.user };
  }

  return {
    success: false,
    message: response?.message || 'Authentication failed',
  };
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return persistAuth(response);
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to connect to the server',
    };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return persistAuth(response);
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to create account',
    };
  }
};

export const socialLogin = async ({ name, email, avatarUrl, provider, providerId }) => {
  try {
    const response = await api.post('/auth/social-login', {
      name,
      email,
      avatarUrl,
      provider,
      providerId,
    });
    return persistAuth(response);
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to sign in with social account',
    };
  }
};

export const logout = () => {
  removeToken();
  removeUser();
  return { success: true };
};

export const getCurrentUser = () => {
  return getStoredUser();
};

export const setUser = (user) => {
  setStoredUser(user);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);

    if (response.success) {
      setStoredUser(response.user);
      return { success: true, user: response.user };
    }

    return { success: false, message: response.message || 'Unable to update profile' };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to connect to the server',
    };
  }
};

export const changePassword = async (oldPassword, newPassword) => {
  try {
    return await api.put('/auth/change-password', { oldPassword, newPassword });
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to change password',
    };
  }
};

export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/user');
    return { success: true, bookings: response.bookings || [] };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to load bookings',
    };
  }
};
