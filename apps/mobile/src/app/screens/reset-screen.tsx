import { Text, View } from 'react-native';
import { recoveryProtocols } from '@paceframe/shared';
import type { PaceframeAppController } from '../types';
import { Card, PageIntro } from '../components/primitives';
import { styles } from '../styles';

type ResetScreenProps = Pick<PaceframeAppController, 'plan' | 'burnoutSignal'>;

export function ResetScreen({ plan, burnoutSignal }: ResetScreenProps) {
  return (
    <View>
      <PageIntro
        title="Reset before overload wins"
        subtitle="Use guided recovery blocks and simpler next steps when your brain is too saturated to self-regulate cleanly."
      />

      <Card title={`Burnout risk: ${burnoutSignal.level} • ${burnoutSignal.score}/100`} subtitle={burnoutSignal.summary} tone="navy">
        {recoveryProtocols[burnoutSignal.level].map((protocol) => (
          <View key={protocol.id} style={styles.protocolRow}>
            <View style={styles.protocolDuration}>
              <Text style={styles.protocolDurationLabel}>{protocol.duration}</Text>
            </View>
            <View style={styles.listText}>
              <Text style={styles.protocolTitle}>{protocol.title}</Text>
              <Text style={styles.protocolDescription}>{protocol.description}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card title="Recovery blocks already in your day" subtitle="Support is already being placed before overload spills into the rest of the day." tone="warm">
        {plan.recoveryBlocks.map((item) => (
          <View key={item.label} style={styles.simpleRow}>
            <Text style={styles.listTitle}>{item.label}</Text>
            <Text style={styles.listMeta}>{item.window}</Text>
          </View>
        ))}
      </Card>

      <Card title="Reset sequence" subtitle="A simple order of operations when you are too overloaded to think clearly." tone="light">
        <View style={styles.simpleRow}>
          <Text style={styles.listTitle}>1. Reduce visual and notification noise</Text>
        </View>
        <View style={styles.simpleRow}>
          <Text style={styles.listTitle}>2. Eat or hydrate before chasing more output</Text>
        </View>
        <View style={styles.simpleRow}>
          <Text style={styles.listTitle}>3. Pick one essential task or end the workday early</Text>
        </View>
      </Card>
    </View>
  );
}
