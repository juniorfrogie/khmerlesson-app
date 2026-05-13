import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 6, color = Colors.primary }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color, height, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
  },
});
