import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { PaceframeAppController } from '../types';
import { AIThinkingCard } from '../components/ai-thinking-card';
import { styles } from '../styles';

type AssistantScreenProps = Pick<
  PaceframeAppController,
  | 'dashboard'
  | 'plan'
  | 'burnoutSignal'
  | 'aiStatus'
  | 'aiMessage'
  | 'retryLiveCoaching'
  | 'assistantStatus'
  | 'assistantMessage'
  | 'assistantPrompt'
  | 'setAssistantPrompt'
  | 'assistantHistory'
  | 'submitAssistantQuestion'
>;

export function AssistantScreen({
  dashboard,
  plan,
  burnoutSignal,
  aiStatus,
  aiMessage,
  retryLiveCoaching,
  assistantStatus,
  assistantMessage,
  assistantPrompt,
  setAssistantPrompt,
  assistantHistory,
  submitAssistantQuestion
}: AssistantScreenProps) {
  const careGaps = [
    { label: 'Meals', remaining: Math.max(dashboard.carePlan.mealsTarget - dashboard.carePlan.mealsDone, 0) },
    { label: 'Water', remaining: Math.max(dashboard.carePlan.hydrationTarget - dashboard.carePlan.hydrationDone, 0) },
    { label: 'Movement', remaining: Math.max(dashboard.carePlan.movementTarget - dashboard.carePlan.movementDone, 0) },
    { label: 'Rest', remaining: Math.max(dashboard.carePlan.restTarget - dashboard.carePlan.restDone, 0) }
  ].sort((left, right) => right.remaining - left.remaining);
  const biggestCareGap = careGaps[0];
  const quickAsks = [
    'Plan my day around my current energy.',
    'What should I protect today so I do not burn out?',
    'How should I sequence my work blocks?',
    biggestCareGap.remaining > 0
      ? `How do I recover if I am behind on ${biggestCareGap.label.toLowerCase()}?`
      : 'How do I use my current stability without overfilling the day?'
  ];

  const aiAvailable = aiStatus === 'ready';
  const assistantBusy = assistantStatus === 'loading';
  const statusTitle =
    aiStatus === 'ready'
      ? 'Live AI is active'
      : aiStatus === 'loading'
        ? 'Live AI is warming up'
        : aiStatus === 'error'
      ? 'Live AI needs attention'
      : 'Live AI has not connected yet';
  const statusBody =
    assistantStatus === 'loading'
      ? 'Paceframe is reading your latest signals and shaping a grounded response before it answers.'
      : aiAvailable
        ? 'Ask about today, sequencing, overload, or recovery. Replies are shaped around your current strain, care gaps, and task load.'
        : assistantMessage;
  const topTask = plan.prioritizedTasks[0];
  const contextPills = [
    `${burnoutSignal.score}/100 strain`,
    topTask ? `Top task: ${topTask.title}` : 'No pending task yet',
    biggestCareGap.remaining > 0 ? `${biggestCareGap.label} gap: ${biggestCareGap.remaining}` : 'Care baseline covered'
  ];

  return (
    <KeyboardAvoidingView
      style={styles.assistantScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={styles.assistantTopBar}>
        <View style={styles.assistantTopBarCopy}>
          <Text style={styles.assistantTopBarEyebrow}>PACEFRAME AI</Text>
          <Text style={styles.assistantTopBarTitle}>Coach</Text>
          <Text numberOfLines={2} style={styles.assistantTopBarSubtitle}>
            Talk through your day, your workload, and your recovery. Paceframe answers from your current app state, not general web knowledge.
          </Text>
        </View>
        <View style={styles.assistantTopBarActions}>
          <View
            style={[
              styles.aiStatusPill,
              aiAvailable ? styles.aiStatusPillReady : styles.aiStatusPillError,
              assistantBusy ? styles.aiStatusPillBusy : null
            ]}
          >
            <Text style={styles.aiStatusPillLabel}>{assistantBusy ? 'Thinking' : aiAvailable ? 'Live' : 'Check'}</Text>
          </View>
          <Pressable onPress={retryLiveCoaching} style={styles.assistantRetryButton}>
            <Text style={styles.assistantRetryButtonLabel}>Retry</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.assistantConversationShell}>
        <View style={styles.assistantStatusCard}>
          <View style={styles.assistantStatusHeader}>
            <View style={styles.assistantStatusCopy}>
              <Text style={styles.assistantStatusEyebrow}>Live coach status</Text>
              <Text style={styles.assistantStatusTitle}>{statusTitle}</Text>
            </View>
            <View
              style={[
                styles.aiStatusPill,
                aiAvailable ? styles.aiStatusPillReady : styles.aiStatusPillError,
                assistantBusy ? styles.aiStatusPillBusy : null
              ]}
            >
              <Text style={styles.aiStatusPillLabel}>{assistantBusy ? 'Thinking' : aiAvailable ? 'Connected' : 'Unavailable'}</Text>
            </View>
          </View>
          <Text style={styles.assistantStatusBody}>{statusBody}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assistantContextPillRow}
          >
            {contextPills.map((pill) => (
              <View key={pill} style={styles.assistantContextPill}>
                <Text style={styles.assistantContextPillLabel}>{pill}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.assistantThreadScroll}
          contentContainerStyle={[
            styles.assistantThreadContent,
            assistantHistory.length === 0 ? styles.assistantThreadContentEmpty : styles.assistantThreadContentActive
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {assistantHistory.length > 0 ? (
            <View style={styles.threadStack}>
              {assistantHistory.slice(-12).map((item) => (
                <View
                  key={item.id}
                  style={[styles.threadRow, item.role === 'user' ? styles.threadRowUser : styles.threadRowAssistant]}
                >
                  <View
                    style={[styles.threadBubble, item.role === 'user' ? styles.threadBubbleUser : styles.threadBubbleAssistant]}
                  >
                    <Text style={styles.threadRole}>{item.role === 'user' ? 'You' : 'Paceframe AI'}</Text>
                    <Text style={[styles.threadText, item.role === 'user' ? styles.threadTextUser : styles.threadTextAssistant]}>
                      {item.text}
                    </Text>
                    {item.meta ? <Text style={styles.threadMeta}>{item.meta}</Text> : null}
                  </View>
                </View>
              ))}
              {assistantBusy ? <AIThinkingCard /> : null}
            </View>
          ) : (
            <View style={styles.emptyAIState}>
              <Text style={styles.emptyAIStateEyebrow}>Paceframe can help with</Text>
              <Text style={styles.emptyAIStateTitle}>Start the conversation</Text>
              <Text style={styles.emptyAIStateBody}>
                Ask Paceframe to shape the day around your real capacity, tell you what to protect, or help you recover without losing momentum.
              </Text>
              <View style={styles.emptyAIStateChecklist}>
                <Text style={styles.emptyAIStatePoint}>Plan the next few hours around your current energy</Text>
                <Text style={styles.emptyAIStatePoint}>Decide whether to push, pause, or recover</Text>
                <Text style={styles.emptyAIStatePoint}>Turn overload into a calmer sequence of steps</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAskStrip} keyboardShouldPersistTaps="handled">
                {quickAsks.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => {
                      void submitAssistantQuestion(prompt);
                    }}
                    style={styles.quickAskChip}
                  >
                    <Text style={styles.quickAskChipLabel}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View style={styles.chatComposerDock}>
          {assistantStatus !== 'ready' && !assistantBusy ? <Text style={styles.helperBody}>{assistantMessage}</Text> : null}
          <View style={styles.chatComposerShell}>
            <TextInput
              value={assistantPrompt}
              onChangeText={setAssistantPrompt}
              placeholder="Message Paceframe about your day..."
              placeholderTextColor="#7b8398"
              style={styles.chatComposerInput}
              multiline
            />
            <View style={styles.chatComposerRow}>
              <Pressable
                onPress={() => {
                  void submitAssistantQuestion();
                }}
                disabled={!assistantPrompt.trim() || assistantStatus === 'loading'}
                style={[
                  styles.primaryButton,
                  styles.chatSendButton,
                  !assistantPrompt.trim() || assistantStatus === 'loading' ? styles.disabledButton : undefined
                ]}
              >
                <Text style={styles.primaryButtonLabel}>{assistantStatus === 'loading' ? 'Analyzing...' : 'Send'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
