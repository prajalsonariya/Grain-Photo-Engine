import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';

const setItemAsync = async (key, value) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

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

  const API_URL = 'http://192.168.1.11:3000/api/mobile'; // Configured for Expo Go on physical device (LAN IP)

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
      const storedToken = await getItemAsync('apiToken');
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
        await deleteItemAsync('apiToken');
        setToken(null);
      }
    } catch (e) {
      console.error(e);
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
        await setItemAsync('apiToken', newToken);
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
    await deleteItemAsync('apiToken');
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
