import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/app/components/app-error-boundary';
import { AuthFrontPage } from './src/app/components/auth-front-page';
import { LoadingScreen } from './src/app/components/loading-screen';
import { NavigationTabs } from './src/app/components/navigation-tabs';
import { ScreenTransition } from './src/app/components/screen-transition';
import { usePaceframeApp } from './src/app/hooks/use-paceframe-app';
import { AccountScreen } from './src/app/screens/account-screen';
import { AssistantScreen } from './src/app/screens/assistant-screen';
import { CheckInScreen } from './src/app/screens/checkin-screen';
import { OverviewScreen } from './src/app/screens/overview-screen';
import { PlanScreen } from './src/app/screens/plan-screen';
import { ResetScreen } from './src/app/screens/reset-screen';
import { SetupScreen } from './src/app/screens/setup-screen';
import { styles } from './src/app/styles';
import type { Tab } from './src/app/types';

export default function App() {
  const app = usePaceframeApp();
  const [visibleTab, setVisibleTab] = useState<Tab>('overview');
  const [transitionTarget, setTransitionTarget] = useState<Tab | null>(null);
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const launchStartedAtRef = useRef(Date.now());
  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!app.isReady) {
      return;
    }

    const elapsed = Date.now() - launchStartedAtRef.current;
    const remaining = Math.max(0, 1400 - elapsed);
    const timeoutId = setTimeout(() => {
      setShowLaunchScreen(false);
    }, remaining);

    return () => clearTimeout(timeoutId);
  }, [app.isReady]);

  useEffect(() => {
    if (showLaunchScreen) {
      return;
    }

    appOpacity.setValue(0);
    Animated.timing(appOpacity, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [appOpacity, showLaunchScreen]);

  useEffect(() => {
    if (!app.user || !app.dashboard.profile.onboardingComplete) {
      setVisibleTab('overview');
      setTransitionTarget(null);
      return;
    }

    if (app.activeTab === visibleTab) {
      return;
    }

    setTransitionTarget(app.activeTab);
    const timeoutId = setTimeout(() => {
      setVisibleTab(app.activeTab);
      setTransitionTarget(null);
    }, 560);

    return () => clearTimeout(timeoutId);
  }, [app.activeTab, app.dashboard.profile.onboardingComplete, app.user, visibleTab]);

  if (!app.isReady || showLaunchScreen) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  const renderShell = (content: React.ReactNode) => (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <Animated.View style={[styles.screenShell, { opacity: appOpacity }]}>
            {content}
          </Animated.View>
        </SafeAreaView>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );

  if (!app.user) {
    return renderShell(
      <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
        <AuthFrontPage
          authMode={app.authMode}
          email={app.authEmail}
          password={app.authPassword}
          message={app.authMessage}
          status={app.authStatus}
          authReady={app.authReady}
          onModeChange={app.handleAuthModeChange}
          onEmailChange={app.setAuthEmail}
          onPasswordChange={app.setAuthPassword}
          onSubmit={() => {
            void app.handleAuthSubmit();
          }}
        />
      </ScrollView>
    );
  }

  if (!app.dashboard.profile.onboardingComplete) {
    return renderShell(
      <ScrollView style={styles.screen} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <SetupScreen
          dashboard={app.dashboard}
          updateProfileField={app.updateProfileField}
          setPlanningStyle={app.setPlanningStyle}
          setCrashWindow={app.setCrashWindow}
          adjustCareTarget={app.adjustCareTarget}
          completeOnboarding={app.completeOnboarding}
        />
      </ScrollView>
    );
  }

  const renderTab = transitionTarget ? visibleTab : app.activeTab;
  const contentContainerStyle = renderTab === 'overview' ? styles.content : styles.pageContent;
  const assistantScreen = renderTab === 'assistant' ? (
    <AssistantScreen
      dashboard={app.dashboard}
      plan={app.plan}
      burnoutSignal={app.burnoutSignal}
      aiStatus={app.aiStatus}
      aiMessage={app.aiMessage}
      retryLiveCoaching={app.retryLiveCoaching}
      assistantStatus={app.assistantStatus}
      assistantMessage={app.assistantMessage}
      assistantPrompt={app.assistantPrompt}
      setAssistantPrompt={app.setAssistantPrompt}
      assistantHistory={app.assistantHistory}
      submitAssistantQuestion={app.submitAssistantQuestion}
    />
  ) : null;
  const showPlanEnergyOverlay = app.activeTab === 'plan' && app.planEnergyGateOpen;

  return renderShell(
    <>
      {renderTab === 'assistant' ? (
        <View style={styles.tabScreenHost}>{assistantScreen}</View>
      ) : (
        <ScrollView style={styles.screen} contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          {renderTab === 'overview' ? (
            <OverviewScreen
              dashboard={app.dashboard}
              careConsistency={app.careConsistency}
              weeklyInsight={app.weeklyInsight}
              dailyBrief={app.dailyBrief}
              aiCoach={app.aiCoach}
              aiStatus={app.aiStatus}
              aiMessage={app.aiMessage}
              retryLiveCoaching={app.retryLiveCoaching}
              liveCoaching={app.liveCoaching}
              nextReminders={app.nextReminders}
              weeklySummary={app.weeklySummary}
              burnoutSignal={app.burnoutSignal}
              plan={app.plan}
            />
          ) : null}

          {renderTab === 'plan' ? (
            <PlanScreen
              plan={app.plan}
              planEnergyGateOpen={app.planEnergyGateOpen}
              currentPlanEnergyLane={app.currentPlanEnergyLane}
              newTaskTitle={app.newTaskTitle}
              setNewTaskTitle={app.setNewTaskTitle}
              newTaskEnergy={app.newTaskEnergy}
              setNewTaskEnergy={app.setNewTaskEnergy}
              handleAddTask={app.handleAddTask}
              dashboard={app.dashboard}
              completedTasks={app.completedTasks}
              markTaskDone={app.markTaskDone}
              reopenCompletedTask={app.reopenCompletedTask}
              setWorkOrderingPreference={app.setWorkOrderingPreference}
            />
          ) : null}

          {renderTab === 'checkin' ? (
            <CheckInScreen
              dashboard={app.dashboard}
              adjustSleepTrouble={app.adjustSleepTrouble}
              adjustEnergy={app.adjustEnergy}
              adjustCareMetric={app.adjustCareMetric}
              toggleReminderEnabled={app.toggleReminderEnabled}
              shiftReminder={app.shiftReminder}
              updateReflectionField={app.updateReflectionField}
            />
          ) : null}

          {renderTab === 'reset' ? <ResetScreen plan={app.plan} burnoutSignal={app.burnoutSignal} /> : null}

          {renderTab === 'account' ? (
            <AccountScreen
              user={app.user}
              handleSignOut={app.handleSignOut}
              dashboard={app.dashboard}
              nextReminders={app.nextReminders}
              syncStatus={app.syncStatus}
              syncMessage={app.syncMessage}
              retryCloudSync={app.retryCloudSync}
              updateProfileField={app.updateProfileField}
              setPlanningStyle={app.setPlanningStyle}
              setCrashWindow={app.setCrashWindow}
              adjustCareTarget={app.adjustCareTarget}
            />
          ) : null}
        </ScrollView>
      )}

      <NavigationTabs activeTab={app.activeTab} onSelect={app.setActiveTab} />
      <Modal visible={showPlanEnergyOverlay} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.energyConfirmModalOverlay}>
          <View style={styles.energyConfirmModalCard}>
            <Text style={styles.energyConfirmEyebrow}>Energy check</Text>
            <Text style={styles.energyConfirmTitle}>How much energy do you have right now?</Text>
            <Text style={styles.energyConfirmBody}>
              Paceframe needs this before showing tasks. High and medium keep high-energy, high-priority work first by default. Low only moves lighter work first when you explicitly choose it.
            </Text>
            <View style={styles.energyConfirmRow}>
              {(['high', 'medium', 'low'] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => app.selectEnergyLane(level)}
                  style={[
                    styles.energyConfirmSegment,
                    app.currentPlanEnergyLane === level ? styles.energyConfirmSegmentActive : undefined
                  ]}
                >
                  <Text
                    style={[
                      styles.energyConfirmSegmentLabel,
                      app.currentPlanEnergyLane === level ? styles.energyConfirmSegmentLabelActive : undefined
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.energyConfirmFootnote}>
              This blocks planning until you choose your real capacity for the next task block.
            </Text>
          </View>
        </View>
      </Modal>
      {transitionTarget ? <ScreenTransition tab={transitionTarget} /> : null}
    </>
  );
}
