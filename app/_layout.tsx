import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';

// Authentication guard component
function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const rootSegment = Array.isArray(segments) ? segments[0] : undefined;
    const inAuthGroup = rootSegment === '(tabs)'; // Protected routes group

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login'); // Redirect unauthenticated users to login
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)'); // Redirect authenticated users to home
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard />
        <Stack>
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Auth screens */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
