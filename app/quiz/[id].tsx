import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, FontSize } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { useQuizDetail } from '@/src/services/hooks/useQuizDetail';
import { playTTS, stopTTS } from '@/src/features/lessons/service/ttsService';
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const quizId = id ? Number(id) : null;
  const { quiz, loading, error } = useQuizDetail(quizId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [speakingQuestion, setSpeakingQuestion] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    stopTTS();
    setSpeakingQuestion(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => stopTTS();
  }, []);

  useEffect(() => {
    if (!showResult || !quiz) return;
    useQuizScoreStore.getState().setScore(String(quiz.lessonId), correctCount, total);
  }, [showResult]);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const question = questions[currentIndex];
  const isLast = currentIndex === total - 1;

  const speakQuestion = async () => {
    if (!question) return;
    if (speakingQuestion) {
      stopTTS();
      setSpeakingQuestion(false);
      return;
    }
    setSpeakingQuestion(true);
    try {
      const player = await playTTS(question.question);
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setSpeakingQuestion(false);
          player.remove();
        }
      });
    } catch {
      setSpeakingQuestion(false);
    }
  };

  const handleSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === question.correctAnswer) {
      setCorrectCount(c => c + 1);
    }
  };

  const handleNext = () => {
    if (isLast) { setShowResult(true); return; }
    Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleRetry = () => {
    opacity.setValue(1);
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setShowResult(false);
  };

  const getOptionStyle = (option: string) => {
    if (!selectedOption) return styles.optionDefault;
    if (option === question.correctAnswer) return styles.optionCorrect;
    if (option === selectedOption) return styles.optionWrong;
    return styles.optionDefault;
  };

  const getOptionTextColor = (option: string): string => {
    if (!selectedOption) return Colors.text.primary;
    if (option === question.correctAnswer) return Colors.successDark;
    if (option === selectedOption) return Colors.error;
    return Colors.text.muted;
  };

  const scorePercent = total > 0 ? correctCount / total : 0;
  const resultMessage =
    scorePercent === 1 ? 'Perfect score!' :
      scorePercent >= 0.8 ? 'Great work!' :
        scorePercent >= 0.6 ? 'Good effort!' :
          'Keep practicing!';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
          {!showResult && !loading && !error && total > 0 && (
            <>
              <View style={styles.progressWrap}>
                <ProgressBar progress={(currentIndex + 1) / total} height={8} color={Colors.primary} />
              </View>
              <Text variant="label" color={Colors.text.muted}>{currentIndex + 1}/{total}</Text>
            </>
          )}
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
              Could not load quiz.
            </Text>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()}>
              <Text variant="label" color={Colors.primary} weight="medium">Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {showResult && (
          <Animated.View style={[styles.resultWrap, { opacity }]}>
            <View style={styles.resultCard}>
              <Ionicons
                name={scorePercent >= 0.8 ? 'trophy-outline' : 'school-outline'}
                size={56}
                color={scorePercent >= 0.8 ? Colors.warning : Colors.primary}
              />
              <Text variant="hero" color={Colors.text.primary} weight="bold">
                {correctCount} / {total}
              </Text>
              <Text variant="subtitle" color={Colors.text.secondary}>
                {resultMessage}
              </Text>
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
                <Text variant="body" color={Colors.primary} weight="medium">Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                <Text variant="body" color={Colors.text.inverse} weight="semibold">Done</Text>
                <Ionicons name="checkmark-circle" size={18} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {!loading && !error && !showResult && question && (
          <>
            <Animated.View style={[styles.cardWrap, { opacity }]}>
              <ScrollView
                style={styles.card}
                contentContainerStyle={styles.cardContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.stepPill}>
                    <Text variant="label" color={Colors.primary}>
                      Question {String(currentIndex + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={speakQuestion}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.ttsBtn}
                  >
                    <Ionicons
                      name={speakingQuestion ? 'volume-high' : 'volume-high-outline'}
                      size={20}
                      color={speakingQuestion ? Colors.primaryLight : Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <Text
                  variant="subtitle"
                  color={Colors.text.primary}
                  style={styles.questionText}
                >
                  {question.question}
                </Text>
                <View style={styles.divider} />
                <View style={styles.optionsList}>
                  {question.options.map((option, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.optionBase, getOptionStyle(option)]}
                      onPress={() => handleSelect(option)}
                      activeOpacity={selectedOption ? 1 : 0.7}
                    >
                      <Text
                        variant="body"
                        color={getOptionTextColor(option)}
                        weight={selectedOption && option === question.correctAnswer ? 'semibold' : 'regular'}
                        style={styles.optionText}
                      >
                        {option}
                      </Text>
                      {selectedOption && option === question.correctAnswer && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
                      )}
                      {selectedOption && option === selectedOption && option !== question.correctAnswer && (
                        <Ionicons name="close-circle" size={18} color={Colors.error} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>

            {!!selectedOption && (
              <View style={styles.nav}>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text variant="body" color={Colors.text.inverse} weight="semibold">
                    {isLast ? 'See Results' : 'Next'}
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
  safe: { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  progressWrap: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  centered: { textAlign: 'center' },
  outlineBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  ttsBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
  },
  questionText: {
    paddingTop: Spacing.sm,
    lineHeight: FontSize.lg * 1.6,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  optionsList: { gap: Spacing.sm },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  optionText: { flex: 1 },
  optionDefault: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  optionCorrect: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successDark,
  },
  optionWrong: {
    backgroundColor: Colors.surface,
    borderColor: Colors.error,
  },
  nav: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  resultWrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.md,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
});
