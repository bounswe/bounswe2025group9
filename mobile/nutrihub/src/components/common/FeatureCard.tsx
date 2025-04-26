import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';  

// Extract the exact union type of valid icon names
type IconName = React.ComponentProps<typeof Icon>['name'];

interface FeatureCardProps {
  title: string;
  description: string;
  iconName: IconName;  // use the extracted union type
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, iconName }) => {
  return (
    <View style={styles.card}>
      <Icon name={iconName} size={30} color={COLORS.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  title: {
    ...FONTS.subheading,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },

  
  description: {
    ...FONTS.caption,
    lineHeight: 18,
  },
});
 
export default FeatureCard;
