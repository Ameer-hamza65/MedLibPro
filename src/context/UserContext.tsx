import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useEnterprise } from '@/context/EnterpriseContext';

export interface UserState {
  isLoggedIn: boolean;
  name?: string;
  email?: string;
}

interface UserContextType {
  user: UserState;
  login: (email: string) => void;
  logout: () => void;
  hasFullAccess: (bookId: string) => boolean;
}

const defaultUser: UserState = {
  isLoggedIn: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserState>(defaultUser);
  const { isEnterpriseMode } = useEnterprise();

  const login = useCallback((email: string) => {
    setUser({
      isLoggedIn: true,
      email,
      name: email.split('@')[0],
    });
  }, []);

  const logout = useCallback(() => {
    setUser(defaultUser);
  }, []);

  // Access is now purely institutional — delegate to enterprise context
  const hasFullAccess = useCallback((_bookId: string) => {
    return isEnterpriseMode;
  }, [isEnterpriseMode]);

  return (
    <UserContext.Provider value={{ user, login, logout, hasFullAccess }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
