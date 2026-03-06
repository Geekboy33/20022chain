"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface ChainUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: ChainUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = '20022chain_auth';

export function ChainAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChainUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const p = JSON.parse(saved); if (p?.user) setUser(p.user); }
    } catch {}
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const demoPass = process.env.NEXT_PUBLIC_DEMO_PASS || 'demo';
    if (password === demoPass && email.includes('@')) {
      const u: ChainUser = {
        id: `u-${Date.now()}`,
        email: email.toLowerCase().trim(),
        displayName: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: 'explorer',
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u }));
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: 'Invalid credentials. Request access first.' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useChainAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useChainAuth must be used within ChainAuthProvider');
  return ctx;
}
