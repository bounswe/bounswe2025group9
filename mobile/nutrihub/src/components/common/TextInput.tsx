/**
 * TextInput Component
 * 
 * A customizable text input component that supports various visual styles and states.
 * 
 * Usage:
 * ```tsx
 * // Basic input
 * <TextInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 * />
 * 
 * // Password input with toggle
 * <TextInput
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 *   toggleSecureEntry
 * />
 * 
 * // Input with error
 * <TextInput
 *   label="Username"
 *   value={username}
 *   onChangeText={setUsername}
 *   error="Username is already taken"
 * />
 * 
 * // Input with helper text
 * <TextInput
 *   label="Full Name"
 *   value={name}
 *   onChangeText={setName}
 *   helperText="Please enter your legal name as it appears on your ID"
 * />
 * 
 * // Input with icon
 * <TextInput
 *   label="Search"
 *   value={search}
 *   onChangeText={setSearch}
 *   iconName="magnify"
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /**
   * Label text to display above the input
   */
  label?: string;
  
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  
  /**
   * Error message to display below the input
   */
  error?: string;
  
  /**
   * Container style override
   */
  containerStyle?: ViewStyle;
  
  /**
   * Input style override
   */
  inputStyle?: TextStyle;
  
  /**
   * Label style override
   */
  labelStyle?: TextStyle;
  
  /**
   * Whether to show a toggle for secure text entry
   * Only applicable when secureTextEntry is true
   * @default false
   */
  toggleSecureEntry?: boolean;
  
  /**
   * Icon name from MaterialCommunityIcons to display at the left of the input
   */
  iconName?: React.ComponentProps<typeof Icon>['name'];
  
  /**
   * Function to call when the clear button is pressed
   */
  onClear?: () => void;
  
  /**
   * Whether to show a clear button when the input has text
   * @default false
   */
  clearButton?: boolean;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * A customizable text input component
 */
const TextInput: React.FC<TextInputProps> = ({
  label,
  helperText,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  secureTextEntry = false,
  toggleSecureEntry = false,
  iconName,
  onClear,
  clearButton = false,
  value,
  testID,
  ...restProps
}) => {
  const { theme, textStyles } = useTheme();
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(!secureTextEntry);
  
  // Handle secure text toggle
  const toggleSecureTextVisibility = () => {
    setIsSecureTextVisible(prev => !prev);
  };
  
  // Handle text clearing
  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text 
          style={[
            styles.label, 
            { color: theme.text },
            labelStyle
          ]}
        >
          {label}
        </Text>
      )}
    
    {/* Input container */}
    <View 
      style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.inputBackground,
          borderColor: error ? theme.error : theme.border,
        }
      ]}
    >
      {/* Left icon */}
      {iconName && (
        <Icon 
          name={iconName} 
          size={20} 
          color={theme.textSecondary} 
          style={styles.icon}
        />
      )}
      
      {/* Text input */}
      <RNTextInput
        style={[
          styles.input, 
          { color: theme.text },
          inputStyle
        ]}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry && !isSecureTextVisible}
        value={value}
        testID={testID}
        {...restProps}
      />
      
      {/* Right buttons (clear or toggle secure entry) */}
      <View style={styles.rightContainer}>
        {/* Clear button */}
        {clearButton && value && value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
            <Icon name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Toggle secure entry button */}
        {secureTextEntry && toggleSecureEntry && (
          <TouchableOpacity onPress={toggleSecureTextVisibility} style={styles.iconButton}>
            <Icon 
              name={isSecureTextVisible ? 'eye-off' : 'eye'} 
              size={20} 
              color={theme.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
    
    {/* Helper text or error message */}
    {(helperText || error) && (
      <Text 
        style={[
          styles.helperText,
          { 
            color: error ? theme.error : theme.textSecondary,
            fontWeight: error ? '500' : '400'
          },
        ]}
      >
        {error || helperText}
      </Text>
    )}
  </View>
);
};

const styles = StyleSheet.create({
container: {
  marginBottom: SPACING.md,
},
label: {
  ...TYPOGRAPHY.body,
  marginBottom: SPACING.xs,
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: BORDER_RADIUS.sm,
  overflow: 'hidden',
},
input: {
  flex: 1,
  paddingHorizontal: SPACING.sm,
  paddingVertical: SPACING.sm,
  ...TYPOGRAPHY.body,
},
icon: {
  marginLeft: SPACING.sm,
},
rightContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
iconButton: {
  padding: SPACING.sm,
},
helperText: {
  ...TYPOGRAPHY.small,
  marginTop: SPACING.xs,
},
});

export default TextInput;
