import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // Import View and ActivityIndicator

// Screen and Navigator Imports
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
// Type import for navigation parameters
import { RootStackParamList } from './types'; 
// Hook to access authentication state
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme'; // Import COLORS for loader

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
  const { isLoggedIn, isLoading } = useAuth();

  // --- Handle Initial Loading State ---
  // While checking AsyncStorage for the token, display a loading indicator
  // to prevent flickering between Login and MainApp screens.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  // --- Render Navigator based on Login State ---
  return (
    // Configure the Stack Navigator
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
      {/* Future note : You could add other screens here that are outside the main tabs */}
      {/* but still part of the main stack, e.g., a common Settings screen */}
      {/* <Stack.Screen name="Settings" component={SettingsScreen} /> */}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background, // Use background color from theme
  },
});

export default AppNavigator;