import { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { CourseCard } from '@/src/features/courses/components/CourseCard';
import { useCourses } from '@/src/services/hooks/useCourses';
import type { Course } from '@/src/features/courses/types';

type Filter = 'all' | 'free' | 'premium';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'premium', label: 'Premium' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const { courses, loading, error } = useCourses();

  const filtered =
    activeFilter === 'all' ? courses :
      activeFilter === 'free' ? courses.filter(c => c.isFree) :
        courses.filter(c => !c.isFree);

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Browse Courses</Text>
        {!loading && (
          <Text variant="caption" color={Colors.text.secondary}>
            {courses.length} courses available
          </Text>
        )}
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activeFilter === f.key && styles.chipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                weight="semibold"
                color={activeFilter === f.key ? Colors.text.inverse : Colors.text.secondary}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}

        {error && (
          <Text variant="caption" color={Colors.error}>{error}</Text>
        )}

        {!loading && !error && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text variant="body" color={Colors.text.muted}>No courses found.</Text>
          </View>
        )}

        {!loading && !error && filtered.length > 0 && (
          <View style={styles.list}>
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} onPress={handleCoursePress} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  filterBar: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  list: { gap: Spacing.md },
  loader: { marginTop: Spacing.xl },
  empty: { paddingTop: Spacing.xxl, alignItems: 'center' },
});
