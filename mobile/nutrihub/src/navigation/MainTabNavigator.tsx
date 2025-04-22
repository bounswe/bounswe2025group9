import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ForumScreen from '../screens/ForumScreen';
import FoodScreen from '../screens/FoodScreen';

export type MainTabParamList = {
  Home: undefined;
  Forum: undefined;
  Food: undefined; // Added Food screen
  // Add Planner/Profile later if needed
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    // Example: Hide headers within tabs for now
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Forum" component={ForumScreen} />
      <Tab.Screen name="Food" component={FoodScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;