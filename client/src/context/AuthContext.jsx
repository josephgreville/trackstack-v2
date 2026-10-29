import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    authService
      .me({ signal: controller.signal })
      .then(({ user: currentUser }) => {
        if (!controller.signal.aborted) setUser(currentUser);
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: nextUser } = await authService.login(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (details) => {
    const { user: nextUser } = await authService.register(details);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
