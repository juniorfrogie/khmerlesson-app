import { ScrollView, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { friendlyError } from '@/src/shared/utils/error';
import { Image } from 'expo-image';
import { Colors, Spacing, Radius, Shadow } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { CourseCard } from '@/src/features/courses/components/CourseCard';
import { useCourses } from '@/src/services/hooks/useCourses';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';
import { getImageUrl } from '@/src/shared/utils/image';
import type { Course } from '@/src/features/courses/types';

export default function HomeScreen() {
  const router = useRouter();
  const { courses, loading, error, refetch } = useCourses();
  const lastAccessed = useProgressStore(s => s.lastAccessed);
  const isFirstFocus = useRef(true);

  // Prefetch all thumbnails as soon as course data arrives so images are
  // already in the disk cache when the user scrolls or opens a course.
  useEffect(() => {
    const urls = courses
      .map(c => getImageUrl(c.thumbnailUrl))
      .filter((url): url is string => typeof url === 'string');
    if (urls.length > 0) Image.prefetch(urls);
  }, [courses]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="caption" color={Colors.text.secondary}>ជម្រាបសួរ 👋</Text>
          <Text variant="title">Keep Learning Khmer</Text>
        </View>

        {lastAccessed && (
          <View style={styles.section}>
            <Text variant="subtitle">Continue Learning</Text>
            <TouchableOpacity
              style={styles.continueCard}
              activeOpacity={0.85}
              onPress={() => router.push({
                pathname: '/lesson/[id]',
                params: {
                  id: String(lastAccessed.lessonId),
                  courseId: String(lastAccessed.courseId),
                  courseTitle: lastAccessed.courseTitle,
                },
              })}
            >
              <View style={styles.continueIconWrap}>
                <Ionicons name="book-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.continueInfo}>
                <Text variant="label" color={Colors.text.muted} numberOfLines={1}>
                  {lastAccessed.courseTitle}
                </Text>
                <Text variant="body" weight="medium" numberOfLines={1}>
                  {lastAccessed.lessonTitle}
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="subtitle">All Courses</Text>

          {loading && (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          )}

          {error && (() => {
            const { message, isOffline } = friendlyError(error);
            return (
              <View style={styles.errorState}>
                <Ionicons
                  name={isOffline ? 'wifi-outline' : 'alert-circle-outline'}
                  size={32}
                  color={Colors.text.muted}
                />
                <Text variant="caption" color={Colors.text.secondary} style={styles.errorMsg}>
                  {message}
                </Text>
                <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
                  <Text variant="label" color={Colors.primary} weight="medium">Try Again</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {!loading && !error && (
            <View style={styles.list}>
              {courses.map(course => (
                <CourseCard key={course.id} course={course} onPress={handleCoursePress} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  section: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  list: {
    gap: Spacing.md,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  errorState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  errorMsg: {
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  continueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueInfo: {
    flex: 1,
    gap: 2,
  },
});
