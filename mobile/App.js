import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LoginGateProvider } from './src/context/LoginGate';
import RootNavigator from './src/navigation/RootNavigator';

const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <LoginGateProvider navigationRef={navigationRef}>
            <RootNavigator />
          </LoginGateProvider>
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
