import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  TextInput,
  Share,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { Button } from '../../../components/ui/Button';
import { useCookTimer } from '../../../hooks/useCookTimer';
import { useCookQA } from '../../../hooks/useCookQA';
import type { FullRecipe, Step } from '@dishly/types';

const { width } = Dimensions.get('window');

export default function CookModeScreen() {
  useKeepAwake();
  const { id, step } = useLocalSearchParams<{ id: string, step?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const recipe = queryClient.getQueryData<FullRecipe>(['recipe', id]);
  
  if (!recipe || !recipe.steps) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" translucent={false} />
        <Text style={styles.errorText}>Recipe data not found. Please load recipe details first.</Text>
        <Button label="Go Back" variant="primary" onPress={() => router.back()} />
      </View>
    );
  }

  const stepsCount = recipe.steps.length;
  const initialStep = step ? parseInt(step, 10) : 0;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep >= 0 && initialStep < stepsCount ? initialStep : 0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  
  // AI Q&A state
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [aiInputText, setAiInputText] = useState('');
  const { messages, isLoading, ask, getMessagesForStep } = useCookQA(id!);
  const currentStepMessages = getMessagesForStep(currentStepIndex);
  
  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Reset AI panel when step changes
  useEffect(() => {
    setIsAIExpanded(false);
  }, [currentStepIndex]);
  
  // Total elapsed time
  const [totalSeconds, setTotalSeconds] = useState(0);
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTotalSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Current step Timer
  const currentStep = recipe.steps[currentStepIndex];
  const timerDuration = currentStep?.timerSeconds || 0;
  const timer = useCookTimer(timerDuration);

  // Auto-start timer when switching to a step that has a timer
  useEffect(() => {
    if (timerDuration > 0 && !isFinished) {
      timer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, timerDuration, isFinished]);

  // Anim values for spring on completion
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFinished) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isFinished, scaleAnim, opacityAnim]);

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < stepsCount - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Last step next btn -> Finish
      handleDone();
    }
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(currentStepIndex);
      return next;
    });

    if (currentStepIndex < stepsCount - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsFinished(true); // Completed all
    }
  };

  const onSwipe = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) {
        handlePrev();
      } else if (translationX < -50) {
        handleNext();
      }
    }
  };

  const handleAIAsk = async (question: string) => {
    if (question.trim() && !isLoading) {
      await ask(question.trim(), currentStepIndex);
      setAiInputText(''); // Clear input after sending
    }
  };

  if (isFinished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" translucent={false} />
        <Animated.View style={[styles.completionContainer, { 
          opacity: opacityAnim, 
          transform: [{ scale: scaleAnim }] 
        }]}>
          <Image 
            source={{ uri: recipe.hero_image_url || recipe.cover_image_url || '' }} 
            style={styles.completionImage} 
            contentFit="cover"
          />
          <Text style={styles.completionCongrats}>You made it!</Text>
          <Text style={styles.completionTitle}>{recipe.title}</Text>
          
          <Text style={styles.totalTimeText}>
            Total cook time: {Math.floor(totalSeconds / 60)} min
          </Text>

          <Button 
            label="Share your dish" 
            variant="primary" 
            fullWidth
            icon="share"
            style={styles.actionBtn}
            onPress={() => Share.share({ 
              url: `https://dishly.app/recipe/${id}`, 
              title: `I just made ${recipe.title}! 🍽️`,
              message: `Check out this recipe on Dishly: https://dishly.app/recipe/${id}`,
            })}
          />
          <Button 
            label="Rate this recipe" 
            variant="ghost" 
            fullWidth
            icon="rating"
            style={styles.actionBtn}
            onPress={() => Alert.alert(
              'Rate this recipe',
              'How did it turn out?',
              [
                { text: '⭐ Needs work', style: 'default', onPress: () => {} },
                { text: '⭐⭐⭐ Pretty good', style: 'default', onPress: () => {} },
                { text: '⭐⭐⭐⭐⭐ Amazing!', style: 'default', onPress: () => {} },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
          />
          <Button 
            label="Back to recipe" 
            variant="ghost" 
            fullWidth
            style={styles.actionBtn}
            onPress={() => router.back()}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
      <StatusBar style="light" translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <AppIcon name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.stepCounterText}>Step {currentStepIndex + 1} of {stepsCount}</Text>
        
        <View style={styles.dotsRow}>
          {stepsCount <= 5 ? (
            Array.from({ length: stepsCount }).map((_, i) => {
              if (completedSteps.has(i)) {
                return <View key={i} style={[styles.dot, styles.dotFilled]} />;
              } else if (i === currentStepIndex) {
                return <View key={i} style={[styles.dot, styles.dotCurrent]} />;
              }
              return <View key={i} style={styles.dot} />;
            })
          ) : (
            <Text style={styles.counterDotsFallback}>{completedSteps.size} / {stepsCount}</Text>
          )}
        </View>
      </View>

      {/* Progress Bar (thin orange) */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(completedSteps.size / stepsCount) * 100}%` }]} />
      </View>

      {/* Swipeable Content Area */}
      <PanGestureHandler onHandlerStateChange={onSwipe}>
        <View style={styles.contentArea}>
          {currentStep.imageUrl ? (
            <Image 
              source={{ uri: currentStep.imageUrl }} 
              style={styles.stepImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.numberPlaceholder}>
              <Text style={styles.bigNumber}>{currentStepIndex + 1}</Text>
            </View>
          )}

          <View style={styles.instructionScroll}>
            <Text style={styles.instructionText}>{currentStep.instruction}</Text>
          </View>

          {/* Timer Card */}
          {timerDuration > 0 && (
            <View style={styles.timerCard}>
              <View style={styles.timerTop}>
                <View style={styles.timerLabelRow}>
                  <Text style={styles.timerIconText}>⏱</Text>
                  <Text style={[styles.timerValue, timer.finished && { color: COLORS.success }]}>
                    {timer.formatted}
                  </Text>
                </View>
                <TouchableOpacity onPress={timer.running ? timer.pause : timer.start}>
                  <Text style={styles.timerControls}>{timer.running ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
              </View>
              {/* Progress bar style timer */}
              <View style={styles.timerBarBg}>
                <View style={[styles.timerBarFill, { width: `${((timerDuration - timer.remaining) / timerDuration) * 100}%` }]} />
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* AI Q&A Panel */}
          <View style={styles.aiPanelContainer}>
            {/* Collapsed state — only show when no messages for this step */}
            {!isAIExpanded && currentStepMessages.length === 0 && (
              <TouchableOpacity
                style={styles.aiCollapsedPanel}
                onPress={() => setIsAIExpanded(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.aiStar}>★</Text>
                <Text style={styles.aiCollapsedText}>Ask anything about this step</Text>
                <AppIcon name="forward" size={14} color={COLORS.aiPurple} />
              </TouchableOpacity>
            )}

            {/* Expanded state */}
            {(isAIExpanded || currentStepMessages.length > 0) && (
              <View style={styles.aiExpandedPanel}>
                {/* Header row with collapse button */}
                <View style={styles.aiExpandedHeader}>
                  <Text style={styles.aiStar}>★</Text>
                  <Text style={styles.aiExpandedTitle}>AI Chef</Text>
                  <TouchableOpacity
                    onPress={() => setIsAIExpanded(false)}
                    style={styles.aiCollapseBtn}
                  >
                    <AppIcon name="collapse" size={16} color={COLORS.aiPurple} />
                  </TouchableOpacity>
                </View>

                {/* Previous Q&As for this step */}
                {currentStepMessages.length > 0 && (
                  <View style={styles.qaList}>
                    {currentStepMessages.map((message) => (
                      <View key={message.id} style={styles.qaMessage}>
                        <Text style={styles.questionText}>Q: {message.question}</Text>
                        <Text style={styles.answerText}>
                          {message.answer
                            ? `A: ${message.answer}${message.isStreaming && showCursor ? '▊' : ''}`
                            : message.isStreaming
                            ? '▊'
                            : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Input area */}
                <View style={styles.aiInputContainer}>
                  <TextInput
                    style={styles.aiInput}
                    placeholder="Ask something about this step…"
                    placeholderTextColor={COLORS.textMuted}
                    value={aiInputText}
                    onChangeText={setAiInputText}
                    onSubmitEditing={() => handleAIAsk(aiInputText)}
                    editable={!isLoading}
                    returnKeyType="send"
                    multiline={false}
                  />
                  <TouchableOpacity
                    onPress={() => handleAIAsk(aiInputText)}
                    disabled={isLoading || !aiInputText.trim()}
                    style={styles.aiSendBtn}
                  >
                    <AppIcon
                      name="send"
                      size={16}
                      color={isLoading || !aiInputText.trim() ? COLORS.textMuted : COLORS.aiPurple}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </PanGestureHandler>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button 
          label="Prev" 
          variant="ghost" 
          onPress={handlePrev} 
          disabled={currentStepIndex === 0} 
        />
        <Button 
          label="✓ Done" 
          variant="primary" 
          onPress={handleDone} 
          style={styles.doneBtn}
        />
        <Button 
          label={currentStepIndex === stepsCount - 1 ? "Finish" : "Next"} 
          variant="ghost" 
          onPress={handleNext} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 8,
  },
  stepCounterText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  dotCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  counterDotsFallback: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
  contentArea: {
    flex: 1,
  },
  stepImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surface,
  },
  numberPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bigNumber: {
    fontFamily: 'Georgia',
    fontSize: 96,
    color: COLORS.textMuted,
  },
  instructionScroll: {
    padding: 24,
  },
  instructionText: {
    fontFamily: 'Georgia',
    fontSize: 24,
    lineHeight: 36,
    color: COLORS.mahogany, // mahogany
  },
  timerCard: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  timerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerIconText: {
    fontSize: 24,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  timerControls: {
    fontSize: 24,
  },
  timerBarBg: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  aiAskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: COLORS.aiPurpleLight,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: COLORS.aiPurple,
  },
  aiPanelContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  aiCollapsedPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.aiPurpleLight,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.aiPurple,
    gap: 8,
  },
  aiStar: {
    fontSize: 16,
    color: COLORS.aiPurple,
    fontWeight: '700',
  },
  aiCollapsedText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.aiPurple,
    fontWeight: '500',
  },
  aiExpandedPanel: {
    backgroundColor: COLORS.aiPurpleLight,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.aiPurple,
    padding: 14,
    gap: 10,
  },
  aiExpandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.aiPurple + '40',
  },
  aiExpandedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.aiPurple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiCollapseBtn: {
    padding: 2,
  },
  qaList: {
    gap: 10,
  },
  qaMessage: {
    gap: 4,
  },
  questionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mahogany,
  },
  answerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.aiPurple,
  },
  aiInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  aiSendBtn: {
    padding: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneBtn: {
    flex: 1,
    marginHorizontal: 16,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completionImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  completionCongrats: {
    fontFamily: 'Georgia',
    fontSize: 32,
    color: COLORS.mahogany,
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  totalTimeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  actionBtn: {
    marginBottom: 12,
  },
});
