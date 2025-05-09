import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type FeatureCardProps = {
  iconName: React.ComponentProps<typeof Icon>['name'];
  title: string;
  description: string;
};

/**
 * FeatureCard Component
 * 
 * Displays a feature with an icon, title, and description
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ iconName, title, description }) => {
  const { theme, textStyles } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.placeholder }]}>
        <Icon name={iconName} size={30} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, textStyles.subtitle]}>{title}</Text>
        <Text style={[styles.description, textStyles.caption]}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  iconContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    padding: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  description: {
    lineHeight: 20,
  },
});

export default FeatureCard;