import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import type { FavoriteItem } from '../types';

interface FavoritesContextValue {
  ids: Set<number>;
  items: FavoriteItem[];
  loading: boolean;
  toggle: (listingId: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ items: FavoriteItem[] }>('/favorites');
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (listingId: number) => {
      const result = await api<{ added: boolean }>(`/favorites/${listingId}`, { method: 'POST' });
      if (result.added) {
        await refresh();
      } else {
        setItems((current) => current.filter((item) => item.listingId !== listingId));
      }
      return result.added;
    },
    [refresh],
  );

  const ids = useMemo(() => new Set(items.map((item) => item.listingId)), [items]);

  const value = useMemo(
    () => ({ ids, items, loading, toggle, refresh }),
    [ids, items, loading, toggle, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
