import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SPACING } from '../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ForumScreen from '../screens/ForumScreen';
import FoodScreen from '../screens/FoodScreen';
import { MainTabParamList, RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom header component
const Header: React.FC<{ title?: string }> = ({ title }) => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.headerBackground }}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Icon name="heart-pulse" size={24} color="#FFFFFF" />
          <Text style={[styles.logoText, { color: colors.headerText }]}>NutriHub</Text>
        </View>
        
        <View style={styles.navContainer}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, { color: colors.headerText }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, { color: colors.headerText }]}>Foods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, { color: colors.headerText }]}>Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, { color: colors.headerText }]}>API Examples [TEMPORARY]</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.rightContainer}>
          {/* Theme Toggle Button */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={toggleTheme}
            accessibilityRole="button" 
            accessibilityLabel="Toggle theme"
          >
            <Icon 
              name={theme === 'dark' ? 'weather-sunny' : 'weather-night'} 
              size={22} 
              color={colors.headerText} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FFFFFF' }]} // White button
            onPress={() => logout()}
          >
            <Icon name="logout" size={18} color={colors.headerBackground} />
            <Text style={[styles.actionButtonText, { color: colors.headerBackground }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};




const MainTabNavigator = () => {
  const { colors, theme } = useTheme();
  
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tab.Navigator
        screenOptions={({ route }) => ({ 
          headerShown: false, 
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.tabBarColor,
            borderTopColor: colors.border, 
          },
          tabBarLabelStyle: {
            paddingBottom: SPACING.xs, 
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: React.ComponentProps<typeof Icon>['name'];
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Food') {
              iconName = focused ? 'food-apple' : 'food-apple-outline';
            } else if (route.name === 'Forum') {
              iconName = focused ? 'forum' : 'forum-outline';
            } else {
              iconName = 'help-circle'; 
            }
            return <Icon name={iconName} size={focused? 26 : 24} color={color} />;
          },
        })}
      >
        {/* Define Screens within the Tab Navigator */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Food" component={FoodScreen} />
        <Tab.Screen name="Forum" component={ForumScreen} />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: SPACING.xs,
  },
  navContainer: {
    display: 'none', // Hide on mobile - would be visible on larger screens
  },
  navItem: {
    marginHorizontal: 8,
  },
  navText: {},
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MainTabNavigator;