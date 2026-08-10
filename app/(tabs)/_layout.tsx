import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, PRIMARY } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY.blue,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <MaterialIcons size={24} name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, size }) => <MaterialIcons size={24} name="event" color={color} />,
        }}
      />
      <Tabs.Screen
        name="komisi"
        options={{
          title: 'Komisi',
          tabBarIcon: ({ color, size }) => <MaterialIcons size={24} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="arsip"
        options={{
          title: 'Arsip',
          tabBarIcon: ({ color, size }) => <MaterialIcons size={24} name="folder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <MaterialIcons size={24} name="grid-view" color={color} />,
        }}
      />
    </Tabs>
  );
}
