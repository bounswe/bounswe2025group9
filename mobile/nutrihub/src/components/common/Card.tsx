/**
 * Card Component
 * 
 * A flexible card component for displaying content with consistent styling.
 * 
 * Usage:
 * ```tsx
 * // Basic card
 * <Card>
 *   <Text>Simple card content</Text>
 * </Card>
 * 
 * // Card with header and footer
 * <Card
 *   header={<Text style={styles.headerText}>Card Title</Text>}
 *   footer={<Button title="Action" onPress={handleAction} />}
 * >
 *   <Text>Card content</Text>
 * </Card>
 * 
 * // Pressable card
 * <Card onPress={handleCardPress}>
 *   <Text>Click this card</Text>
 * </Card>
 * 
 * // Card with custom styles
 * <Card 
 *   style={{ marginVertical: 20 }}
 *   contentStyle={{ padding: 25 }}
 * >
 *   <Text>Custom styled card</Text>
 * </Card>
 * ```
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CardProps {
  /**
   * Card contents
   */
  children: ReactNode;
  
  /**
   * Optional header component to display at the top of the card
   */
  header?: ReactNode;
  
  /**
   * Optional footer component to display at the bottom of the card
   */
  footer?: ReactNode;
  
  /**
   * Function to call when card is pressed
   * If provided, the card becomes pressable
   */
  onPress?: (event: GestureResponderEvent) => void;
  
  /**
   * Additional style to apply to the card container
   */
  style?: ViewStyle;
  
  /**
   * Additional style to apply to the card content area
   */
  contentStyle?: ViewStyle;
  
  /**
   * Additional style to apply to the card header area
   */
  headerStyle?: ViewStyle;
  
  /**
   * Additional style to apply to the card footer area
   */
  footerStyle?: ViewStyle;
  
  /**
   * Whether to add elevation/shadow to the card
   * @default true
   */
  elevated?: boolean;
  
  /**
   * Whether to disable the slight opacity change when card is pressed
   * Only applicable when onPress is provided
   * @default false
   */
  disableActiveOpacity?: boolean;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * A flexible card component for displaying content with consistent styling
 */
const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  onPress,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  elevated = true,
  disableActiveOpacity = false,
  testID,
}) => {
  const { theme } = useTheme();
  
  // Base container styles
  const containerStyle = [
    styles.container,
    { 
      backgroundColor: theme.card, 
      borderColor: theme.border 
    },
    elevated && SHADOWS.small,
    style,
  ];
  
  // Render card content
  const renderContent = () => (
    <>
      {/* Header */}
      {header && (
        <View style={[styles.header, { borderBottomColor: theme.divider }, headerStyle]}>
          {header}
        </View>
      )}
      
      {/* Content */}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
      
      {/* Footer */}
      {footer && (
        <View style={[styles.footer, { borderTopColor: theme.divider }, footerStyle]}>
          {footer}
        </View>
      )}
    </>
  );
  
  // Render as touchable if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={disableActiveOpacity ? 1 : 0.8}
        testID={testID}
        accessibilityRole="button"
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
  
  // Otherwise render as a plain view
  return (
    <View style={containerStyle} testID={testID}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  content: {
    padding: SPACING.md,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
});

export default Card;