import { useState, useEffect } from "react";

export function useOfflineAuth() {
  const [offlineCredentials, setOfflineCredentials] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("offlineCredentials");
    if (stored) {
      setOfflineCredentials(JSON.parse(stored));
    }
  }, []);

  const saveOfflineCredentials = (credentials: any) => {
    localStorage.setItem("offlineCredentials", JSON.stringify(credentials));
    setOfflineCredentials(credentials);
  };

  return { offlineCredentials, saveOfflineCredentials };
}
