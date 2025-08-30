import { AuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
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

    const redirectUri = makeRedirectUri({ scheme: 'interviewx'});

    const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const nonce = bytesToHex(await Crypto.getRandomBytesAsync(16));
    const state = bytesToHex(await Crypto.getRandomBytesAsync(16));

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    } as const;

    const request = new AuthRequest({
      clientId,
      responseType: ResponseType.IdToken,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      extraParams: { nonce, prompt: 'select_account', state },
    });

    await request.makeAuthUrlAsync(discovery);
    const promptOptions = Platform.OS !== 'web' ? ({ useProxy: true } as any) : undefined;
    const result = await request.promptAsync(discovery, promptOptions);

    if (result.type !== 'success') {
      return { success: false, error: 'Google Sign-In was cancelled.' };
    }

    const idToken = (result.params as any)?.id_token || (result as any)?.authentication?.idToken;
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