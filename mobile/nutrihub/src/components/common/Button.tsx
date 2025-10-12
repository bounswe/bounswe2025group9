/**
 * Button Component
 * 
 * A flexible button component that supports multiple variants, sizes, and states.
 * 
 * Usage:
 * ```tsx
 * // Primary button
 * <Button title="Submit" onPress={handleSubmit} />
 * 
 * // Secondary button
 * <Button title="Cancel" variant="secondary" onPress={handleCancel} />
 * 
 * // Outline button
 * <Button title="View Details" variant="outline" onPress={handleViewDetails} />
 * 
 * // Large button that takes full width
 * <Button title="Sign Up" size="large" fullWidth onPress={handleSignUp} />
 * 
 * // Disabled button
 * <Button title="Submit" disabled onPress={handleSubmit} />
 * 
 * // Button with icon
 * <Button 
 *   title="Add to Cart"
 *   iconName="cart-plus"
 *   iconPosition="left"
 *   onPress={handleAddToCart}
 * />
 * 
 * // Loading button
 * <Button title="Processing..." loading onPress={handleProcess} />
 * ```
 */

import React, { ReactNode } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
  GestureResponderEvent,
  AccessibilityProps
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, PALETTE } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'text';
export type ButtonSize = 'small' | 'default' | 'large';
export type IconPosition = 'left' | 'right';

interface ButtonProps extends AccessibilityProps {
  /**
   * Text to display on the button
   */
  title?: string;
  
  /**
   * Function to call when button is pressed
   */
  onPress: (event: GestureResponderEvent) => void;
  
  /**
   * Visual style of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Size of the button
   * @default 'default'
   */
  size?: ButtonSize;
  
  /**
   * Whether button should take up full available width
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Additional styles to apply to the button container
   */
  style?: ViewStyle;
  
  /**
   * Additional styles to apply to the button text
   */
  textStyle?: TextStyle;
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether to show a loading indicator
   * @default false
   */
  loading?: boolean;
  
  /**
   * Name of the icon to display (from MaterialCommunityIcons)
   */
  iconName?: React.ComponentProps<typeof Icon>['name'];
  
  /**
   * Position of the icon relative to the text
   * @default 'left'
   */
  iconPosition?: IconPosition;
  
  /**
   * Custom children elements to display inside the button
   * (overrides title and icon if provided)
   */
  children?: ReactNode;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * A customizable button component supporting various visual styles and states
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
  loading = false,
  iconName,
  iconPosition = 'left',
  children,
  testID,
  ...accessibilityProps
}) => {
  const { theme, themeType } = useTheme();

  // Determine button container styles based on props
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {
      opacity: disabled ? 0.7 : 1,
    };

    // Apply variant styles
    switch (variant) {
      case 'primary':
        buttonStyle.backgroundColor = theme.primary;
        break;
      case 'secondary':
        buttonStyle.backgroundColor = theme.secondary;
        break;
      case 'outline':
        buttonStyle.backgroundColor = 'transparent';
        buttonStyle.borderWidth = 1;
        buttonStyle.borderColor = theme.border;
        break;
      case 'danger':
        buttonStyle.backgroundColor = theme.error;
        break;
      case 'success':
        buttonStyle.backgroundColor = theme.success;
        break;
      case 'text':
        buttonStyle.backgroundColor = 'transparent';
        break;
      default:
        buttonStyle.backgroundColor = theme.primary;
    }

    // Apply size styles
    switch (size) {
      case 'small':
        buttonStyle.paddingVertical = SPACING.xs;
        buttonStyle.paddingHorizontal = SPACING.sm;
        buttonStyle.borderRadius = BORDER_RADIUS.xs;
        break;
      case 'large':
        buttonStyle.paddingVertical = SPACING.md;
        buttonStyle.paddingHorizontal = SPACING.lg;
        buttonStyle.borderRadius = BORDER_RADIUS.md;
        break;
      default:
        buttonStyle.paddingVertical = SPACING.sm;
        buttonStyle.paddingHorizontal = SPACING.md;
        buttonStyle.borderRadius = BORDER_RADIUS.sm;
    }

    // Apply width style
    if (fullWidth) {
      buttonStyle.width = '100%';
    }

    return buttonStyle;
  };

  // Determine text styles based on props
  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      small: { ...TYPOGRAPHY.small },
      default: { ...TYPOGRAPHY.body },
      large: { ...TYPOGRAPHY.subtitle }
    };
    
    let textStyleBase: TextStyle = {
      ...sizeStyles[size],
      fontWeight: '600',
    };

    // Apply variant text color
    switch (variant) {
      case 'primary':
        textStyleBase.color = PALETTE.ACCENT.CONTRAST;
        break;
      case 'secondary':
        textStyleBase.color = themeType === 'dark' 
          ? PALETTE.NEUTRAL.WHITE
          : PALETTE.PRIMARY.CONTRAST;
        break;
      case 'danger':
        textStyleBase.color = PALETTE.ERROR.CONTRAST;
        break;
      case 'success':
        textStyleBase.color = PALETTE.SUCCESS.CONTRAST;
        break;
      case 'outline':
      case 'text':
        textStyleBase.color = theme.primary;
        break;
      default:
        textStyleBase.color = PALETTE.ACCENT.CONTRAST;
    }

    return textStyleBase;
  };

  // Determine icon color based on variant
  const getIconColor = (): string => {
    switch (variant) {
      case 'primary':
        return PALETTE.ACCENT.CONTRAST;
      case 'secondary':
        return themeType === 'dark' 
          ? PALETTE.NEUTRAL.WHITE
          : PALETTE.PRIMARY.CONTRAST;
      case 'danger':
        return PALETTE.ERROR.CONTRAST;
      case 'success':
        return PALETTE.SUCCESS.CONTRAST;
      case 'outline':
      case 'text':
        return theme.primary;
      default:
        return PALETTE.ACCENT.CONTRAST;
    }
  };

  // Get icon size based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // Render icon if provided
  const renderIcon = () => {
    if (!iconName) return null;
    
    return (
      <Icon 
        name={iconName} 
        size={getIconSize()} 
        color={getIconColor()} 
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
      {...accessibilityProps}
    >
      {children ? (
        children
      ) : (
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator 
              size={size === 'small' ? 'small' : 'small'} 
              color={getIconColor()} 
            />
          ) : (
            <>
              {iconPosition === 'left' && renderIcon()}
              {title && (
                <Text 
                  style={[styles.buttonText, getTextStyle(), textStyle]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {iconPosition === 'right' && renderIcon()}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});

export default Button;