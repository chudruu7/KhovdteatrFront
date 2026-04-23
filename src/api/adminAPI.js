// src/api/adminAPI.js

const API_BASE_URL = 'https://khovdteatrbackend.onrender.com/api';

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const handleResponse = async (response) => {
    const text = await response.text();
    try {
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('Таны нэвтрэх эрх хугацаа дууссан.');
            }
            if (response.status === 404) throw new Error(`API зам олдсонгүй: ${response.url}`);
            throw new Error(data.message || `Алдаа гарлаа (${response.status})`);
        }
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) throw new Error('Серверээс буруу хариу ирлээ.');
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Schedule API
// ─────────────────────────────────────────────────────────────────────────────
export const scheduleAPI = {
    getByDate: async (date) => {
        const response = await fetch(`${API_BASE_URL}/schedules?date=${date}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    getSeats: async (scheduleId) => {
        const response = await fetch(`${API_BASE_URL}/schedules/seats/${scheduleId}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    create: async ({ movieId, showTime, hall, basePrice }) => {
        const response = await fetch(`${API_BASE_URL}/schedules`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ movieId, showTime, hall, basePrice }),
        });
        return handleResponse(response);
    },

    update: async (id, { movieId, showTime, hall, basePrice }) => {
        const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ movieId, showTime, hall, basePrice }),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin API
// ─────────────────────────────────────────────────────────────────────────────
export const adminAPI = {
    getDashboardStats:   async () => handleResponse(await fetch(`${API_BASE_URL}/admin/dashboard`,        { headers: getHeaders(), credentials: 'include' })),
    getRecentShowtimes:  async () => handleResponse(await fetch(`${API_BASE_URL}/admin/recent-showtimes`, { headers: getHeaders(), credentials: 'include' })),
    getRecentBookings:   async () => handleResponse(await fetch(`${API_BASE_URL}/admin/recent-bookings`,  { headers: getHeaders(), credentials: 'include' })),
    getFeaturedMovies:   async () => handleResponse(await fetch(`${API_BASE_URL}/admin/featured-movies`,  { headers: getHeaders(), credentials: 'include' })),
    getUpcomingMovies:   async () => handleResponse(await fetch(`${API_BASE_URL}/admin/upcoming-movies`,  { headers: getHeaders(), credentials: 'include' })),
    getAlerts:           async () => handleResponse(await fetch(`${API_BASE_URL}/admin/alerts`,           { headers: getHeaders(), credentials: 'include' })),
    getSparklines:       async () => handleResponse(await fetch(`${API_BASE_URL}/admin/sparklines`,       { headers: getHeaders(), credentials: 'include' })),
};

// ─────────────────────────────────────────────────────────────────────────────
// Movie API
// ─────────────────────────────────────────────────────────────────────────────
export const movieAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/movies`, { method: 'GET', headers: getHeaders(), credentials: 'include' });
        return handleResponse(response);
    },
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/movies/${id}`, { method: 'GET', headers: getHeaders(), credentials: 'include' });
        return handleResponse(response);
    },
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/movies`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data) });
        return handleResponse(response);
    },
    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/movies/${id}`, { method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data) });
        return handleResponse(response);
    },
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/movies/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' });
        return handleResponse(response);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// News API
// ─────────────────────────────────────────────────────────────────────────────
export const newsAPI = {
    getAll: async (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/news${qs ? '?' + qs : ''}`, {
            method: 'GET', headers: getHeaders(), credentials: 'include',
        });
        return handleResponse(response);
    },

    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/news/${id}`, {
            method: 'GET', headers: getHeaders(), credentials: 'include',
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/news`, {
            method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/news/${id}`, {
            method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/news/${id}`, {
            method: 'DELETE', headers: getHeaders(), credentials: 'include',
        });
        return handleResponse(response);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Cinema API
// ─────────────────────────────────────────────────────────────────────────────
export const cinemaAPI = {
    getInfo: async () => {
        const response = await fetch(`${API_BASE_URL}/cinema-info`, { method: 'GET', headers: getHeaders(), credentials: 'include' });
        return handleResponse(response);
    },
    updateInfo: async (data) => {
        const response = await fetch(`${API_BASE_URL}/cinema-info`, { method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data) });
        return handleResponse(response);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup API
// ─────────────────────────────────────────────────────────────────────────────
export const cleanupAPI = {
    getPending: async () => {
        const response = await fetch(`${API_BASE_URL}/cleanup/pending`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    approve: async (id) => {
        const response = await fetch(`${API_BASE_URL}/cleanup/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    reject: async (id) => {
        const response = await fetch(`${API_BASE_URL}/cleanup/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },
};