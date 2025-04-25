import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  variant = 'primary',
  fullWidth = false,
  style,
  disabled = false,
  ...rest
}) => {
  const containerStyles: StyleProp<ViewStyle>[] = [
    styles.button,
    variant === 'secondary' && styles.secondaryButton,
    fullWidth && styles.fullWidth,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles: StyleProp<TextStyle>[] = [
    styles.buttonText,
    variant === 'secondary' && styles.secondaryButtonText,
    disabled && styles.disabledButtonText,
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="button"
      {...rest}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create<{
  button: ViewStyle;
  secondaryButton: ViewStyle;
  fullWidth: ViewStyle;
  disabledButton: ViewStyle;
  buttonText: TextStyle;
  secondaryButtonText: TextStyle;
  disabledButtonText: TextStyle;
}>({
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SPACING.xxl, // use spacing constant instead of literal
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  fullWidth: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    ...FONTS.body,            // use theme font
    color: COLORS.white,
    fontWeight: FONTS.body.fontWeight, // ensure bold if needed
  },
  secondaryButtonText: {
    ...FONTS.body,
    color: COLORS.accent,
  },
  disabledButtonText: {
    ...FONTS.body,
    color: COLORS.lightGray,
  },
});

export default PrimaryButton;
