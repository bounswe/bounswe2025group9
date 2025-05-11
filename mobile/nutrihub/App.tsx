import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { PostsProvider } from './src/context/PostsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PostsProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </PostsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}