import React, { ReactNode } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/theme';

interface PrimaryButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  children?: ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
  children,
}) => {
  const { colors } = useTheme();

  // Define button styles based on props
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {
      opacity: disabled ? 0.7 : 1,
    };

    // Apply variant styles
    if (variant === 'primary') {
      buttonStyle.backgroundColor = colors.accent;
    } else if (variant === 'secondary') {
      buttonStyle.backgroundColor = colors.buttonSecondary;
    } else if (variant === 'outline') {
      buttonStyle.backgroundColor = 'transparent';
      buttonStyle.borderWidth = 1;
      buttonStyle.borderColor = colors.border;
    }

    // Apply size styles
    if (size === 'large') {
      buttonStyle.paddingVertical = SPACING.md;
      buttonStyle.paddingHorizontal = SPACING.lg;
    }

    // Apply width style
    if (fullWidth) {
      buttonStyle.width = '100%';
    }

    return buttonStyle;
  };

  // Define text styles based on props
  const getTextStyle = (): TextStyle => {
    let textStyleBase: TextStyle = {
      fontWeight: 'bold',
      fontSize: size === 'large' ? 18 : 16,
    };

    // Apply variant text color
    if (variant === 'primary') {
      textStyleBase.color = '#FFFFFF';
    } else if (variant === 'secondary') {
      textStyleBase.color = colors.buttonSecondaryText;
    } else if (variant === 'outline') {
      textStyleBase.color = colors.text;
    }

    return textStyleBase;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {title && (
        <Text style={[styles.buttonText, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    textAlign: 'center',
  },
});

export default PrimaryButton;