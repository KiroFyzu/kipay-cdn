import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  function applySession(data) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await authApi.login(email, password);
    if (data.requires2FA) {
      return { requires2FA: true, loginToken: data.loginToken };
    }
    applySession(data);
    return { requires2FA: false };
  }

  async function verifyLogin(loginToken, code) {
    const { data } = await authApi.verifyLogin(loginToken, code);
    applySession(data);
  }

  async function register(email, password) {
    const { data } = await authApi.register(email, password);
    return data; // { setupToken, qrCode, secret, email }
  }

  async function verifyRegistrationSetup(setupToken, code) {
    const { data } = await authApi.verifySetup(setupToken, code);
    applySession(data);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyLogin,
        register,
        verifyRegistrationSetup,
        logout,
        refresh: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
