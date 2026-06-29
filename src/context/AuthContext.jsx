import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { USERS, logAudit, seedData } from '../utils/crmStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('crm_current_user') || 'null'));

  useEffect(() => {
    seedData();
  }, []);

  const login = (roleKey) => {
    const user = USERS[roleKey];
    if (!user) return false;
    setCurrentUser(user);
    localStorage.setItem('crm_current_user', JSON.stringify(user));
    logAudit('login', 'User logged in', user);
    return true;
  };

  const logout = () => {
    if (currentUser) logAudit('logout', 'User logged out', currentUser);
    setCurrentUser(null);
    localStorage.removeItem('crm_current_user');
  };

  const value = useMemo(() => ({ currentUser, login, logout, users: USERS }), [currentUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
