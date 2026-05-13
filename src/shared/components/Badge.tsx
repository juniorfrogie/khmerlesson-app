import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { Text } from './Text';

export type BadgeVariant = 'free' | 'premium' | 'beginner' | 'intermediate' | 'advanced';

const badgeConfig: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  free:         { bg: Colors.successLight, color: Colors.successDark,  label: 'Free' },
  premium:      { bg: Colors.warningLight, color: Colors.warningDark,  label: 'Premium' },
  beginner:     { bg: Colors.infoLight,    color: Colors.infoDark,     label: 'Beginner' },
  intermediate: { bg: Colors.warningLight, color: Colors.warningDark,  label: 'Intermediate' },
  advanced:     { bg: Colors.purpleLight,  color: Colors.purpleDark,   label: 'Advanced' },
};

interface BadgeProps {
  variant: BadgeVariant;
}

export function Badge({ variant }: BadgeProps) {
  const config = badgeConfig[variant];
  if (!config) return null;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text variant="label" color={config.color} weight="semibold">{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
});
