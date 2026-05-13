import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Button } from '@/src/shared/components/Button';

const { width } = Dimensions.get('window');

export const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

type Slide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  titleKhmer: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'book-outline',
    iconColor: Colors.primary,
    iconBg: Colors.primaryMuted,
    title: 'Welcome to KhmerLesson',
    titleKhmer: 'សូមស្វាគមន៍មកកាន់ KhmerLesson',
    body: 'Learn Khmer vocabulary at your own pace with beautifully designed lessons and flashcards.',
  },
  {
    id: '2',
    icon: 'school-outline',
    iconColor: Colors.purple,
    iconBg: Colors.purpleLight,
    title: 'Browse Courses',
    titleKhmer: 'រុករកវគ្គសិក្សា',
    body: 'Choose from beginner to advanced courses. Start free and unlock premium content as you grow.',
  },
  {
    id: '3',
    icon: 'trophy-outline',
    iconColor: Colors.warning,
    iconBg: Colors.warningLight,
    title: 'Track Your Progress',
    titleKhmer: 'តាមដានវឌ្ឍនភាព',
    body: 'Mark lessons complete and watch your Khmer language skills grow day by day.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(tabs)');
  };

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(tabs)');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={skip} hitSlop={12} style={styles.skipBtn}>
            <Text variant="caption" color={Colors.text.secondary} weight="medium">
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => <SlideItem slide={item} />}
        style={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {isLast ? (
            <Button onPress={finish} variant="primary" size="lg" fullWidth>
              Get Started
            </Button>
          ) : (
            <Button onPress={goNext} variant="primary" size="lg" fullWidth>
              Next
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      <View style={[styles.iconWrap, { backgroundColor: slide.iconBg }]}>
        <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
      </View>
      <Text
        variant="title"
        style={styles.title}
      >
        {slide.title}
      </Text>
      <Text
        variant="caption"
        color={Colors.text.secondary}
        style={styles.khmer}
      >
        {slide.titleKhmer}
      </Text>
      <Text
        variant="body"
        color={Colors.text.secondary}
        style={styles.body}
      >
        {slide.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipRow: {
    height: 44,
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  skipBtn: {
    padding: Spacing.xs,
  },
  list: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  khmer: {
    textAlign: 'center',
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: 28,
  },
  body: {
    textAlign: 'center',
    lineHeight: 26,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  actions: {
    gap: Spacing.sm,
  },
});
