import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, Radius, Shadow } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Badge } from '@/src/shared/components/Badge';
import type { Course } from '../types';
import { getImageUrl } from "@/src/shared/utils/image";

interface CourseCardProps {
  course: Course;
  onPress: (course: Course) => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(course)} activeOpacity={0.9}>
      <View style={styles.row}>
        <Image
          source={course.thumbnailUrl ?? require('@/assets/images/book-cover.png')}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <Badge variant={course.isFree ? 'free' : 'premium'} />
          </View>
          <Text variant="subtitle" numberOfLines={1}>{course.title}</Text>
          <Text variant="caption" color={Colors.text.secondary} numberOfLines={2}>
            {course.description}
          </Text>
          {course.lessonCount != null && (
            <Text variant="label" color={Colors.text.muted}>{course.lessonCount} lessons</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  row: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: '30%',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
  },
});
