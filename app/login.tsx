import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import LoginScreen from './screens/LoginScreen';

export default function LoginPage({ navigation, route }) {
  // Simple router for login and forgot password
  if (route?.name === 'forgot-password') {
    return <ForgotPasswordScreen />;
  }
  return <LoginScreen />;
}