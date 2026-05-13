import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text variant="title">Modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text variant="body" color={Colors.primary}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  link: {
    marginTop: Spacing.md,
  },
});
