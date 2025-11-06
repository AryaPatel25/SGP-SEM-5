import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const logout = auth?.logout ?? (() => {});
  const isAuthenticated = !!auth?.isAuthenticated;
  const isLoading = !!auth?.isLoading;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (_error) {
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Not authenticated, redirecting...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Welcome
            {user
              ? `, ${
                  user.fullName ||
                  (user.email ? user.email.split("@")[0] : "User")
                }`
              : ""}{" "}
            👋
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Start a New Interview</Text>
          <Text style={styles.subtitle}>
            Choose your domain and start practicing with real-time feedback.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(tabs)/interview")}
          >
            <LinearGradient
              colors={["#8b5cf6", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Interview</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Past Interviews</Text>
          <Text style={styles.subtitle}>
            Review your performance and track your progress.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(tabs)/dashboard")}
          >
            <LinearGradient
              colors={["#8b5cf6", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>View Progress</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tips & Resources</Text>
          <Text style={styles.subtitle}>
            Improve your answers with voice clarity, confidence, and content
            quality.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#8b5cf6", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>View Tips</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#0f0f12", // fallback
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(36,36,40,0.7)",
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonPressed: {
    backgroundColor: "#ef4444",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "rgba(36,36,40,0.85)",
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#a1a1aa",
    marginBottom: 16,
  },
  button: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  outlineButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#60a5fa",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  outlineButtonPressed: {
    backgroundColor: "#18181b",
    borderColor: "#3b82f6",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  buttonTextAlt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#60a5fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f12",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginTop: 12,
  },
});
