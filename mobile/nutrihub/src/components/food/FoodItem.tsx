import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface FoodItemProps {
  id: number;
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Icon>['name'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const FoodItem: React.FC<FoodItemProps> = ({
  title,
  description,
  iconName,
  onPress,
  style,
}) => (
  <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
    <View style={styles.iconContainer}>
      <Icon name={iconName} size={40} color={COLORS.lightGray} />
    </View>
    <View style={styles.textContainer}>
      <View style={styles.titleRow}>
        <Icon name={iconName} size={16} color={COLORS.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create<{
  container: ViewStyle;
  iconContainer: ViewStyle;
  textContainer: ViewStyle;
  titleRow: ViewStyle;
  title: TextStyle;
  description: TextStyle;
}>({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    flexDirection: 'row',
  },
  iconContainer: {
    backgroundColor: COLORS.darkGray,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    ...FONTS.subheading,
    marginLeft: SPACING.xs,
  },
  description: {
    ...FONTS.caption,
    color: COLORS.lightGray,
  },
});

export default FoodItem;
