import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function Home() {
  const router = useRouter();
  let user = null;
  let logout = () => {};
  let isAuthenticated = false;
  let isLoading = true;

  try {
    const auth = useAuth();
    if (auth && typeof auth === 'object') {
      user = auth.user || null;
      logout = auth.logout || (() => {});
      isAuthenticated = auth.isAuthenticated || false;
      isLoading = auth.isLoading || true;
    }
  } catch (error) {
    console.log('Auth context not available yet:', error);
  }

  useEffect(() => {
    // Temporarily disable auth redirect to prevent loading issues
    // if (!isLoading && !isAuthenticated) {
    //   router.replace('/login');
    // }
  }, [isAuthenticated, isLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Temporarily disable loading states to prevent stuck loading
  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#38bdf8" />
  //       <Text style={styles.loadingText}>Loading...</Text>
  //     </View>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //     <Text style={styles.loadingText}>Not authenticated, redirecting...</Text>
  //   </View>
  // );
  // }

  return (
    <View style={styles.pageContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Welcome{user ? `, ${user.fullName}` : ''} 👋</Text>
          <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Start a New Interview</Text>
          <Text style={styles.subtitle}>
            Choose your domain and start practicing with real-time feedback.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.push('/(tabs)/interview')}
          >
            <Text style={styles.buttonText}>Start Interview</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Past Interviews</Text>
          <Text style={styles.subtitle}>
            Review your performance and track your progress.
          </Text>
          <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}>
            <Text style={styles.buttonTextAlt}>View Progress</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tips & Resources</Text>
          <Text style={styles.subtitle}>
            Improve your answers with voice clarity, confidence, and content quality.
          </Text>
          <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}>
            <Text style={styles.buttonTextAlt}>View Tips</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#18181b', // true black/dark grey
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#23272e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonPressed: {
    backgroundColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#23272e',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 19,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a3a3a3',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: '#0ea5e9',
  },
  outlineButton: {
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  outlineButtonPressed: {
    backgroundColor: '#23272e',
    borderColor: '#0ea5e9',
  },
  buttonText: {
    color: '#18181b',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  buttonTextAlt: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});
