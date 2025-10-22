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
            backgroundColor: '#000000',
            borderTopColor: 'rgba(0, 164, 27, 0.3)',
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