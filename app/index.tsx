import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/shared/theme';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((value) => {

      //if (value) {
      //router.replace('/(tabs)');
      //} else {
      router.replace('/onboarding');
      //}
    });
  }, []);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
