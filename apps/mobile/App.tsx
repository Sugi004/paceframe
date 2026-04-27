import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthFrontPage } from './src/app/components/auth-front-page';
import { LoadingScreen } from './src/app/components/loading-screen';
import { NavigationTabs } from './src/app/components/navigation-tabs';
import { usePaceframeApp } from './src/app/hooks/use-paceframe-app';
import { AccountScreen } from './src/app/screens/account-screen';
import { CheckInScreen } from './src/app/screens/checkin-screen';
import { OverviewScreen } from './src/app/screens/overview-screen';
import { PlanScreen } from './src/app/screens/plan-screen';
import { ResetScreen } from './src/app/screens/reset-screen';
import { SetupScreen } from './src/app/screens/setup-screen';
import { styles } from './src/app/styles';

export default function App() {
  const app = usePaceframeApp();

  if (!app.isReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  if (!app.user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
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
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!app.dashboard.profile.onboardingComplete) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
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
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const contentContainerStyle = app.activeTab === 'overview' ? styles.content : styles.pageContent;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.screenShell}>
          <ScrollView style={styles.screen} contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
            {app.activeTab === 'overview' ? (
              <OverviewScreen
                dashboard={app.dashboard}
                careConsistency={app.careConsistency}
                weeklyInsight={app.weeklyInsight}
                dailyBrief={app.dailyBrief}
                aiCoach={app.aiCoach}
                aiStatus={app.aiStatus}
                aiMessage={app.aiMessage}
                retryLiveCoaching={app.retryLiveCoaching}
                nextReminders={app.nextReminders}
                weeklySummary={app.weeklySummary}
                burnoutSignal={app.burnoutSignal}
                plan={app.plan}
              />
            ) : null}

            {app.activeTab === 'plan' ? (
              <PlanScreen
                plan={app.plan}
                newTaskTitle={app.newTaskTitle}
                setNewTaskTitle={app.setNewTaskTitle}
                newTaskEnergy={app.newTaskEnergy}
                setNewTaskEnergy={app.setNewTaskEnergy}
                handleAddTask={app.handleAddTask}
                dashboard={app.dashboard}
                completedTasks={app.completedTasks}
                markTaskDone={app.markTaskDone}
                reopenCompletedTask={app.reopenCompletedTask}
              />
            ) : null}

            {app.activeTab === 'checkin' ? (
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

            {app.activeTab === 'reset' ? <ResetScreen plan={app.plan} burnoutSignal={app.burnoutSignal} /> : null}

            {app.activeTab === 'account' ? (
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

          <NavigationTabs activeTab={app.activeTab} onSelect={app.setActiveTab} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
