import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { energyLevels } from '../constants';
import { Card, PageIntro } from '../components/primitives';
import { styles } from '../styles';
import type { PaceframeAppController } from '../types';

const workOrderingOptions = ['paceframe', 'high', 'medium', 'low'] as const;
const workOrderingLabels = {
  paceframe: 'Paceframe decides',
  high: 'High first',
  medium: 'Medium first',
  low: 'Low first'
} as const;
const laneSequencingCopy = {
  paceframe: 'Paceframe keeps high-priority, high-energy work first unless you explicitly choose a low-energy lane.',
  high: 'You overrode the sequence to keep high-energy work first, then medium-energy work, then low-energy work.',
  medium: 'You overrode the sequence to put medium-energy work first, then high-energy work, then low-energy work.',
  low: 'You explicitly asked for low-energy work first, so lighter tasks will lead before medium and high-energy work.'
} as const;

type PlanScreenProps = Pick<
  PaceframeAppController,
  | 'plan'
  | 'planEnergyGateOpen'
  | 'currentPlanEnergyLane'
  | 'newTaskTitle'
  | 'setNewTaskTitle'
  | 'newTaskEnergy'
  | 'setNewTaskEnergy'
  | 'handleAddTask'
  | 'dashboard'
  | 'completedTasks'
  | 'markTaskDone'
  | 'reopenCompletedTask'
  | 'setWorkOrderingPreference'
>;

export function PlanScreen({
  plan,
  planEnergyGateOpen,
  currentPlanEnergyLane,
  newTaskTitle,
  setNewTaskTitle,
  newTaskEnergy,
  setNewTaskEnergy,
  handleAddTask,
  dashboard,
  completedTasks,
  markTaskDone,
  reopenCompletedTask,
  setWorkOrderingPreference
}: PlanScreenProps) {
  const [showWorkOrderingMenu, setShowWorkOrderingMenu] = useState(false);
  const planLocked = planEnergyGateOpen;
  const laneTasks = plan.visiblePriorityTasks;
  const focusLaneTasks = laneTasks.slice(0, 3);
  const workOrderingPreference = dashboard.taskFlow.workOrderingPreference;
  const displayWorkOrderingKey =
    workOrderingPreference === 'paceframe' && currentPlanEnergyLane === 'low' ? 'low' : workOrderingPreference;
  const laneSequenceMessage = laneSequencingCopy[displayWorkOrderingKey];
  const fallbackMessage =
    currentPlanEnergyLane && plan.fallbackLaneUsed
      ? `No ${currentPlanEnergyLane}-energy tasks were left, so Paceframe shifted to ${plan.fallbackLaneUsed}.`
      : null;
  const focusLaneSubtitle = planLocked
    ? 'Choose your current energy first. Paceframe unlocks the lane only after it knows your real capacity.'
    : fallbackMessage ?? laneSequenceMessage;
  const priorityStackSubtitle = planLocked
    ? 'Planning is paused until you choose high, medium, or low energy.'
    : fallbackMessage ?? laneSequenceMessage;

  return (
    <View style={planLocked ? styles.planLockedShell : undefined}>
      <PageIntro
        title="Plan your work"
        subtitle="Paceframe checks your current energy before it reveals the next task, then keeps the order aligned to that capacity."
      />

      <Card title="Focus lanes" subtitle={focusLaneSubtitle} tone="navy">
        {!planLocked && focusLaneTasks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusLaneSecondaryTrack}>
            {focusLaneTasks.map((task, index) => (
              <View
                key={task.id}
                style={[
                  styles.carouselPanel,
                  index === 0 ? styles.carouselPanelWarm : index === 1 ? styles.carouselPanelTeal : styles.carouselPanelLime
                ]}
              >
                <Text style={styles.carouselEyebrowDark}>
                  {index === 0 ? 'Start here' : index === 1 ? 'Then move here' : 'Protect for later'}
                </Text>
                <Text style={styles.carouselTitleDark}>{task.title}</Text>
                <Text style={styles.carouselBodyDark}>
                  {task.energyCost} energy • {task.estimatedMinutes} min • priority {task.priorityScore}
                </Text>
                <Pressable onPress={() => markTaskDone(task.id)} style={styles.carouselActionPill}>
                  <Text style={styles.carouselActionPillLabel}>Mark done</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : planLocked ? (
          <View style={styles.energyConfirmCard}>
            <Text style={styles.energyConfirmEyebrow}>Planning gate</Text>
            <Text style={styles.inverseTitle}>Tell Paceframe how much energy you have first</Text>
            <Text style={styles.inverseBody}>
              High and medium keep high-energy, high-priority work at the front. Low only moves lighter work forward when you explicitly choose it.
            </Text>
          </View>
        ) : null}
      </Card>

      <Card title="Priority stack" subtitle={priorityStackSubtitle} tone="light">
        {!planLocked ? (
          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownLabel}>Work order override</Text>
            <Pressable onPress={() => setShowWorkOrderingMenu((current) => !current)} style={styles.dropdownButton}>
              <Text style={styles.dropdownButtonText}>{workOrderingLabels[workOrderingPreference]}</Text>
              <Text style={styles.dropdownChevron}>{showWorkOrderingMenu ? '▲' : '▼'}</Text>
            </Pressable>
            {showWorkOrderingMenu ? (
              <View style={styles.dropdownMenu}>
                {workOrderingOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setWorkOrderingPreference(option);
                      setShowWorkOrderingMenu(false);
                    }}
                    style={[styles.dropdownMenuItem, option === workOrderingPreference ? styles.dropdownMenuItemActive : undefined]}
                  >
                    <Text style={[styles.dropdownMenuText, option === workOrderingPreference ? styles.dropdownMenuTextActive : undefined]}>
                      {workOrderingLabels[option]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {planLocked ? (
          <View style={styles.simpleRow}>
            <Text style={styles.lightBody}>
              Paceframe is waiting for your high, medium, or low energy confirmation before it arranges today&apos;s work.
            </Text>
          </View>
        ) : laneTasks.length > 0 ? (
          laneTasks.map((task) => (
            <View key={task.id} style={styles.listCard}>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{task.title}</Text>
                <Text style={styles.listMeta}>
                  {task.energyCost} energy • {task.estimatedMinutes} min • score {task.priorityScore}
                </Text>
              </View>
              <Pressable onPress={() => markTaskDone(task.id)} style={[styles.badge, styles.badgeOpen]}>
                <Text style={styles.badgeLabel}>Done</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.simpleRow}>
            <Text style={styles.lightBody}>There are no pending tasks left in this lane right now.</Text>
          </View>
        )}
      </Card>

      <Card title="Quick capture" subtitle="Add work fast. Paceframe will slot it into the current energy-aware order once planning is unlocked." tone="warm">
        <TextInput
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Add a task that matters"
          placeholderTextColor="#7b8398"
          style={[styles.input, planLocked ? styles.inputDisabled : undefined]}
          editable={!planLocked}
        />
        <View style={styles.segmentRow}>
          {energyLevels.map((level) => (
            <Pressable
              key={level}
              onPress={() => setNewTaskEnergy(level)}
              disabled={planLocked}
              style={[
                styles.segment,
                newTaskEnergy === level ? styles.segmentActive : undefined,
                planLocked ? styles.segmentDisabled : undefined
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  newTaskEnergy === level ? styles.segmentLabelActive : undefined,
                  planLocked ? styles.segmentLabelDisabled : undefined
                ]}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={handleAddTask} disabled={planLocked} style={[styles.primaryButton, planLocked ? styles.primaryButtonDisabled : undefined]}>
          <Text style={styles.primaryButtonLabel}>Add task to plan</Text>
        </Pressable>
      </Card>

      <Card title="Adaptive routines" subtitle="Habits that support you before burnout becomes the default operating mode." tone="lime">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselTrack}>
          {dashboard.routines.map((routine) => (
            <View key={routine.id} style={[styles.carouselPanel, styles.carouselPanelSoft]}>
              <Text style={styles.carouselEyebrowDark}>Adaptive routine</Text>
              <Text style={styles.carouselTitleDark}>{routine.title}</Text>
              <Text style={styles.carouselBodyDark}>{routine.cue} • {routine.energyMatch}</Text>
            </View>
          ))}
        </ScrollView>
      </Card>

      {completedTasks.length > 0 ? (
        <Card title="Completed tasks" subtitle="Finished work stays here and can be reopened intentionally if needed." tone="teal">
          {completedTasks.map((task) => (
            <View key={task.id} style={styles.completedRow}>
              <View style={styles.listText}>
                <Text style={styles.completedTitle}>{task.title}</Text>
                <Text style={styles.listMeta}>
                  {task.energyCost} energy • {task.estimatedMinutes} min
                </Text>
              </View>
              <Pressable onPress={() => reopenCompletedTask(task.id)} style={[styles.badge, styles.badgeDone]}>
                <Text style={styles.badgeLabel}>Reopen</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
