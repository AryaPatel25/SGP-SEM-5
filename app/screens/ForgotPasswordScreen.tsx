import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
// import { useTheme } from '../../src/context/ThemeContext'; // Unused for now

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading } = useAuth();
  // const { theme, isDarkMode } = useTheme(); // Unused for now
  const [email, setEmail] = useState('');
  // const [emailFocused, setEmailFocused] = useState(false); // Unused for now
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setStatusMessage(null);
    setStatusType(null);
    if (!email) {
      setStatusMessage('Please enter your email address');
      setStatusType('error');
      return;
    }
    if (!validateEmail(email)) {
      setStatusMessage('Please enter a valid email address');
      setStatusType('error');
      return;
    }
    try {
      console.log('Attempting password reset for email:', email);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const msg = await forgotPassword(email);
      console.log('Password reset successful:', msg);
      setStatusMessage(msg);
      setStatusType('success');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setStatusMessage(error.message || 'Please try again');
      setStatusType('error');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>AI</Text>
            </View>
            <Text style={styles.appTitle}>Job Interview Trainer</Text>
            <Text style={styles.subtitle}>Reset your password</Text>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Forgot Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#666"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setStatusMessage(null);
                  setStatusType(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
            {/* Status Message */}
            {statusMessage && (
              <Text style={{
                color: statusType === 'success' ? '#22c55e' : '#ef4444',
                textAlign: 'center',
                marginBottom: 8,
                fontWeight: 'bold',
              }}>
                {statusMessage}
              </Text>
            )}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/login');
              }}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#4f46e5',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#94a3b8',
  },
  formContainer: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#0f172a',
  },
  resetButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 8,
  },
  backToLoginText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});