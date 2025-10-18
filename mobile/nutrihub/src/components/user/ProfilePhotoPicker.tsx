import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({ uri, onUploaded, onRemoved, uploading, removable = true, editable = true }) => {
  const { theme, textStyles } = useTheme();
  const [localUploading, setLocalUploading] = useState(false);

  const isUploading = uploading || localUploading;

  const validateFile = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    const extOk = asset.mimeType?.includes('jpeg') || asset.mimeType?.includes('png') || asset.uri.toLowerCase().endsWith('.jpg') || asset.uri.toLowerCase().endsWith('.jpeg') || asset.uri.toLowerCase().endsWith('.png');
    if (!extOk) return 'Only JPEG or PNG images are allowed.';

    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (!info.exists) return 'File not found.';
      if (info.size && info.size > MAX_SIZE_BYTES) return 'Image must be up to 5 MB.';
    } catch (e) {
      return 'Could not validate file size.';
    }
    return null;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const error = await validateFile(asset);
    if (error) {
      Alert.alert('Invalid image', error);
      return;
    }

    try {
      setLocalUploading(true);
      const name = asset.fileName || asset.uri.split('/').pop() || 'profile.jpg';
      // Delegate the actual upload to parent to keep this component flexible
      // Parent should call userService.uploadProfilePhoto and then onUploaded(remoteUrl)
      onUploaded(asset.uri);
    } finally {
      setLocalUploading(false);
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
      </View>
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
});

export default ProfilePhotoPicker;


