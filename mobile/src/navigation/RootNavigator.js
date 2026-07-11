import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập', presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký', presentation: 'modal' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Câu hỏi' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Đăng câu hỏi mới', presentation: 'modal' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Trang quản trị' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Hồ sơ cá nhân' }} />
    </Stack.Navigator>
  );
}
