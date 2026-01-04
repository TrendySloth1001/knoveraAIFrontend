'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  bio?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  profileVisibility?: string;
  defaultContentMode?: string;
  allowFollowers?: boolean;
  grade?: string;
  institution?: string;
  interests?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  tempToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsSignup: boolean;
  login: (token: string) => Promise<void>;
  setTempToken: (token: string, email?: string, name?: string) => void;
  clearTempToken: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tempToken, setTempTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage and fetch user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedTempToken = localStorage.getItem('tempToken');
      
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setUser(data.data.user);
              setProfile(data.data.profile);
            } else {
              // Invalid token, clear it
              localStorage.removeItem('authToken');
              setToken(null);
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      } else if (storedTempToken) {
        // User has temp token but no full token - needs signup
        setTempTokenState(storedTempToken);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    localStorage.removeItem('tempToken'); // Clear any temp token

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data.user);
          setProfile(data.data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user after login:', error);
    }
  };

  const setTempToken = (token: string, email?: string, name?: string) => {
    setTempTokenState(token);
    localStorage.setItem('tempToken', token);
    if (email) localStorage.setItem('tempEmail', email);
    if (name) localStorage.setItem('tempName', name);
  };

  const clearTempToken = () => {
    setTempTokenState(null);
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempEmail');
    localStorage.removeItem('tempName');
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    setTempTokenState(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempEmail');
    localStorage.removeItem('tempName');
  };

  const value: AuthContextType = {
    user,
    profile,
    token,
    tempToken,
    isLoading,
    isAuthenticated: !!token && !!user,
    needsSignup: !!tempToken && !token,
    login,
    setTempToken,
    clearTempToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
