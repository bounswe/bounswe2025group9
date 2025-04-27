import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { SPACING } from '../../constants/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createFontStyles } from '../../constants/theme';

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
}) => {
  const { colors } = useTheme();
  const fonts = createFontStyles(colors);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }, style]} 
      onPress={onPress} 
      activeOpacity={0.7} 
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.placeholder }]}>
        <Icon name={iconName} size={40} color={colors.accent} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Icon name={iconName} size={16} color={colors.accent} />
          <Text style={[styles.title, fonts.subheading]}>{title}</Text>
        </View>
        <Text style={[styles.description, fonts.caption]}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  iconContainer: ViewStyle;
  textContainer: ViewStyle;
  titleRow: ViewStyle;
  title: TextStyle;
  description: TextStyle;
}>({
  container: {
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    flexDirection: 'row',
  },
  iconContainer: {
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
    marginLeft: SPACING.xs,
  },
  description: {},
});

export default FoodItem;