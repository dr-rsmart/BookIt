/**
 * useMyProvider Hook
 * ------------------
 * Loads the current authenticated user's Provider profile (matching `Nk()` in Base44).
 */

import { useState, useEffect, useCallback } from 'react';
import { providersApi, type ProviderRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useMyProvider() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProvider(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await providersApi.mine();
      setProvider(res.provider);
    } catch {
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { provider, setProvider, loading, reload };
}
