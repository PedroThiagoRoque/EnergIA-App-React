import React from 'react';
import { Stack } from 'expo-router';
import { AuthGuard } from '../../lib/auth/AuthGuard';

export default function AuthLayout() {
  return (
    <AuthGuard requireAuth={false}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            title: 'Login',
          }} 
        />
      </Stack>
    </AuthGuard>
  );
}