import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    signup: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('thought_click_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('thought_click_user');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, [token]);

    const login = async (username: string, password: string) => {
        const res = await api.auth.login({ username, password });
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('thought_click_token', res.token);
        localStorage.setItem('thought_click_user', JSON.stringify(res.user));
    };

    const signup = async (username: string, password: string) => {
        const res = await api.auth.signup({ username, password });
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('thought_click_token', res.token);
        localStorage.setItem('thought_click_user', JSON.stringify(res.user));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('thought_click_token');
        localStorage.removeItem('thought_click_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
