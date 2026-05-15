import { ScrollView, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { friendlyError } from '@/src/shared/utils/error';
import { Colors, Spacing, Radius } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Button } from '@/src/shared/components/Button';
import { Badge } from '@/src/shared/components/Badge';
import { LessonRow } from '@/src/features/lessons/components/LessonRow';
import { useCourseLessons } from '@/src/services/hooks/useCourseLessons';
import { useCourses } from '@/src/services/hooks/useCourses';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';
import type { Lesson } from '@/src/features/lessons/types';

export default function CourseScreen() {
  const { id, purchased } = useLocalSearchParams<{ id: string; purchased?: string }>();
  const router = useRouter();
  const courseId = id && !isNaN(Number(id)) ? Number(id) : null;

  const { courses, refetch } = useCourses();
  const { lessons, loading, error, forbidden, refetch: refetchLessons } = useCourseLessons(courseId);
  const completedInCourse = useProgressStore(s => s.completedLessons[courseId ?? -1]) ?? [];

  const [purchasedLocally, setPurchasedLocally] = useState(purchased === '1');

  useFocusEffect(
    useCallback(() => {
      if (purchased === '1') {
        setPurchasedLocally(true);
        refetch();
        refetchLessons();
      }
    }, [purchased, refetch, refetchLessons]),
  );

  const baseCourse = courses.find(c => c.id === courseId);
  const course = baseCourse
    ? { ...baseCourse, hasPurchased: baseCourse.hasPurchased || purchasedLocally }
    : null;

  const isLocked = (course ? !course.isFree && !course.hasPurchased : false) || forbidden;

  const handleLessonPress = (lesson: Lesson) => {
    router.push({
      pathname: '/lesson/[id]',
      params: {
        id: String(lesson.id),
        courseId: String(courseId ?? ''),
        courseTitle: course?.title ?? '',
      },
    });
  };

  const handleUnlock = () => {
    if (!course) return;
    router.push({
      pathname: '/course/purchase',
      params: {
        courseId: String(course.id),
        productId: course.productId ?? '',
        title: course.title,
        price: course.price != null ? String(course.price) : '',
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: course?.title ?? 'Course', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Success banner */}
          {purchasedLocally && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
              <Text variant="label" color={Colors.successDark}>
                Purchase successful! You now have full access.
              </Text>
            </View>
          )}

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: Colors.primary }]}>
            {course && (
              <View style={styles.badgeRow}>
                <Badge variant={course.isFree ? 'free' : 'premium'} />
              </View>
            )}
            <Text variant="title" color={Colors.text.inverse} style={styles.courseTitle}>
              {course?.title ?? ''}
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.7)">
              {course?.description ?? ''}
            </Text>
          </View>

          {/* Unlock CTA (shown when locked) */}
          {isLocked && (
            <View style={styles.unlockBanner}>
              <View style={styles.unlockBannerText}>
                <Text variant="subtitle">Unlock this course</Text>
                {course?.price != null && (
                  <Text variant="caption" color={Colors.text.secondary}>
                    One-time purchase · {course.price}
                  </Text>
                )}
              </View>
              <Button variant="primary" size="md" onPress={handleUnlock}>
                Unlock
              </Button>
            </View>
          )}

          {/* Lesson list */}
          <View style={styles.lessonCard}>
            <View style={styles.lessonCardHeader}>
              <Text variant="subtitle">Lessons</Text>
              {isLocked && (
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={12} color={Colors.text.muted} />
                  <Text variant="label" color={Colors.text.muted}>Locked</Text>
                </View>
              )}
            </View>

            {loading && (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            )}

            {error && !forbidden && (() => {
              const { message, isOffline } = friendlyError(error);
              return (
                <View style={styles.errorState}>
                  <Ionicons
                    name={isOffline ? 'wifi-outline' : 'alert-circle-outline'}
                    size={28}
                    color={Colors.text.muted}
                  />
                  <Text variant="caption" color={Colors.text.secondary} style={styles.errorMsg}>
                    {message}
                  </Text>
                  <TouchableOpacity onPress={refetchLessons} style={styles.retryBtn}>
                    <Text variant="label" color={Colors.primary} weight="medium">Try Again</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {!loading && !error && lessons.length === 0 && (
              <View style={styles.message}>
                <Text variant="caption" color={Colors.text.muted}>No lessons available yet.</Text>
              </View>
            )}

            {!loading && !error && lessons.map(lesson => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onPress={isLocked ? () => { } : handleLessonPress}
                completed={completedInCourse.includes(lesson.id)}
              />
            ))}

            {/* Locked overlay CTA */}
            {!loading && !error && lessons.length > 0 && isLocked && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed-outline" size={28} color={Colors.text.muted} />
                <Text variant="body" color={Colors.text.secondary} style={styles.lockedOverlayText}>
                  Purchase this course to access all lessons
                </Text>
                <Button variant="primary" size="md" onPress={handleUnlock}>
                  Unlock Course
                </Button>
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.success,
  },
  hero: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  courseTitle: {
    marginTop: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  unlockBannerText: {
    flex: 1,
    gap: 2,
  },
  lessonCard: {
    backgroundColor: Colors.background,
    margin: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  lessonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loader: {
    padding: Spacing.xl,
  },
  message: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  lockedOverlay: {
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lockedOverlayText: {
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
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
});
