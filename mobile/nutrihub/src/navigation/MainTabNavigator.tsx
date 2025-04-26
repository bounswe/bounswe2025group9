import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ForumScreen from '../screens/ForumScreen';
import FoodScreen from '../screens/FoodScreen';
import { MainTabParamList, RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom header component
const Header: React.FC<{ title?: string }> = ({ title }) => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  

  const handleThemeToggle = () => {
    
    console.log("Theme toggle pressed - Implement logic");

  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Icon name="heart-pulse" size={24} color={COLORS.accent} />
          <Text style={styles.logoText}>NutriHub</Text>
        </View>
        
        <View style={styles.navContainer}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Foods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>API Examples [TEMPORARY]</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.rightContainer}>
          
          {/* Theme Toggle Button */}

          <TouchableOpacity style={styles.iconButton} onPress={handleThemeToggle} accessibilityRole="button" accessibilityLabel="Toggle theme">

            <Icon name="theme-light-dark" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => logout()}
          >
            <Icon name="logout" size={18} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const MainTabNavigator = () => {
  return (
    <>
      <Header />
      <Tab.Navigator
        screenOptions={({ route }) => ({ 
          headerShown: false, 
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.lightGray,
          tabBarStyle: {
            backgroundColor: COLORS.darkCard,
            borderTopColor: COLORS.darkGray, 
            

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
    </>
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
    borderBottomColor: COLORS.darkGray, 
    backgroundColor: COLORS.background, 
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: COLORS.white,
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
  navText: {
    color: COLORS.white,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.sm,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MainTabNavigator;