import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { changeRequestService } from '@/services';

const PendingCountContext = createContext(null);

export function PendingCountProvider({ children, enabled = false }) {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    if (!enabled) {
      setPendingCount(0);
      return;
    }
    try {
      const pending = await changeRequestService.listPending();
      setPendingCount(pending.filter(r => r.status === 'pending').length);
    } catch {
      setPendingCount(0);
    }
  }, [enabled]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const decrementPendingCount = useCallback(() => {
    setPendingCount(c => Math.max(0, c - 1));
  }, []);

  return (
    <PendingCountContext.Provider
      value={{ pendingCount, setPendingCount, refreshPendingCount, decrementPendingCount }}
    >
      {children}
    </PendingCountContext.Provider>
  );
}

export function usePendingCount() {
  const ctx = useContext(PendingCountContext);
  if (!ctx) {
    return {
      pendingCount: 0,
      setPendingCount: () => {},
      refreshPendingCount: async () => {},
      decrementPendingCount: () => {},
    };
  }
  return ctx;
}
