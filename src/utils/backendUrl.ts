import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveLocalhost(): string {
  // Web and iOS simulator can reach localhost directly
  if (Platform.OS === 'web' || Platform.OS === 'ios') return 'http://localhost:5000';

  // Android emulator maps host via 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';

  return 'http://localhost:5000';
}

export function getBackendBaseUrl(): string {
  // 1) Allow explicit env override if configured
  // @ts-ignore - process.env may be injected by Expo or build tooling
  const envUrl = process.env.BACKEND_URL as string | undefined;
  if (envUrl && /^https?:\/\//.test(envUrl)) return envUrl.replace(/\/$/, '');

  // 2) Try to infer LAN IP from Expo debugger host when available
  const debuggerHost = (Constants as any)?.manifest2?.extra?.expoClient?.developer?.tools?.expoGo?.debuggerHost
    || (Constants as any)?.manifest?.debuggerHost
    || (Constants as any)?.expoConfig?.hostUri
    || '';
  if (typeof debuggerHost === 'string' && debuggerHost.includes(':')) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }

  // 3) Fall back to platform-specific localhost mapping
  return resolveLocalhost();
}

export function buildBackendUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}


