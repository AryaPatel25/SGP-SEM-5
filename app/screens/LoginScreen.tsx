import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  let login = async (credentials: any): Promise<void> => {
    throw new Error("Auth not initialized");
  };
  let isLoading = false;

  try {
    const auth = useAuth();
    if (auth && typeof auth === "object") {
      login =
        auth.login ||
        (async () => {
          throw new Error("Auth not initialized");
        });
      isLoading = auth.isLoading || false;
    }
  } catch (error) {
    console.log("Auth context not available yet:", error);
  }
  const { theme } = useTheme();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const logoScale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(emailOrPhone)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login({ email: emailOrPhone, password, rememberMe });
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Please try again"
      );
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/forgot-password" as any);
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Logo Section stays fixed */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Animated.View
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          >
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>AI</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.appTitle}>Job Interview Trainer</Text>
          <Text style={styles.subtitle}>
            Master your interview skills with AI
          </Text>
        </Animated.View>

        {/* Scrollable Form */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#64748b"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setRememberMe(!rememberMe);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    { backgroundColor: rememberMe ? "#6366f1" : "transparent" },
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <GoogleSignInButton style={styles.googleButton} />

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don’t have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/signup" as any);
                }}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#1e293b",
    shadowColor: "#6366f1",
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: { fontSize: 16, textAlign: "center", color: "#94a3b8" },
  formContainer: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(30,41,59,0.85)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#fff",
  },
  inputContainer: {
    marginBottom: 16,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#475569",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 56, fontSize: 16, color: "#fff" },
  eyeButton: { padding: 6 },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#475569",
  },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  checkboxLabel: { fontSize: 14, color: "#fff" },
  forgotPassword: { fontSize: 14, fontWeight: "600", color: "#6366f1" },
  loginButton: {
    height: 56,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  googleButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: { fontSize: 14, color: "#94a3b8" },
  signupLink: { fontSize: 14, fontWeight: "bold", color: "#6366f1" },
});
