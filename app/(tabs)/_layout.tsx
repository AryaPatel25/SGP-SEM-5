// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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
