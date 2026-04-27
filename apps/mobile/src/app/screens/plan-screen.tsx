import { Pressable, Text, TextInput, View } from 'react-native';
import { energyLevels } from '../constants';
import { Card, PageIntro } from '../components/primitives';
import { styles } from '../styles';
import type { PaceframeAppController } from '../types';

type PlanScreenProps = Pick<
  PaceframeAppController,
  'plan' | 'newTaskTitle' | 'setNewTaskTitle' | 'newTaskEnergy' | 'setNewTaskEnergy' | 'handleAddTask' | 'dashboard' | 'completedTasks' | 'markTaskDone' | 'reopenCompletedTask'
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
  reopenCompletedTask
}: PlanScreenProps) {
  return (
    <View>
      <PageIntro
        title="Plan your work"
        subtitle="Capture tasks, prioritize by energy fit, and keep completed work out of the way until you need it."
      />

      <Card title="Priority stack" subtitle="Tasks are ordered using urgency, importance, energy fit, and recovery cost." tone="light">
        {plan.prioritizedTasks.map((task) => (
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
        ))}
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
        {dashboard.routines.map((routine) => (
          <View key={routine.id} style={styles.simpleRow}>
            <Text style={styles.listTitle}>{routine.title}</Text>
            <Text style={styles.listMeta}>
              {routine.cue} • {routine.energyMatch}
            </Text>
          </View>
        ))}
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
