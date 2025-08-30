import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { riotService } from '../services/riotService';

interface VersionContextType {
  version: string | null;
  loading: boolean;
  error: string | null;
  refreshVersion: () => Promise<void>;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersion = async () => {
    // Check if we already have a cached version
    const cachedVersion = riotService.getCachedVersion();
    if (cachedVersion) {
      setVersion(cachedVersion);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const currentVersion = await riotService.getCurrentVersion();
      setVersion(currentVersion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version');
      console.error('Error fetching version:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshVersion = async () => {
    riotService.clearVersionCache();
    await fetchVersion();
  };

  useEffect(() => {
    fetchVersion();
  }, []);

  return (
    <VersionContext.Provider value={{ version, loading, error, refreshVersion }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
}
