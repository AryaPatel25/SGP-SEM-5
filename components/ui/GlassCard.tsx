import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from '../../constants/Colors';

type GlassCardProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>;

export default function GlassCard({ children, style }: GlassCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.dark.glass.background,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
    borderRadius: Theme.dark.radius,
    padding: 16,
    ...Theme.dark.shadow.soft,
  },
});











