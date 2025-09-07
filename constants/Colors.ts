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
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceAlt: '#252525',
    border: '#333333',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    radius: 12,
    gradient: {
      primary: ['#6366f1', '#8b5cf6'],
      secondary: ['#3b82f6', '#6366f1'],
      accent: ['#f59e0b', '#ef4444'],
      surface: ['#1a1a1a', '#252525'],
      glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
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
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
    },
  },
};
