import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, tokens } from './api';

export type Me = {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'superadmin';
};

type Ctx = {
  me: Me | null;
  booting: boolean;
  isSuper: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const SessionCtx = createContext<Ctx>(null as unknown as Ctx);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!tokens.access) {
      setBooting(false);
      return;
    }
    get<Me>('/auth/me')
      .then((u) => setMe(u.role === 'user' ? null : u))
      .catch(() => setMe(null))
      .finally(() => setBooting(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await post<{ access_token: string; refresh_token: string; user: Me }>(
      '/auth/login',
      { email, password },
      { auth: false },
    );
    if (data.user.role === 'user') {
      throw new Error('This account does not have admin access.');
    }
    tokens.save(data.access_token, data.refresh_token);
    setMe(data.user);
  }, []);

  const signOut = useCallback(() => {
    const rt = tokens.refresh;
    if (rt) post('/auth/logout', { refresh_token: rt }).catch(() => {});
    tokens.clear();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ me, booting, isSuper: me?.role === 'superadmin', signIn, signOut }),
    [me, booting, signIn, signOut],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);
