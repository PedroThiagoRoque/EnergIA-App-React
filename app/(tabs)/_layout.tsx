import React from 'react';
import { Tabs } from 'expo-router';
import { AuthGuard } from '../../lib/auth/AuthGuard';

import { useAuth } from '../../lib/auth/useAuth';

export default function TabsLayout() {
  const { user } = useAuth();
  const isVolts = user?.group === 'Volts';
  const headerColor = isVolts ? '#64748B' : '#00A41B';

  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: headerColor,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            display: 'none',
          },
          headerStyle: {
            backgroundColor: headerColor,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'EnergIA',
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}