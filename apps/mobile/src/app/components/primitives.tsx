import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../styles';

export function PageIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.pageIntro}>
      <Text style={styles.pageEyebrow}>PACEFRAME PAGE</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function Card({
  title,
  subtitle,
  tone,
  children
}: {
  title: string;
  subtitle: string;
  tone: 'light' | 'navy' | 'warm' | 'teal' | 'lime';
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'navy' ? styles.cardNavy : undefined,
        tone === 'warm' ? styles.cardWarm : undefined,
        tone === 'teal' ? styles.cardTeal : undefined,
        tone === 'lime' ? styles.cardLime : undefined
      ]}
    >
      <Text style={[styles.cardTitle, tone === 'navy' ? styles.cardTitleLight : undefined]}>{title}</Text>
      <Text style={[styles.cardSubtitle, tone === 'navy' ? styles.cardSubtitleLight : undefined]}>{subtitle}</Text>
      <View>{children}</View>
    </View>
  );
}

export function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricPillLabel}>{label}</Text>
      <Text style={styles.metricPillValue}>{value}</Text>
    </View>
  );
}

export function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export function MetricControl({
  label,
  value,
  onMinus,
  onPlus
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.metricControl}>
      <Text style={styles.listTitle}>{label}</Text>
      <View style={styles.metricControlRight}>
        <Pressable onPress={onMinus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>-</Text>
        </Pressable>
        <Text style={styles.metricValue}>{value}/10</Text>
        <Pressable onPress={onPlus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CareTracker({
  label,
  value,
  onMinus,
  onPlus
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.metricControl}>
      <Text style={styles.listTitle}>{label}</Text>
      <View style={styles.metricControlRight}>
        <Pressable onPress={onMinus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>-</Text>
        </Pressable>
        <Text style={styles.metricValueWide}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ReflectionField({
  label,
  value,
  placeholder,
  onChangeText
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7b8398"
        style={styles.textArea}
        multiline
      />
    </>
  );
}
