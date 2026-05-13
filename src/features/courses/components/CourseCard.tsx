import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import type { Course } from '../types';
import { getImageUrl } from '@/src/shared/utils/image';

interface CourseCardProps {
  course: Course;
  onPress: (course: Course) => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const isLocked = !course.isFree && !course.hasPurchased;

  return (
    <TouchableOpacity
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={() => onPress(course)}
      activeOpacity={0.88}
    >
      {/* Portrait thumbnail */}
      <View style={styles.thumbnailWrap}>
        <Image
          source={
            course.thumbnailUrl
              ? getImageUrl(course.thumbnailUrl)
              : require('@/assets/images/book-cover.png')
          }
          style={[styles.thumbnail, isLocked && styles.thumbnailLocked]}
          contentFit="cover"
        />
        {/* price / lock badge */}
        {isLocked && (
          <View style={styles.badgeOverlay}>
            <Ionicons name="lock-closed" size={11} color={Colors.info} />
            {course.price != null && (
              <Text style={styles.price}>{course.price}</Text>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topGroup}>
          {/* Title */}
          <Text
            variant="subtitle"
            numberOfLines={2}
            style={styles.title}
            color={isLocked ? Colors.text.muted : Colors.text.primary}
          >
            {course.title}
          </Text>

          {/* Description */}
          <Text variant="caption" color={Colors.text.muted} numberOfLines={2} style={styles.description}>
            {course.description}
          </Text>

          {/* Lesson count below description */}
          {course.lessonCount != null && (
            <View style={[styles.metaRow, styles.lessonsRow]}>
              <Ionicons
                name="book-outline"
                size={12}
                color={isLocked ? Colors.text.muted : Colors.text.secondary}
              />
              <Text variant="label" color={isLocked ? Colors.text.muted : Colors.text.secondary}>
                {course.lessonCount} lessons
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 150,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  cardLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
    opacity: 0.90,
  },
  thumbnailWrap: {
    width: 110,
    height: 150,
  },
  thumbnail: {
    width: 110,
    height: 150,
  },
  thumbnailLocked: {
    opacity: 0.76,
  },
  badgeOverlay: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'space-between',
  },
  topGroup: {
    gap: Spacing.xs,
  },
  title: {
    lineHeight: 26,
  },
  description: {
    marginTop: 2,
  },
  lessonsRow: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    // color: '#fff',
    color: Colors.info,
  },
  purchasedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
});
