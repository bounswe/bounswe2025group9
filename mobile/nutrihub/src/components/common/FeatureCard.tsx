import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { createFontStyles } from '../../constants/theme';

type FeatureCardProps = {
  iconName: React.ComponentProps<typeof Icon>['name'];
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ iconName, title, description }) => {
  const { colors } = useTheme();
  const fonts = createFontStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.placeholder }]}>
        <Icon name={iconName} size={30} color={colors.accent} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, fonts.subheading]}>{title}</Text>
        <Text style={[styles.description, fonts.caption]}>{description}</Text>
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