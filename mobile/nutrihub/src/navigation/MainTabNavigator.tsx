import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SPACING, PALETTE } from '../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import PostDetailScreen from '../screens/forum/PostDetailScreen';
import CreatePostScreen from '../screens/forum/CreatePostScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import MyProfileScreen from '../screens/user/MyProfileScreen';
import FoodScreen from '../screens/food/FoodScreen';
import FoodCompareScreen from '../screens/food/FoodCompareScreen';

// Profile screens
import ProfileSettingsScreen from '../screens/user/ProfileSettingsScreen';
import MyPostsScreen from '../screens/user/MyPostsScreen';
import AllergenSelectionScreen from '../screens/user/AllergenSelectionScreen';
import PersonalRecipesScreen from '../screens/user/PersonalRecipesScreen';
import ContactInfoScreen from '../screens/user/ContactInfoScreen';
import LikedPostsScreen from '../screens/user/LikedPostsScreen';
import LikedRecipesScreen from '../screens/user/LikedRecipesScreen';
import ProfessionTagsScreen from '../screens/user/ProfessionTagsScreen';
import AccountWarningsScreen from '../screens/user/AccountWarningsScreen';
import ReportUserScreen from '../screens/user/ReportUserScreen';

import { MainTabParamList, RootStackParamList, ForumStackParamList, ProfileStackParamList, FoodStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();
const ForumStack = createNativeStackNavigator<ForumStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const FoodStack = createNativeStackNavigator<FoodStackParamList>();

// Custom header component
const Header: React.FC<{ title?: string }> = ({ title }) => {
  const navigation = useNavigation<NavigationProp>();
  const { logout, user } = useAuth();
  const { theme, themeType, toggleTheme, textStyles } = useTheme();

  // Get display name from user's name and surname
  const getDisplayName = () => {
    if (!user) return '';
    if (user.name && user.surname) {
      return `${user.name} ${user.surname}`;
    }
    return user.username;
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.headerBackground }}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoTextNutri, { color: theme.headerText, fontFamily: 'Poppins_400Regular' }]}>
              Nutri
            </Text>
            <Text style={[styles.logoTextHub, { color: theme.headerText, fontFamily: 'Poppins_900Black' }]}>
              Hub
            </Text>
          </View>
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
              name={themeType === 'dark' ? 'weather-sunny' : 'weather-night'} 
              size={22} 
              color={theme.headerText} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PALETTE.NEUTRAL.WHITE }]} 
            onPress={() => logout()}
          >
            <Icon name="logout" size={18} color={theme.headerBackground} />
            <Text style={[styles.actionButtonText, { color: theme.headerBackground }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Forum Stack Navigator
const ForumStackNavigator = () => {
  return (
    <ForumStack.Navigator screenOptions={{ headerShown: false }}>
      <ForumStack.Screen name="ForumList" component={ForumScreen} />
      <ForumStack.Screen name="PostDetail" component={PostDetailScreen} />
      <ForumStack.Screen name="CreatePost" component={CreatePostScreen} />
      <ForumStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ForumStack.Navigator>
  );
};

// Food Stack Navigator
const FoodStackNavigator = () => {
  return (
    <FoodStack.Navigator screenOptions={{ headerShown: false }}>
      <FoodStack.Screen name="FoodList" component={FoodScreen} />
      <FoodStack.Screen name="FoodCompare" component={FoodCompareScreen} />
    </FoodStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileOverview" component={ProfileSettingsScreen} />
      <ProfileStack.Screen name="MyPosts" component={MyPostsScreen} />
      <ProfileStack.Screen name="AllergenSelection" component={AllergenSelectionScreen} />
      <ProfileStack.Screen name="PersonalRecipes" component={PersonalRecipesScreen} />
      <ProfileStack.Screen name="ContactInfo" component={ContactInfoScreen} />
      <ProfileStack.Screen name="LikedPosts" component={LikedPostsScreen} />
      <ProfileStack.Screen name="LikedRecipes" component={LikedRecipesScreen} />
      <ProfileStack.Screen name="ProfessionTags" component={ProfessionTagsScreen} />
      <ProfileStack.Screen name="AccountWarnings" component={AccountWarningsScreen} />
      <ProfileStack.Screen name="ReportUser" component={ReportUserScreen} />
    </ProfileStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tab.Navigator
        screenOptions={({ route }) => ({ 
          headerShown: false, 
          tabBarActiveTintColor: theme.tabBarActiveColor,
          tabBarInactiveTintColor: theme.tabBarInactiveColor,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopColor: 'transparent',
            elevation: 8,
            shadowColor: PALETTE.NEUTRAL.BLACK,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarLabelStyle: {
            paddingBottom: SPACING.xs,
            fontWeight: '500',
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: React.ComponentProps<typeof Icon>['name'];
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Food') {
              iconName = focused ? 'food-apple' : 'food-apple-outline';
            } else if (route.name === 'Forum') {
              iconName = focused ? 'forum' : 'forum-outline';
            } else if (route.name === 'MyProfile') {
              iconName = focused ? 'account' : 'account-outline';
            } else {
              iconName = 'help-circle'; 
            }
            return <Icon name={iconName} size={focused? 26 : 24} color={color} />;
          },
        })}
      >
        {/* Define Screens within the Tab Navigator */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Food" component={FoodStackNavigator} />
        <Tab.Screen name="Forum" component={ForumStackNavigator} />
        <Tab.Screen name="MyProfile" component={ProfileStackNavigator} />
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
  logoImage: {
    width: 36,
    height: 36,
    marginRight: SPACING.xs,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTextNutri: {
    fontWeight: 'normal',
    fontSize: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  logoTextHub: {
    fontWeight: '900',
    fontSize: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MainTabNavigator;