import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { useQuizzes } from '@/src/services/hooks/useQuizzes';
import { Quiz } from '@/src/features/quizzes/types';
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';

export default function QuizTab() {
  const router = useRouter();
  const { data: quizzes, loading, error, refetch } = useQuizzes();
  const scores = useQuizScoreStore(state => state.scores);

  const renderItem = ({ item }: { item: Quiz }) => {
    const result = scores[String(item.lessonId)];
    const isCompleted = !!result;
    const scorePercent = result ? result.score / result.total : 0;
    const scoreTint =
      scorePercent === 1 ? Colors.success :
      scorePercent >= 0.75 ? Colors.warningDark :
      scorePercent >= 0.5 ? Colors.warning :
      Colors.error;
    const scoreBg =
      scorePercent === 1 ? Colors.successLight :
      scorePercent >= 0.75 ? Colors.warningLight :
      scorePercent >= 0.5 ? Colors.warningLight :
      '#FEE2E2';

    return (
      <TouchableOpacity
        style={[styles.card, isCompleted && { borderColor: scoreTint }]}
        onPress={() => router.push(`/quiz/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, isCompleted && { backgroundColor: scoreBg }]}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'barbell-outline'}
            size={28}
            color={isCompleted ? scoreTint : Colors.primary}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text variant="body" color={Colors.text.primary} weight="semibold" numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text variant="caption" color={Colors.successDark} weight="semibold">Done</Text>
              </View>
            )}
          </View>
          <Text variant="caption" color={Colors.text.secondary} numberOfLines={2}>
            {item.description}
          </Text>
          {isCompleted && (
            <View style={styles.scoreRow}>
              <Text variant="caption" color={scoreTint} weight="semibold">
                {Math.round(scorePercent * 100)}% correct
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title" color={Colors.text.primary}>Quizzes</Text>
        <Text variant="caption" color={Colors.text.muted}>Test your knowledge</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}

      {!!error && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.text.muted} />
          <Text variant="body" color={Colors.text.secondary} style={styles.centered}>
            Could not load quizzes.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text variant="label" color={Colors.primary} weight="medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="school-outline" size={48} color={Colors.text.muted} />
          <Text variant="body" color={Colors.text.muted} style={styles.centered}>
            No quizzes available yet.
          </Text>
        </View>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <FlatList
          data={quizzes}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  centered: { textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cardCompleted: {
    borderColor: Colors.successDark,
  },
  cardIconDone: {
    backgroundColor: Colors.successLight,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    flex: 1,
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.successLight,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
