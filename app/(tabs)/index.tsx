import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Colors, Spacing } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { CourseCard } from '@/src/features/courses/components/CourseCard';
import { useCourses } from '@/src/services/hooks/useCourses';
import type { Course } from '@/src/features/courses/types';

export default function HomeScreen() {
  const router = useRouter();
  const { courses, loading, error, refetch } = useCourses();
  const isFirstFocus = useRef(true);

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

        <View style={styles.section}>
          <Text variant="subtitle">All Courses</Text>

          {loading && (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          )}

          {error && (
            <Text variant="caption" color={Colors.error} style={styles.errorText}>
              {error}
            </Text>
          )}

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
  errorText: {
    marginTop: Spacing.md,
  },
});
