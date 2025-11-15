import { Ionicons } from "@expo/vector-icons";
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
    TouchableOpacity,
    View,
} from "react-native";
import GlassCard from "../../components/ui/GlassCard";
import { Theme } from "../../constants/Colors";
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Welcome{user?.fullName?.trim() ? `, ${user.fullName.trim()}` : user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
              </Text>
              <Text style={styles.headerSubtitle}>
                Ready to ace your next interview?
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubbles" size={28} color={Theme.dark.accent} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.title}>Start a New Interview</Text>
                <Text style={styles.subtitle}>
                  Choose your domain and start practicing with real-time feedback.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/(tabs)/interview")}
            >
              <LinearGradient
                colors={Theme.dark.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Start Interview</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="stats-chart" size={28} color={Theme.dark.accent} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.title}>View Progress</Text>
                <Text style={styles.subtitle}>
                  Review your performance and track your progress over time.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/(tabs)/dashboard")}
            >
              <LinearGradient
                colors={Theme.dark.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>View Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="bulb" size={28} color={Theme.dark.accent} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.title}>Tips & Resources</Text>
                <Text style={styles.subtitle}>
                  Improve your answers with expert tips and valuable resources.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(tabs)/tips-resources')}
            >
              <LinearGradient
                colors={Theme.dark.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>View Tips</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="videocam" size={28} color={Theme.dark.accent} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.title}>Mock Interview</Text>
                <Text style={styles.subtitle}>
                  Practice with video recording and get AI-powered feedback.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(tabs)/mock-interview')}
            >
              <LinearGradient
                colors={Theme.dark.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Start Mock Interview</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.dark.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.dark.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.dark.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.dark.textPrimary,
    marginTop: 12,
  },
});
