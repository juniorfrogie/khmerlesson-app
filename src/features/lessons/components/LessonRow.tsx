import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Badge } from '@/src/shared/components/Badge';
import type { Lesson } from '../types';

interface LessonRowProps {
  lesson: Lesson;
  onPress: (lesson: Lesson) => void;
}

export function LessonRow({ lesson, onPress }: LessonRowProps) {
  const levelVariant = lesson.level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced';

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(lesson)} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Ionicons name="book-outline" size={18} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text variant="body" weight="medium">{lesson.title}</Text>
        <Text variant="caption" color={Colors.text.secondary} numberOfLines={2}>
          {lesson.description}
        </Text>
        <View style={styles.badgeRow}>
          <Badge variant={levelVariant} />
        </View>
        {/* 
        <View style={styles.stepPill}>
          <Text variant='caption' color={Colors.text.secondary}>{lesson.type}</Text>
        </View> */}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md + 4,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
});
