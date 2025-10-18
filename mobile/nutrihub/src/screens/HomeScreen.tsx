/**
 * HomeScreen
 * 
 * Main landing screen for the application, displaying key features.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import FeatureCard from '../components/common/FeatureCard';
import { MainTabParamList } from '../navigation/types';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, textStyles } = useTheme();
  const { user } = useAuth();

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.name || user.surname) {
      return `${user.name || ''} ${user.surname || ''}`.trim();
    }
    return user.username;
  };

  const handleExploreFoods = () => {
    navigation.navigate('Food');
  };

  const handleJoinForum = () => {
    navigation.navigate('Forum');
  };

  const handleViewProfile = () => {
    if (!user) return;
    // Navigate directly to MyProfile tab
    navigation.navigate('MyProfile');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <Text style={[styles.welcomeTitle, textStyles.heading1]}>
          Welcome{user ? `, ${getUserDisplayName()}` : ''} to NutriHub
        </Text>
        <Text style={[styles.welcomeDescription, textStyles.body]}>
          Your complete nutrition platform for discovering healthy foods, sharing recipes, 
          and joining a community of health enthusiasts.
        </Text>

        <View style={styles.buttonContainer}>
          <Button 
            title="Explore Foods" 
            onPress={handleExploreFoods} 
            variant="primary"
          />
          <View style={{ width: SPACING.md }} />
          <Button 
            title="Join Forum" 
            variant="secondary" 
            onPress={handleJoinForum} 
          />
          {user && (
            <>
              <View style={{ width: SPACING.md }} />
              <Button 
                title="My Profile" 
                variant="secondary" 
                onPress={handleViewProfile} 
              />
            </>
          )}
        </View>

        {/* Feature Cards Section */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            iconName="food-apple"
            title="Track Nutrition"
            description="Access detailed nutritional information for thousands of foods."
          />
          <FeatureCard
            iconName="notebook"
            title="Share Recipes"
            description="Discover and share healthy recipes with the community."
          />
          <FeatureCard
            iconName="account-group"
            title="Get Support"
            description="Connect with others on your journey to better nutrition."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeDescription: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  featuresContainer: {
    width: '100%',
  },
});

export default HomeScreen;