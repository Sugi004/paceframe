import { Text, View } from 'react-native';
import { styles } from '../styles';

export function HeroCard({
  firstName,
  primaryGoal,
  focusLabel,
  burnoutLevel,
  burnoutScore,
  burnoutSummary,
  careConsistency
}: {
  firstName?: string;
  primaryGoal?: string;
  focusLabel: string;
  burnoutLevel: 'low' | 'moderate' | 'high';
  burnoutScore: number;
  burnoutSummary: string;
  careConsistency: number;
}) {
  const title = firstName?.trim()
    ? `${firstName}, plan your day around your energy.`
    : 'Plan your day around your energy, not just pressure.';
  const subtitle = primaryGoal?.trim()
    ? `Paceframe is shaping today around ${primaryGoal.trim()}.`
    : 'One place for planning, recovery, routines, and calmer execution when your brain is carrying too much.';

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroEyebrow}>PACEFRAME</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>

      <View style={styles.heroChips}>
        <View style={[styles.heroChip, styles.heroChipWarm]}>
          <Text style={styles.heroChipLabel}>{focusLabel}</Text>
        </View>
        <View
          style={[
            styles.heroChip,
            burnoutLevel === 'high' ? styles.heroChipDanger : burnoutLevel === 'moderate' ? styles.heroChipWarning : styles.heroChipCool
          ]}
        >
          <Text style={styles.heroChipLabel}>{burnoutLevel} burnout risk • {burnoutScore}/100</Text>
        </View>
      </View>

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{careConsistency}%</Text>
          <Text style={styles.heroStatLabel}>care consistency</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{burnoutScore}</Text>
          <Text style={styles.heroStatLabel}>burnout score</Text>
        </View>
      </View>

      <View style={styles.heroSignalCard}>
        <Text style={styles.heroSignalTitle}>Recovery focus</Text>
        <Text style={styles.heroSignalBody}>{burnoutSummary}</Text>
      </View>
    </View>
  );
}
