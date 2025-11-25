import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

export interface ProfilePhotoPickerProps {
  uri?: string | null;
  onUploaded: (remoteUrl: string) => void;
  onRemoved: () => void;
  uploading?: boolean;
  removable?: boolean;
  editable?: boolean; // Hide actions if false
  showFormatInfo?: boolean;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png'];

const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  uri,
  onUploaded,
  onRemoved,
  uploading,
  removable = true,
  editable = true,
  showFormatInfo = true,
}) => {
  const { theme, textStyles } = useTheme();
  const [localUploading, setLocalUploading] = useState(false);

  const isUploading = uploading || localUploading;

  const validateFile = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    // Check file format
    const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
    const mimeTypeValid = asset.mimeType?.includes('jpeg') || asset.mimeType?.includes('png');
    const extensionValid = fileExtension && SUPPORTED_FORMATS.includes(fileExtension);
    
    if (!mimeTypeValid && !extensionValid) {
      return `Only JPEG and PNG images are supported. Supported formats: ${SUPPORTED_FORMATS.join(', ')}.`;
    }

    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (!info.exists) return 'File not found.';
      
      // Check file size if available
      if (info.size !== undefined) {
        if (info.size > MAX_SIZE_BYTES) {
          const sizeMB = (info.size / (1024 * 1024)).toFixed(1);
          return `Image size (${sizeMB}MB) exceeds the maximum allowed size of 5MB.`;
        }
      }
    } catch (e) {
      // If file system access fails, let the backend handle validation
      console.warn('File system validation failed, backend will validate:', e);
    }
    return null;
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library access to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false, // Remove EXIF data for privacy
        base64: false, // Don't include base64 to reduce memory usage
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const error = await validateFile(asset);
      if (error) {
        Alert.alert('Invalid image', error);
        return;
      }

      try {
        setLocalUploading(true);
        onUploaded(asset.uri);
      } finally {
        setLocalUploading(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to open image picker: ${message}`);
    }
  };

  const removeImage = () => {
    if (!removable) return;
    Alert.alert('Remove photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemoved },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.photoArea, { backgroundColor: theme.placeholder }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <Icon name="account" size={40} color={theme.primary} />
        )}
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>
      
      {/* File format and size information */}
      {showFormatInfo && (
        <Text style={[textStyles.small, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.xs }]}>
          Supported formats: JPEG, PNG. Maximum size: 5MB
        </Text>
      )}
      
      {editable && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={pickImage} disabled={isUploading}>
            <Icon name="image" size={16} color="#fff" />
            <Text style={[styles.buttonText, textStyles.caption, { color: '#fff' }]}>{isUploading ? 'Uploading...' : (uri ? 'Change photo' : 'Upload photo')}</Text>
          </TouchableOpacity>
          {uri && removable && (
            <TouchableOpacity style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]} onPress={removeImage} disabled={isUploading}>
              <Icon name="delete" size={16} color={theme.text} />
              <Text style={[styles.buttonText, textStyles.caption]}>{'Remove'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoArea: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: 6,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfilePhotoPicker;

