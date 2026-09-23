import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Response interceptor to handle 401 (unauthenticated)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if already on an auth page or if it's the /api/user check
            const isAuthPage = window.location.pathname.startsWith('/login')
                || window.location.pathname.startsWith('/register')
                || window.location.pathname.startsWith('/forgot-password')
                || window.location.pathname.startsWith('/reset-password')
                || window.location.pathname.startsWith('/invite');
            const isUserCheck = error.config?.url === '/api/user' || error.config?.url === 'user';

            if (!isAuthPage && !isUserCheck) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;