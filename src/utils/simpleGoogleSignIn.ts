import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../../firebase/firebaseConfig';

export interface GoogleSignInResult {
  success: boolean;
  user?: any;
  error?: string;
}

function getGoogleClientId(useProxy: boolean): string {
  const extra = (Constants.expoConfig as any)?.extra ?? {};

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAndroidClientId;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId;

  // When using the Expo AuthSession proxy (native), a Web client ID works well
  if (useProxy && webClientId) return webClientId;

  if (Platform.OS === 'ios' && iosClientId) return iosClientId;
  if (Platform.OS === 'android' && androidClientId) return androidClientId;
  if (webClientId) return webClientId;

  throw new Error('Missing Google OAuth client IDs. Provide EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and optionally platform-specific IDs).');
}

export const simpleGoogleSignIn = async (): Promise<GoogleSignInResult> => {
  try {
    WebBrowser.maybeCompleteAuthSession();
    const useProxy = Platform.OS !== 'web';
    const clientId = getGoogleClientId(useProxy);

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'interviewx'});

    const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const nonce = bytesToHex(await Crypto.getRandomBytesAsync(16));
    const state = bytesToHex(await Crypto.getRandomBytesAsync(16));

    const queryParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid profile email',
      include_granted_scopes: 'true',
      prompt: 'select_account',
      state,
      nonce,
    });

    const authorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
    const authUrl = `${authorizationEndpoint}?${queryParams.toString()}`;

    // startAsync API signature differs by platform/SDK; keep a conservative call
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = await (AuthSession as any).startAsync({ authUrl, returnUrl: redirectUri });

    if (result.type !== 'success') {
      return { success: false, error: 'Google Sign-In was cancelled.' };
    }

    const idToken = (result.params as any)?.id_token;
    if (!idToken) {
      return { success: false, error: 'Google ID token not returned.' };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    let errorMessage = error?.message || 'Google Sign-In failed. Please try again.';
    return { success: false, error: errorMessage };
  }
};

// No-op to keep API compatibility; AuthSession flow returns immediately
export const handleRedirectResult = async (): Promise<GoogleSignInResult> => {
  return { success: false, error: 'No redirect handling required.' };
};