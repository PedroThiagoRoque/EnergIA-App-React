import React from 'react';
import { Tabs } from 'expo-router';
import { AuthGuard } from '../../lib/auth/AuthGuard';

export default function TabsLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#00A41B',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            display: 'none',
          },
          headerStyle: {
            backgroundColor: '#00A41B',
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