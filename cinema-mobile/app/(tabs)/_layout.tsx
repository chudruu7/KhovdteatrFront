import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  const { colors, isLight } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={24} color={focused ? colors.teal : (isLight ? 'rgba(23,25,35,0.45)' : 'rgba(255,255,255,0.35)')} />
      {focused && <View style={styles.navDot} />}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'newspaper' : 'newspaper-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: typeof COLORS) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
});
