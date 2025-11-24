/**
 * Avatar Component
 * 
 * Displays a user's profile image or a default icon if no image is available
 */

import React from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS } from '../../constants/theme';

interface AvatarProps {
  /**
   * URI of the profile image
   */
  uri?: string | null;
  
  /**
   * Size of the avatar in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Additional style for the container
   */
  style?: ViewStyle;
  
  /**
   * Additional style for the image
   */
  imageStyle?: ImageStyle;
}

const Avatar: React.FC<AvatarProps> = ({ 
  uri, 
  size = 24, 
  style,
  imageStyle 
}) => {
  const { theme } = useTheme();
  
  // Log for debugging
  if (__DEV__) {
    console.log('🖼️ Avatar render:', {
      hasUri: !!uri,
      uri: uri ? uri.substring(0, 50) + '...' : null,
      size,
    });
  }
  
  return (
    <View 
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.placeholder,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={(error) => {
            if (__DEV__) {
              console.error('❌ Avatar image load error:', {
                uri: uri.substring(0, 50) + '...',
                error: error.nativeEvent.error,
              });
            }
          }}
          onLoad={() => {
            if (__DEV__) {
              console.log('✅ Avatar image loaded successfully:', uri.substring(0, 50) + '...');
            }
          }}
        />
      ) : (
        <Icon 
          name="account-circle" 
          size={size} 
          color={theme.primary} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Avatar;

