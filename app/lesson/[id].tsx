import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';
import { Ionicons } from '@expo/vector-icons';
import { friendlyError } from '@/src/shared/utils/error';
import { Colors, Spacing, Radius, Shadow } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Badge } from '@/src/shared/components/Badge';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { useLessonDetail } from '@/src/services/hooks/useLessonDetail';
// @ts-ignore
import VocabParser from '@/src/shared/utils/vocabParser';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { playTTS, stopTTS } from '@/src/features/lessons/service/ttsService';
import { useQuizByLesson } from '@/src/services/hooks/useQuizByLesson';

interface VocabItem {
  english: string;
  phonemic: string;
  khmer: string;
}

export default function LessonScreen() {
  const { id, courseId: courseIdParam, courseTitle } = useLocalSearchParams<{ id: string; courseId?: string; courseTitle?: string }>();
  const router = useRouter();
  const lessonId = id ? Number(id) : null;
  const courseId = courseIdParam ? Number(courseIdParam) : null;
  const { lesson, loading, error, forbidden, refetch } = useLessonDetail(lessonId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const sections = lesson?.sections ?? [];
  const total = sections.length;
  const section = sections[currentIndex];
  const isLast = currentIndex === total - 1;

  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const { quiz: lessonQuiz } = useQuizByLesson(lessonId);

  useEffect(() => {
    stopTTS();
    setSpeakingIndex(null);
  }, [currentIndex]);

  useEffect(() => {
    return () => { stopTTS(); };
  }, []);

  useEffect(() => {
    if (!lesson || !courseId) return;
    useProgressStore.getState().setLastAccessed({
      courseId,
      lessonId: lesson.id,
      courseTitle: courseTitle ?? '',
      lessonTitle: lesson.title,
    });
  }, [lesson, courseId, courseTitle]);

  const speakKhmer = async (khmer: string, index: number) => {
    if (speakingIndex === index) {
      await stopTTS();
      setSpeakingIndex(null);
      return;
    }
    setSpeakingIndex(index);
    try {
      const sound = await playTTS(khmer);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSpeakingIndex(null);
          sound.unloadAsync();
        }
      });
    } catch {
      setSpeakingIndex(null);
    }
  };

  const goTo = (next: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setCurrentIndex(next);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (isLast) {
      if (courseId && lesson) useProgressStore.getState().markComplete(courseId, lesson.id);
      router.back();
      return;
    }
    goTo(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex === 0) { router.back(); return; }
    goTo(currentIndex - 1);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.progressWrap}>
            <ProgressBar
              progress={total > 0 ? (currentIndex + 1) / total : 0}
              height={8}
              color={Colors.primary}
            />
          </View>
          {total > 0 && (
            <Text variant="label" color={Colors.text.muted}>{currentIndex + 1}/{total}</Text>
          )}
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        )}

        {forbidden && (
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={48} color={Colors.text.muted} />
            <Text variant="body" color={Colors.text.secondary} style={styles.centered}>
              This lesson is available for premium users only.
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color={Colors.text.secondary} />
              <Text variant="body" color={Colors.text.secondary}>Go back</Text>
            </TouchableOpacity>
          </View>
        )}

        {!!error && !forbidden && (() => {
          const { message, isOffline } = friendlyError(error);
          return (
            <View style={styles.center}>
              <Ionicons
                name={isOffline ? 'wifi-outline' : 'alert-circle-outline'}
                size={48}
                color={Colors.text.muted}
              />
              <Text variant="body" color={Colors.text.secondary} style={styles.centered}>
                {message}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                <Text variant="label" color={Colors.primary} weight="medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {!loading && !error && !forbidden && lesson && (
          <>
            <View style={styles.lessonMeta}>
              <Text variant="title">{lesson.title}</Text>
              <View style={styles.metaRow}>
                <Badge variant={lesson.level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced'} />
                {total > 0 && (
                  <Text variant="caption" color={Colors.text.muted}>{total} sections</Text>
                )}
              </View>
            </View>

            {section ? (
              <Animated.View style={[styles.cardWrap, { opacity }]}>
                <ScrollView
                  style={styles.card}
                  contentContainerStyle={styles.cardContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.stepPill}>
                    <Text variant="label" color={Colors.primary}>
                      Section {String(currentIndex + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text variant="subtitle" color={Colors.primary}>{section.title}</Text>
                  <View style={styles.divider} />

                  {section.items?.length ? (
                    <View style={styles.vocabList}>
                      {section.items.map((item: VocabItem, i: number) => (
                        <View key={i} style={styles.vocabCard}>
                          {/* audio function */}
                          <TouchableOpacity
                            style={styles.speakerBtn}
                            onPress={() => speakKhmer(item.khmer, i)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={speakingIndex === i ? 'volume-high' : 'volume-high-outline'}
                              size={18}
                              color={speakingIndex === i ? Colors.primaryLight : Colors.primary}
                            />
                          </TouchableOpacity>
                          <Text variant="subtitle" color={Colors.primary} style={styles.vocabKhmer}>
                            {item.khmer}
                          </Text>
                          <Text variant="label" color={Colors.text.muted} style={styles.vocabPronunciation}>
                            {item.phonemic}
                          </Text>
                          <View style={styles.vocabDivider} />
                          <Text variant="body" color={Colors.text.secondary}>{item.english.replace('*', '').trim()}</Text>
                        </View>
                      ))}
                    </View>
                  ) : section.html ? (
                    <RenderHtml contentWidth={width} source={{ html: section.html }} />
                  ) : (
                    <Text variant="body" color={Colors.text.secondary}>{section.content}</Text>
                  )}
                </ScrollView>
              </Animated.View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="document-text-outline" size={48} color={Colors.text.muted} />
                <Text variant="body" color={Colors.text.muted} style={styles.centered}>No content yet</Text>
              </View>
            )}

            {isLast && lessonQuiz && (
              <TouchableOpacity
                style={styles.quizBanner}
                onPress={() => router.push(`/quiz/${lessonQuiz.id}`)}
              >
                <Ionicons name="barbell-outline" size={20} color={Colors.primary} />
                <Text variant="body" color={Colors.primary} weight="semibold">Take the Quiz</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {total > 0 && (
              <View style={styles.nav}>
                <TouchableOpacity style={styles.backBtn} onPress={handlePrev}>
                  <Ionicons name="arrow-back" size={18} color={Colors.text.secondary} />
                  <Text variant="body" color={Colors.text.secondary}>
                    {currentIndex === 0 ? 'Exit' : 'Back'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text variant="body" color={Colors.text.inverse} weight="semibold">
                    {isLast ? 'Finish' : 'Continue'}
                  </Text>
                  <Ionicons
                    name={isLast ? 'checkmark-circle' : 'arrow-forward'}
                    size={18}
                    color={Colors.text.inverse}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  progressWrap: {
    flex: 1,
  },
  lessonMeta: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardWrap: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  cardContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  centered: {
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
  },
  vocabList: {
    gap: Spacing.sm,
  },
  vocabCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  speakerBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  vocabKhmer: {
    textAlign: 'center',
  },
  vocabPronunciation: {
    textAlign: 'center',
  },
  vocabDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
});
