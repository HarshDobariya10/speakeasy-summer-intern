'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AdminUser, AdminLoginDto, AdminRegisterDto } from '@/app/types/auth';
import { getAccessToken, getRefreshToken, restoreTokensFromStorage, clearTokens } from '@/app/lib/token';
import { getProfile, login as authLogin, logout as authLogout, refreshToken, register as authRegister } from '@/app/lib/authService';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: AdminLoginDto) => Promise<void>;
  register: (dto: AdminRegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreTokensFromStorage();

    const initAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        // Try refresh
        const storedRefresh = getRefreshToken();
        if (storedRefresh) {
          try {
            await refreshToken({ refreshToken: storedRefresh });
            const profile = await getProfile();
            setUser(profile);
          } catch {
            clearTokens();
            setUser(null);
          }
        } else {
          clearTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (dto: AdminLoginDto) => {
    const data = await authLogin(dto);
    setUser(data.admin);
  }, []);

  const register = useCallback(async (dto: AdminRegisterDto) => {
    const data = await authRegister(dto);
    setUser(data.admin);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
