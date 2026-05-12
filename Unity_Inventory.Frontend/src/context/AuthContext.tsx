'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface BusinessAccess {
  businessId: number;
  businessName: string;
  role: string;
}

interface User {
  email: string;
  role: string;
  businesses: BusinessAccess[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  currentBusinessId: number | null;
  login: (data: any) => void;
  logout: () => void;
  switchBusiness: (businessId: number) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentBusinessId, setCurrentBusinessId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedBusinessId = localStorage.getItem('currentBusinessId');

    if (savedToken && savedUser) {
      setAccessToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedBusinessId) {
        setCurrentBusinessId(parseInt(savedBusinessId));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: any) => {
    const { accessToken, refreshToken, email, role, businesses } = data;
    const userData = { email, role, businesses };
    
    setAccessToken(accessToken);
    setUser(userData);
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));

    // Handle business selection flow
    if (businesses.length === 1) {
      await switchBusiness(businesses[0].businessId);
    } else if (businesses.length > 1) {
      router.push('/select-business');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setCurrentBusinessId(null);
    localStorage.clear();
    router.push('/login');
  };

  const switchBusiness = async (businessId: number) => {
    try {
      const response = await api.post(`/business/switch-business/${businessId}`);
      if (response.data.isSuccess) {
        const { accessToken, refreshToken, role, businesses, email } = response.data.data;
        
        const updatedUser = { email, role, businesses };
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('currentBusinessId', businessId.toString());
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Use href for a full reload to ensure the new token is picked up by all services
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Failed to switch business:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, currentBusinessId, login, logout, switchBusiness, isLoading }}>
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
