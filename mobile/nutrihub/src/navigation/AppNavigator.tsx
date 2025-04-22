import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator'; // Import the Tab Navigator

export type RootStackParamList = {
  Login: undefined;
  MainApp: undefined; // Route name for the main part of the app (Tabs)
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Placeholder for authentication state
  // In a real app, this would come from state management (Redux, Context, etc.)
  const isLoggedIn = true; // <-- CHANGE THIS TO false TO SEE LOGIN PAGE

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // User is logged in: Show the main app (Tab Navigator)
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      ) : (
        // User is not logged in: Show the Login screen
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
      {/* Add other screens outside the main tabs if needed, e.g., modal screens */}
    </Stack.Navigator>
  );
};

export default AppNavigator;