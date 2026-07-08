import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'home',
  Notification: 'notifications',
  Contact: 'mail',
  Profile: 'person',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Notification" component={NotificationScreen} options={{ title: 'Thông báo' }} />
      <Tab.Screen name="Contact" component={ContactScreen} options={{ title: 'Liên hệ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}
