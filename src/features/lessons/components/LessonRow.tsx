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
  completed?: boolean;
  quizScore?: { score: number; total: number };
  onQuizPress?: () => void;
}

function getScoreColors(scorePercent: number) {
  if (scorePercent === 1) return { tint: Colors.success, bg: Colors.successLight };
  if (scorePercent >= 0.75) return { tint: Colors.warningDark, bg: Colors.warningLight };
  if (scorePercent >= 0.5) return { tint: Colors.warning, bg: Colors.warningLight };
  return { tint: Colors.error, bg: '#FEE2E2' };
}

export function LessonRow({ lesson, onPress, completed = false, quizScore, onQuizPress }: LessonRowProps) {
  const levelVariant = lesson.level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced';
  const hasScore = !!quizScore;
  const scorePercent = hasScore ? quizScore.score / quizScore.total : 0;
  const { tint, bg } = hasScore ? getScoreColors(scorePercent) : { tint: Colors.border, bg: 'transparent' };

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(lesson)} activeOpacity={0.7}>
      <TouchableOpacity
        onPress={onQuizPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.iconWrap,
          hasScore
            ? { backgroundColor: bg, borderColor: tint, borderWidth: 2 }
            : styles.iconWrapEmpty,
        ]}
      >
        {completed && (
          <Ionicons
            name="checkmark"
            size={18}
            color={hasScore ? tint : Colors.successDark}
          />
        )}
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapEmpty: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
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
