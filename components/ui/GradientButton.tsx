import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../../constants/Colors';

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  colors?: readonly [string, string];
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  leftIcon?: React.ReactNode;
};

export default function GradientButton({ label, onPress, colors, style, labelStyle, leftIcon }: GradientButtonProps) {
  const primary = Theme.dark.gradient.primary as unknown as string[];
  const gradientColors = (colors ?? [primary[0], primary[1]]) as readonly [string, string];
  return (
    <Pressable style={[styles.button, style]} onPress={onPress} android_ripple={{ color: '#ffffff20' }}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        {leftIcon}
        <Text style={[styles.label, labelStyle]}>{label}</Text>
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
    gap: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});


