import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

interface GoogleSignInButtonProps {
  onPress?: () => void;
  style?: any;
  textStyle?: any;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onPress, 
  style, 
  textStyle 
}) => {
  const { signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    console.log('Google Sign-In button clicked');
    try {
      console.log('Calling signInWithGoogle...');
      await signInWithGoogle();
      console.log('signInWithGoogle completed successfully');
      
      // AuthGuard will handle navigation automatically
      
      if (onPress) {
        onPress();
      }
    } catch (error: any) {
      console.error('Google Sign-In Error in button:', error);
      Alert.alert('Google Sign-In', 'Google Sign-In is not available yet. Please use email/password to sign in.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      <Text style={[styles.text, textStyle]}>
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { GoogleSignInButton };
export default GoogleSignInButton; 