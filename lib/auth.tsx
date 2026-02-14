'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  currentSewer: { id: string; name: string } | null;
  isManager: boolean;
  setCurrentSewer: (sewer: { id: string; name: string } | null) => void;
  setIsManager: (isManager: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentSewer, setCurrentSewer] = useState<{ id: string; name: string } | null>(null);
  const [isManager, setIsManager] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSewer = localStorage.getItem('currentSewer');
    const savedIsManager = localStorage.getItem('isManager');
    
    if (savedSewer) {
      setCurrentSewer(JSON.parse(savedSewer));
    }
    if (savedIsManager === 'true') {
      setIsManager(true);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (currentSewer) {
      localStorage.setItem('currentSewer', JSON.stringify(currentSewer));
    } else {
      localStorage.removeItem('currentSewer');
    }
  }, [currentSewer]);

  useEffect(() => {
    if (isManager) {
      localStorage.setItem('isManager', 'true');
    } else {
      localStorage.removeItem('isManager');
    }
  }, [isManager]);

  const logout = () => {
    setCurrentSewer(null);
    setIsManager(false);
    localStorage.removeItem('currentSewer');
    localStorage.removeItem('isManager');
  };

  return (
    <AuthContext.Provider value={{ currentSewer, isManager, setCurrentSewer, setIsManager, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
