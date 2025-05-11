import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Screen and Navigator Imports
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
// Type import for navigation parameters
import { RootStackParamList } from './types'; 
// Hooks to access authentication and theme state
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// Create the Stack Navigator instance with typed parameters
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The main application navigator.
 * Determines which navigation stack to display (Authentication or Main App)
 * based on the user's login status obtained from AuthContext.
 * Also handles displaying a loading indicator during the initial auth check.
 */
const AppNavigator = () => {
  // Consume authentication state from the context
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { colors, theme, isLoading: themeLoading } = useTheme();

  // --- Handle Initial Loading State ---
  // While checking AsyncStorage for the token or theme, display a loading indicator
  const isLoading = authLoading || themeLoading;
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // --- Render Navigator based on Login State ---
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide the header globally for this stack
        }}
      >
        {isLoggedIn ? (
          // If logged in, display the main application navigator (Tabs)
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        ) : (
          // If not logged in, display the Login screen
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;