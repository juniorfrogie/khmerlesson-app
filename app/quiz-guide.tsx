import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, Spacing, Radius } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';

const SCORE_LEGEND = [
  { color: Colors.error, label: 'Red: 0–50%' },
  { color: Colors.warning, label: 'Yellow: 50–75%' },
  { color: Colors.info, label: 'Blue: 75–99%' },
  { color: Colors.success, label: 'Green: 100%' },
];

export default function QuizGuideScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Quiz Guide', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            Once you&apos;ve completed a lesson, you&apos;ll be taken directly to that lesson&apos;s quiz. Alternatively, you can access all quizzes at the bottom of the app.
          </Text>

          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            After finishing each quiz, your progress will be displayed in color, both within the lesson and on the quiz itself:
          </Text>

          <View style={styles.legendCard}>
            {SCORE_LEGEND.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text variant="body" color={Colors.text.primary}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            Every time you open the app, you&apos;ll be taken directly to your most recent lesson.
          </Text>

          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            If you want to delete all progress, simply delete the app from your mobile device and reinstall it.
          </Text>

          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            If you have any questions, spot any mistakes, or have ideas for improvement, please don&apos;t hesitate to contact us.
          </Text>

          <Text variant="body" color={Colors.text.primary} style={styles.paragraph}>
            Now we wish you great success learning Khmer with Khmerlessons.com — our complete learning system!
          </Text>
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
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  paragraph: {
    lineHeight: 26,
  },
  legendCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
  },
});
