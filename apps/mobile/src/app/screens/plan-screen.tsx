import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { energyLevels } from '../constants';
import { Card, PageIntro } from '../components/primitives';
import { styles } from '../styles';
import type { PaceframeAppController } from '../types';

const planEnergyLevels = ['high', 'medium', 'low'] as const;
const laneSequencingCopy = {
  high: 'High-energy tasks are first, medium-energy tasks come next, and low-energy tasks are last.',
  medium: 'Medium-energy tasks are first, low-energy tasks come next, and high-energy tasks are last.',
  low: 'Low-energy tasks are first, medium-energy tasks come next, and high-energy tasks are last.'
} as const;

type PlanScreenProps = Pick<
  PaceframeAppController,
  'plan' | 'newTaskTitle' | 'setNewTaskTitle' | 'newTaskEnergy' | 'setNewTaskEnergy' | 'handleAddTask' | 'dashboard' | 'completedTasks' | 'markTaskDone' | 'reopenCompletedTask' | 'selectEnergyLane'
>;

export function PlanScreen({
  plan,
  newTaskTitle,
  setNewTaskTitle,
  newTaskEnergy,
  setNewTaskEnergy,
  handleAddTask,
  dashboard,
  completedTasks,
  markTaskDone,
  reopenCompletedTask,
  selectEnergyLane
}: PlanScreenProps) {
  const laneTasks = plan.visiblePriorityTasks;
  const focusLaneTasks = laneTasks.slice(0, 3);
  const selectedLane = dashboard.taskFlow.selectedEnergyLane;
  const laneLabel = plan.activeEnergyLane ? `${plan.activeEnergyLane} energy lane` : 'protective lane';
  const laneSequenceMessage = plan.activeEnergyLane ? laneSequencingCopy[plan.activeEnergyLane] : null;
  const fallbackMessage =
    selectedLane && plan.fallbackLaneUsed
      ? `No ${selectedLane}-energy tasks were left, so Paceframe shifted to ${plan.fallbackLaneUsed}.`
      : null;

  return (
    <View>
      <PageIntro
        title="Plan your work"
        subtitle="Capture tasks, prioritize by energy fit, and keep completed work out of the way until you need it."
      />

      <Card title="Focus lanes" subtitle="Swipe through the strongest tasks before you decide what deserves your best energy." tone="navy">
        {!plan.needsEnergyConfirmation && focusLaneTasks.length > 0 ? (
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
        ) : plan.needsEnergyConfirmation ? (
          <View style={styles.simpleRowDark}>
            <Text style={styles.inverseBody}>Choose your current energy in the popup to unlock today&apos;s task order.</Text>
          </View>
        ) : null}
      </Card>

      <Card
        title="Priority stack"
        subtitle={
          plan.needsEnergyConfirmation
            ? 'Choose your current energy to reveal the right task lane.'
            : fallbackMessage ?? laneSequenceMessage ?? `Showing the ${laneLabel}, ordered from highest priority to lowest priority using urgency, importance, energy fit, and recovery cost.`
        }
        tone="light"
      >
        {plan.needsEnergyConfirmation ? (
          <View style={styles.simpleRow}>
            <Text style={styles.lightBody}>Paceframe is waiting for your high, medium, or low energy confirmation before it recommends the next task.</Text>
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

      <Card title="Quick capture" subtitle="Add work fast and let the app shape the day around your capacity." tone="warm">
        <TextInput
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Add a task that matters"
          placeholderTextColor="#7b8398"
          style={styles.input}
        />
        <View style={styles.segmentRow}>
          {energyLevels.map((level) => (
            <Pressable
              key={level}
              onPress={() => setNewTaskEnergy(level)}
              style={[styles.segment, newTaskEnergy === level ? styles.segmentActive : undefined]}
            >
              <Text style={[styles.segmentLabel, newTaskEnergy === level ? styles.segmentLabelActive : undefined]}>{level}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={handleAddTask} style={styles.primaryButton}>
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

      <Modal visible={plan.needsEnergyConfirmation} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.energyConfirmModalOverlay}>
          <View style={styles.energyConfirmModalCard}>
            <Text style={styles.energyConfirmEyebrow}>Energy check</Text>
            <Text style={styles.energyConfirmTitle}>How much energy do you have right now?</Text>
            <Text style={styles.energyConfirmBody}>
              Paceframe needs this before showing tasks. Once you choose a lane, the planner will order work by that energy level and block you from adding anything until it knows your capacity.
            </Text>
            <View style={styles.energyConfirmRow}>
              {planEnergyLevels.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => selectEnergyLane(level)}
                  style={[styles.energyConfirmSegment, selectedLane === level ? styles.energyConfirmSegmentActive : undefined]}
                >
                  <Text
                    style={[
                      styles.energyConfirmSegmentLabel,
                      selectedLane === level ? styles.energyConfirmSegmentLabelActive : undefined
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.energyConfirmFootnote}>High puts high-energy tasks first. Medium starts with medium. Low starts with low.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
