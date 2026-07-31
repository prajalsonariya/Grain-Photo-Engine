import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSuperAdmin, logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Folders',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'folder', android: 'folder', web: 'folder' }}
              tintColor={color}
              size={28}
            />
          ),
          headerRight: () => (
            <Pressable onPress={logout} style={{ marginRight: 15 }}>
              {({ pressed }) => (
                <SymbolView
                  name={{ ios: 'escape', android: 'logout', web: 'logout' }}
                  size={25}
                  tintColor={Colors[colorScheme ?? 'dark'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="superadmin"
        options={{
          title: 'Admin',
          href: isSuperAdmin ? '/superadmin' : null,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gear', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
