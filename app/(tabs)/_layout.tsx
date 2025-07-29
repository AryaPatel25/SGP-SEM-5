// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50', // Adjust for your theme
        tabBarStyle: {
          backgroundColor: '#121212',     // Dark mode tab bar color
          borderTopColor: '#333',
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="interview"
        options={{
          title: 'Interview',
        }}
      />
    </Tabs>
  );
}
