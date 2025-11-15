// components/ui/GradientButton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Theme } from '../../constants/Colors';

export type GradientButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  colors?: readonly [string, string];
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
};

export default function GradientButton({
  label,
  onPress,
  colors,
  style,
  labelStyle,
  leftIcon,
  disabled = false,
  loading = false,
}: GradientButtonProps) {
  const primary = Theme.dark.gradient.primary as unknown as string[];
  const gradientColors = (colors ?? [primary[0], primary[1]]) as readonly [string, string];

  const handlePress = () => {
    if (disabled || loading) return;
    void onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: '#ffffff20' }}
      style={({ pressed }) => [
        styles.button,
        style,
        disabled && styles.disabled,
        pressed && !disabled ? styles.pressed : undefined,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
    >
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, labelStyle]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Theme.dark.radius,
    overflow: 'hidden',
    ...Theme.dark.shadow.medium,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconWrapper: {
    marginRight: 8, // replaces 'gap'
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
});
