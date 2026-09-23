import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await api.get('/user');
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password, remember = false) => {
        // Get CSRF cookie first (required for Sanctum SPA auth)
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
        const res = await api.post('/login', { email, password, remember });
        setUser(res.data.user);
        return res.data;
    };

    const register = async (data) => {
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
        const res = await api.post('/register', data);
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        await api.post('/logout');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        fetchUser,
        isAdmin: user?.role === 'admin',
        isEmployee: user?.role === 'employee',
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
