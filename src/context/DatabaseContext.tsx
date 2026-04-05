import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getDatabase } from '../db/database';

interface DbCtx {
  ready: boolean;
  error: Error | null;
  retry: () => void;
}

const Ctx = createContext<DbCtx | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setReady(false);
    setToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getDatabase();
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value: DbCtx = { ready, error, retry };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDatabaseStatus(): DbCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDatabaseStatus outside DatabaseProvider');
  return v;
}
