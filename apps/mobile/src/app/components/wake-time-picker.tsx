import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { DEFAULT_WAKE_TIME } from '@paceframe/shared';
import { styles } from '../styles';

type WakeTimePickerProps = {
  value: string;
  onChange: (wakeTime: string) => void;
};

function toTimeDate(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  const hour = match ? Number(match[1]) : 8;
  const minute = match ? Number(match[2]) : 0;
  const valid = hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;

  return new Date(2000, 0, 1, valid ? hour : 8, valid ? minute : 0);
}

export function formatWakeTime(value: string) {
  return toTimeDate(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function toWakeTime(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function WakeTimePicker({ value, onChange }: WakeTimePickerProps) {
  const normalizedValue = value || DEFAULT_WAKE_TIME;
  const currentDate = useMemo(() => toTimeDate(normalizedValue), [normalizedValue]);
  const [isVisible, setIsVisible] = useState(false);
  const [draft, setDraft] = useState(currentDate);

  useEffect(() => {
    setDraft(currentDate);
  }, [currentDate]);

  function openPicker() {
    setDraft(currentDate);
    setIsVisible(true);
  }

  function handleChange(event: DateTimePickerEvent, nextValue?: Date) {
    if (Platform.OS === 'android') {
      setIsVisible(false);
    }

    if (event.type === 'set' && nextValue) {
      setDraft(nextValue);

      if (Platform.OS === 'android') {
        onChange(toWakeTime(nextValue));
      }
    }
  }

  function savePicker() {
    onChange(toWakeTime(draft));
    setIsVisible(false);
  }

  return (
    <>
      <Text style={styles.fieldLabel}>Wake time</Text>
      <Pressable onPress={openPicker} accessibilityRole="button" style={styles.wakeTimeTrigger}>
        <Text style={styles.wakeTimeValue}>{formatWakeTime(normalizedValue)}</Text>
        <Text style={styles.wakeTimeAction}>Change</Text>
      </Pressable>
      <Text style={styles.helperBody}>Paceframe will use this local time for your daily morning planning prompt.</Text>

      <Modal transparent animationType="fade" visible={isVisible} onRequestClose={() => setIsVisible(false)}>
        <View style={styles.timePickerModalOverlay}>
          <View style={styles.timePickerModalCard}>
            <Text style={styles.timePickerModalTitle}>Choose your wake time</Text>
            <DateTimePicker
              value={draft}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
            />
            {Platform.OS === 'ios' ? (
              <View style={styles.timePickerModalActions}>
                <Pressable onPress={() => setIsVisible(false)} style={styles.timePickerSecondaryButton}>
                  <Text style={styles.timePickerSecondaryButtonLabel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={savePicker} style={styles.timePickerPrimaryButton}>
                  <Text style={styles.timePickerPrimaryButtonLabel}>Done</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
