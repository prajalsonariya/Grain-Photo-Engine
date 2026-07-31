import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  const API_URL = 'http://10.0.2.2:3000/api/mobile'; // For Android emulator. If real device, this needs to be the local IP or Vercel URL.

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!token && inTabsGroup) {
      // Redirect to the login page.
      router.replace('/login');
    } else if (token && !inTabsGroup) {
      // Redirect to the tabs page.
      router.replace('/(tabs)');
    }
  }, [token, segments, loading]);

  const loadToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('apiToken');
      if (storedToken) {
        await verifyToken(storedToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (storedToken) => {
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(storedToken);
        setUser(data.user);
        setIsSuperAdmin(data.isSuperAdmin);
      } else {
        await SecureStore.deleteItemAsync('apiToken');
        setToken(null);
      }
    } catch (e) {
      console.error(e);
      // Assume network error, keep token for now or force logout?
      // For local dev, we will keep it.
      setToken(storedToken);
    }
  };

  const login = async (newToken) => {
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken })
      });
      const data = await res.json();
      if (res.ok) {
        await SecureStore.setItemAsync('apiToken', newToken);
        setToken(newToken);
        setUser(data.user);
        setIsSuperAdmin(data.isSuperAdmin);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('apiToken');
    setToken(null);
    setUser(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ token, user, isSuperAdmin, loading, login, logout, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
}
