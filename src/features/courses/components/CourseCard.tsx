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
  const isComingSoon = course.comingSoon;
  const isLocked = !course.hasAccess && !isComingSoon;
  const dimmed = isLocked || isComingSoon;

  const card = (
    <View style={[styles.card, dimmed && styles.cardLocked]}>
      <View style={styles.thumbnailWrap}>
        <Image
          source={
            course.thumbnailUrl
              ? getImageUrl(course.thumbnailUrl)
              : require('@/assets/images/book-cover.png')
          }
          placeholder={require('@/assets/images/book-cover.png')}
          style={[styles.thumbnail, dimmed && styles.thumbnailLocked]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        {dimmed && (
          <View style={styles.badgeOverlay}>
            <Ionicons name="lock-closed" size={11} color={Colors.info} />
            {isComingSoon && (
              <Text style={styles.badgeText}>Soon</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topGroup}>
          <Text
            variant="subtitle"
            numberOfLines={2}
            style={styles.title}
            color={dimmed ? Colors.text.muted : Colors.text.primary}
          >
            {course.title}
          </Text>
          <Text variant="caption" color={Colors.text.muted} numberOfLines={2} style={styles.description}>
            {course.description}
          </Text>
          {course.lessonCount != null && (
            <View style={[styles.metaRow, styles.lessonsRow]}>
              <Ionicons
                name="book-outline"
                size={12}
                color={dimmed ? Colors.text.muted : Colors.text.secondary}
              />
              <Text variant="label" color={dimmed ? Colors.text.muted : Colors.text.secondary}>
                {course.lessonCount} lessons
              </Text>
            </View>
          )}
          {isComingSoon && (
            <View style={styles.comingSoonTag}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (isComingSoon) {
    return card;
  }

  return (
    <TouchableOpacity onPress={() => onPress(course)} activeOpacity={0.88}>
      {card}
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
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.info,
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
  comingSoonTag: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  comingSoonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.info,
  },
});
