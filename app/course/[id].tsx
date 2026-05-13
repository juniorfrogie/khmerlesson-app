import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Badge } from '@/src/shared/components/Badge';
import { LessonRow } from '@/src/features/lessons/components/LessonRow';
import { useCourseLessons } from '@/src/services/hooks/useCourseLessons';
import { useCourses } from '@/src/services/hooks/useCourses';
import type { Lesson } from '@/src/features/lessons/types';

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const courseId = id ? Number(id) : null;

  const { courses } = useCourses();
  const { lessons, loading, error } = useCourseLessons(courseId);

  const course = courses.find(c => c.id === courseId);

  const handleLessonPress = (lesson: Lesson) => {
    router.push(`/lesson/${lesson.id}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: course?.title ?? 'Course', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: Colors.primary }]}>
            {course && <View style={styles.badgeRow}><Badge variant={course.isFree ? 'free' : 'premium'} /></View>}
            <Text variant="title" color={Colors.text.inverse} style={styles.courseTitle}>
              {course?.title ?? ''}
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.7)">
              {course?.description ?? ''}
            </Text>
          </View>

          <View style={styles.lessonCard}>
            <View style={styles.lessonCardHeader}>
              <Text variant="subtitle">Lessons</Text>
            </View>

            {loading && (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            )}

            {error && (
              <View style={styles.message}>
                <Text variant="caption" color={Colors.error}>{error}</Text>
              </View>
            )}

            {!loading && !error && lessons.length === 0 && (
              <View style={styles.message}>
                <Text variant="caption" color={Colors.text.muted}>No lessons available yet.</Text>
              </View>
            )}

            {!loading && !error && lessons.map(lesson => (
              <LessonRow key={lesson.id} lesson={lesson} onPress={handleLessonPress} />
            ))}
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
  lessonCard: {
    backgroundColor: Colors.background,
    margin: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  lessonCardHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  loader: {
    padding: Spacing.xl,
  },
  message: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
});
