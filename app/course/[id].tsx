import { ScrollView, View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/src/features/auth/store/authStore';
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
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';
import { useQuizzes } from '@/src/services/hooks/useQuizzes';
import type { Lesson } from '@/src/features/lessons/types';

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const courseId = id && !isNaN(Number(id)) ? Number(id) : null;

  const isGuest = useAuthStore(s => s.isGuest);
  const { courses, refetch } = useCourses();
  const { lessons, loading, error, forbidden, forbiddenReason, refetch: refetchLessons } = useCourseLessons(courseId);
  const completedInCourse = useProgressStore(s => s.completedLessons[courseId ?? -1]) ?? [];
  const quizScores = useQuizScoreStore(s => s.scores);
  const { data: allQuizzes } = useQuizzes();
  const quizByLesson = Object.fromEntries(allQuizzes.map(q => [q.lessonId, q.id]));

  // Always refetch on focus so hasAccess reflects latest state (e.g. after subscribing)
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchLessons();
    }, [refetch, refetchLessons]),
  );

  // Redirect to login when the API tells us the token is missing or expired
  useEffect(() => {
    if (forbiddenReason !== 'tokenExpired') return;
    if (isGuest) {
      Alert.alert(
        'Sign in required',
        'Please sign in to access this content.',
        [{ text: 'Sign In', onPress: () => router.replace('/auth/login') }],
        { cancelable: false },
      );
    } else {
      useAuthStore.getState().signOut();
      router.replace('/auth/login');
    }
  }, [forbiddenReason, isGuest, router]);

  const course = courses.find(c => c.id === courseId) ?? null;
  const isComingSoon = (course?.comingSoon ?? false) || forbiddenReason === 'comingSoon';
  const isLocked = (course ? !course.hasAccess && !isComingSoon : false) || (forbidden && !isComingSoon && forbiddenReason !== 'tokenExpired');

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

  const handleSubscribe = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/subscription' as any);
  };

  return (
    <>
      <Stack.Screen options={{ title: course?.title ?? 'Course', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>

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

          {/* Lock / subscribe banner */}
          {(isLocked || isComingSoon) && (
            <View style={styles.unlockBanner}>
              <View style={styles.unlockBannerText}>
                {isComingSoon ? (
                  <>
                    <Text variant="subtitle">Coming Soon</Text>
                    <Text variant="caption" color={Colors.text.secondary}>
                      This course is not yet available
                    </Text>
                  </>
                ) : (
                  <>
                    <Text variant="subtitle">Subscribe to access</Text>
                    <Text variant="caption" color={Colors.text.secondary}>
                      A subscription gives access to all premium courses
                    </Text>
                  </>
                )}
              </View>
              {!isComingSoon && (
                <Button variant="primary" size="md" onPress={handleSubscribe}>
                  Subscribe
                </Button>
              )}
            </View>
          )}

          {/* Lesson list */}
          <View style={styles.lessonCard}>
            <View style={styles.lessonCardHeader}>
              <Text variant="subtitle">Lessons</Text>
              {(isLocked || isComingSoon) && (
                <View style={styles.lockedTag}>
                  <Ionicons
                    name={isComingSoon ? 'time-outline' : 'lock-closed'}
                    size={12}
                    color={Colors.text.muted}
                  />
                  <Text variant="label" color={Colors.text.muted}>
                    {isComingSoon ? 'Coming Soon' : 'Locked'}
                  </Text>
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

            {!loading && !error && !forbidden && lessons.length === 0 && (
              <View style={styles.message}>
                <Text variant="caption" color={Colors.text.muted}>No lessons available yet.</Text>
              </View>
            )}

            {!loading && !error && lessons.map(lesson => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onPress={(isLocked || isComingSoon) ? () => {} : handleLessonPress}
                completed={completedInCourse.includes(lesson.id)}
                quizScore={quizScores[String(lesson.id)]}
                onQuizPress={quizByLesson[lesson.id]
                  ? () => router.push(`/quiz/${quizByLesson[lesson.id]}`)
                  : undefined
                }
              />
            ))}

            {/* Locked / coming soon overlay */}
            {!loading && (isLocked || isComingSoon) && (
              <View style={styles.lockedOverlay}>
                <Ionicons
                  name={isComingSoon ? 'time-outline' : 'lock-closed-outline'}
                  size={28}
                  color={Colors.text.muted}
                />
                <Text variant="body" color={Colors.text.secondary} style={styles.lockedOverlayText}>
                  {isComingSoon
                    ? 'This course will be available soon'
                    : 'Subscribe to access all lessons'}
                </Text>
                {!isComingSoon && (
                  <Button variant="primary" size="md" onPress={handleSubscribe}>
                    Subscribe
                  </Button>
                )}
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
