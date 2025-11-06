/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Theme = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceAlt: '#e9ecef',
    border: '#dee2e6',
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    accent: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    radius: 8,
    gradient: {
      primary: ['#0d6efd', '#6610f2'],
      secondary: ['#6f42c1', '#0d6efd'],
      accent: ['#fd7e14', '#dc3545'],
      surface: ['#f8f9fa', '#e9ecef'],
      glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    },
    shadow: {
      soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      strong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
    },
  },
  dark: {
    // Aligned with website's dark-dawn palette (HSL-based design translated to hex)
    background: '#0e1012', // hsl(240 8% 6%)
    surface: '#15171a', // hsl(240 8% 9%)
    surfaceAlt: '#1e2024', // slightly lighter than surface
    border: '#2a2d34', // hsl(245 10% 18%)
    textPrimary: '#ECEDEE', // hsl(240 6% 95%)
    textSecondary: '#A3A7AD', // hsl(240 5% ~65%)
    accent: '#9B5CFB', // primary: hsl(265 85% 65%)
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    radius: 12,
    gradient: {
      // primary: purple to electric blue
      primary: ['#9B5CFB', '#34B9FF'], // hsl(265 85% 65%) → hsl(210 95% 60%)
      secondary: ['#242033', '#17181c'], // deep muted purple tones
      accent: ['#9B5CFB', '#34B9FF'],
      surface: ['#15171a', '#1e2024'],
      glass: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)'],
    },
    shadow: {
      soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
      strong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
      },
      // Additional glow-like shadows to emulate web design glows
      glowPrimary: {
        shadowColor: 'rgba(155, 92, 251, 0.25)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 0,
      },
      glowAccent: {
        shadowColor: 'rgba(52, 185, 255, 0.25)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 0,
      },
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.18)',
    },
  },
};
