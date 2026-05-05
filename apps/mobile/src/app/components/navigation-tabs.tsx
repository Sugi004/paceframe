import { Pressable, Text, View } from 'react-native';
import { tabs } from '../constants';
import { styles } from '../styles';
import type { Tab } from '../types';

export function NavigationTabs({
  activeTab,
  onSelect
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onSelect(tab.key)}
          style={[styles.tab, activeTab === tab.key ? styles.tabActive : undefined]}
        >
          <Text numberOfLines={1} style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : undefined]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
