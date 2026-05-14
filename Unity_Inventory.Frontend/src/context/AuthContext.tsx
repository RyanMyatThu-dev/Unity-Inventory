'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { normalizeAccountType } from '@/lib/accountType';

interface BusinessAccess {
  businessId: number;
  businessName: string;
  role: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  /** Global Tbl_Users.AccountType (Owner | Admin | Staff, …) */
  accountType: string;
  businesses: BusinessAccess[];
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  currentBusinessId: number | null;
  login: (data: Record<string, unknown>) => void;
  logout: () => void;
  switchBusiness: (businessId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapBusinesses(raw: unknown): BusinessAccess[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b: Record<string, unknown>) => ({
    businessId: Number(b.businessId ?? b.BusinessId ?? 0),
    businessName: String(b.businessName ?? b.BusinessName ?? ''),
    role: String(b.role ?? b.Role ?? ''),
  }));
}

function mapAuthPayload(data: Record<string, unknown>): AuthUser {
  const email = String(data.email ?? data.Email ?? '');
  const name = String(data.name ?? data.Name ?? (email ? email.split('@')[0] : 'User'));
  const role = String(data.role ?? data.Role ?? '');
  const accountType = normalizeAccountType(data.accountType ?? data.AccountType);
  const businesses = mapBusinesses(data.businesses ?? data.Businesses);
  return { email, name, role, accountType, businesses };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentBusinessId, setCurrentBusinessId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedBusinessId = localStorage.getItem('currentBusinessId');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as Record<string, unknown>;
        setAccessToken(savedToken);
        setUser(mapAuthPayload(parsed));
      } catch {
        setAccessToken(savedToken);
        setUser(null);
      }
      if (savedBusinessId) {
        setCurrentBusinessId(parseInt(savedBusinessId, 10));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: Record<string, unknown>) => {
    const userData = mapAuthPayload(data);
    const access = String(data.accessToken ?? data.AccessToken ?? '');
    const refresh = String(data.refreshToken ?? data.RefreshToken ?? '');

    setAccessToken(access);
    setUser(userData);

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(userData));

    const { businesses } = userData;
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

  const refreshUser = async () => {
    try {
      const response = await api.get('/business/my-businesses');
      if (response.data.isSuccess && user) {
        const freshBusinesses = mapBusinesses(response.data.data);
        const updatedUser: AuthUser = { ...user, businesses: freshBusinesses };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user businesses:', error);
    }
  };

  const switchBusiness = async (businessId: number) => {
    try {
      const response = await api.post(`/business/switch-business/${businessId}`);
      if (response.data.isSuccess) {
        const payload = response.data.data as Record<string, unknown>;
        let prev: Record<string, unknown> = {};
        try {
          prev = JSON.parse(localStorage.getItem('user') || '{}') as Record<string, unknown>;
        } catch {
          prev = {};
        }

        const merged: AuthUser = {
          email: String(payload.email ?? payload.Email ?? prev.email ?? ''),
          name: String(payload.name ?? payload.Name ?? prev.name ?? ''),
          role: String(payload.role ?? payload.Role ?? prev.role ?? ''),
          accountType: normalizeAccountType(
            payload.accountType ?? payload.AccountType ?? prev.accountType
          ),
          businesses: mapBusinesses(payload.businesses ?? payload.Businesses ?? prev.businesses),
        };

        const nextAccess = String(payload.accessToken ?? payload.AccessToken ?? '');
        const nextRefresh = String(payload.refreshToken ?? payload.RefreshToken ?? '');

        localStorage.setItem('accessToken', nextAccess);
        localStorage.setItem('refreshToken', nextRefresh);
        localStorage.setItem('currentBusinessId', businessId.toString());
        localStorage.setItem('user', JSON.stringify(merged));

        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Failed to switch business:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, currentBusinessId, login, logout, switchBusiness, refreshUser, isLoading }}>
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
