// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: '#18181b' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (props) => (
            <Ionicons name="home" size={props.size ?? 20} color={props.color ?? '#94a3b8'} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: (props) => (
            <Ionicons name="stats-chart" size={props.size ?? 20} color={props.color ?? '#94a3b8'} />
          ),
        }}
      />
      <Tabs.Screen
        name="interview"
        options={{
          title: 'Interview',
          tabBarIcon: (props) => (
            <Ionicons name="chatbubbles" size={props.size ?? 20} color={props.color ?? '#94a3b8'} />
          ),
        }}
      />
    </Tabs>
  );
}
