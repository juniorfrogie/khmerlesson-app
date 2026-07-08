import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, Spacing } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';

const PARAGRAPHS = [
  'We are delighted to present our playful Khmer learning app. Learning Khmer has never been easier. Finally, a vocabulary trainer for learning to read and listen easily.',
  'Simply play for a few minutes every day, whenever and wherever you want, and your success will surprise you.',
  'This app is also a brilliant complement to the professional Khmer language school with the bestsellers "Learn Cambodian Everyday" from Khmerlessons and was developed as a fast-learning course or as additional training to the book series and live online courses from Khmerlessons.',
  'Please note that the original book series contains additional information, grammar, and exercises. We also recommend learning Khmer with the books and with our professional live teachers.',
  "I, Martin H., am proud to have created this app together with Sraymon and Dara Hok (Khmerlessons) and I'm looking forward to using it, as I'm currently learning Khmer myself.",
  'And finally, a huge thank you to our programming expert Voneat and her team.',
  "You can find the instructions in the menu Quiz Guide or simply try it out.",
  "So let's begin…",
];

export default function WelcomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Welcome', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {PARAGRAPHS.map((p, i) => (
              <Text key={i} variant="body" color={Colors.text.primary} style={styles.paragraph}>
                {p}
              </Text>
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
  scroll: {
    padding: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
  },
  paragraph: {
    lineHeight: 26,
  },
});
