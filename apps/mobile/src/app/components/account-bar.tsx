import { Pressable, Text, View } from 'react-native';
import { PaceframeLogo } from '../../components/paceframe-logo';
import { styles } from '../styles';

export function AccountBar({
  email,
  onSignOut
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.accountBar}>
      <View style={styles.accountIdentity}>
        <PaceframeLogo size={34} />
        <View>
          <Text style={styles.accountLabel}>Paceframe account</Text>
          <Text style={styles.accountEmail}>{email}</Text>
        </View>
      </View>
      <Pressable onPress={onSignOut} style={styles.accountButton}>
        <Text style={styles.accountButtonLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}
