import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ProfessionTag, PROFESSION_TAGS, ProfessionTagType } from '../../types/types';

const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_CERTIFICATE_FORMATS = ['pdf', 'jpg', 'jpeg', 'png'];

const ProfessionTagsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ProfessionTagType | null>(null);
  const [certificateUri, setCertificateUri] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState('');

  // Load user's profession tags on mount
  useEffect(() => {
    loadProfessionTags();
  }, []);

  const loadProfessionTags = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const tagsData = await userService.getProfessionTags();
      // setProfessionTags(tagsData);
      
      // Mock data for now
      const mockTags: ProfessionTag[] = [
        {
          id: 1,
          name: 'Dietitian',
          is_verified: true,
          certificate_url: 'https://example.com/cert1.pdf',
          certificate_name: 'Registered Dietitian Certificate',
          created_at: new Date('2023-01-15'),
          verified_at: new Date('2023-02-01'),
          verified_by: 'Community Moderator'
        },
        {
          id: 2,
          name: 'Chef',
          is_verified: false,
          created_at: new Date('2024-01-01')
        }
      ];
      
      setProfessionTags(mockTags);
    } catch (err) {
      console.error('Error loading profession tags:', err);
      Alert.alert('Error', 'Failed to load profession tags');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddTag = () => {
    setShowAddModal(true);
  };

  const handleSelectTag = (tag: ProfessionTagType) => {
    setSelectedTag(tag);
  };

  const handleUploadCertificate = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library access to upload certificates.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      
      // Validate file
      const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
      const mimeTypeValid = asset.mimeType?.includes('jpeg') || asset.mimeType?.includes('png') || asset.mimeType?.includes('pdf');
      const extensionValid = fileExtension && SUPPORTED_CERTIFICATE_FORMATS.includes(fileExtension);
      
      if (!mimeTypeValid && !extensionValid) {
        Alert.alert('Invalid File', 'Only PDF, JPEG, and PNG files are supported for certificates.');
        return;
      }

      try {
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.size && info.size > MAX_CERTIFICATE_SIZE) {
          const sizeMB = (info.size / (1024 * 1024)).toFixed(1);
          Alert.alert('File Too Large', `Certificate size (${sizeMB}MB) exceeds the maximum allowed size of 10MB.`);
          return;
        }
      } catch (e) {
        console.warn('File system validation failed, backend will validate:', e);
      }

      setCertificateUri(asset.uri);
      setCertificateName(asset.fileName || `certificate_${Date.now()}.${fileExtension}`);
    } catch (error) {
      Alert.alert('Error', `Failed to select certificate: ${error.message}`);
    }
  };

  const handleSaveTag = async () => {
    if (!selectedTag) {
      Alert.alert('Error', 'Please select a profession tag');
      return;
    }

    setSaving(true);
    try {
      // TODO: Replace with actual API call
      // await userService.addProfessionTag({
      //   name: selectedTag,
      //   certificate_uri: certificateUri,
      //   certificate_name: certificateName
      // });
      
      const newTag: ProfessionTag = {
        id: Date.now(),
        name: selectedTag,
        is_verified: false,
        certificate_url: certificateUri || undefined,
        certificate_name: certificateName || undefined,
        created_at: new Date()
      };

      setProfessionTags(prev => [...prev, newTag]);
      setShowAddModal(false);
      setSelectedTag(null);
      setCertificateUri(null);
      setCertificateName('');
      
      Alert.alert('Success', 'Profession tag added successfully. It will be reviewed by moderators for verification.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add profession tag. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    Alert.alert(
      'Remove Profession Tag',
      'Are you sure you want to remove this profession tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await userService.removeProfessionTag(tagId);
              
              setProfessionTags(prev => prev.filter(tag => tag.id !== tagId));
              Alert.alert('Success', 'Profession tag removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profession tag');
            }
          }
        }
      ]
    );
  };

  const renderTagItem = ({ item }: { item: ProfessionTag }) => (
    <View style={[styles.tagCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.tagHeader}>
        <View style={styles.tagInfo}>
          <Text style={[textStyles.subtitle, { color: theme.text }]}>
            {item.name}
          </Text>
          <View style={styles.verificationStatus}>
            {item.is_verified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                <Icon name="check-circle" size={14} color="#fff" />
                <Text style={[textStyles.caption, { color: '#fff' }]}>Verified</Text>
              </View>
            ) : (
              <View style={[styles.unverifiedBadge, { backgroundColor: theme.warning }]}>
                <Icon name="clock" size={14} color="#fff" />
                <Text style={[textStyles.caption, { color: '#fff' }]}>Unverified</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.error }]}
          onPress={() => handleRemoveTag(item.id)}
        >
          <Icon name="delete" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {item.certificate_name && (
        <View style={styles.certificateInfo}>
          <Icon name="certificate" size={16} color={theme.primary} />
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Certificate: {item.certificate_name}
          </Text>
        </View>
      )}

      {item.is_verified && item.verified_at && (
        <View style={styles.verificationDetails}>
          <Text style={[textStyles.small, { color: theme.textSecondary }]}>
            Verified on {item.verified_at.toLocaleDateString()} by {item.verified_by}
          </Text>
        </View>
      )}

      <Text style={[textStyles.small, { color: theme.textSecondary }]}>
        Added on {item.created_at.toLocaleDateString()}
      </Text>
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Text style={[textStyles.body, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[textStyles.heading4, { color: theme.text }]}>Add Profession Tag</Text>
          <TouchableOpacity onPress={handleSaveTag} disabled={!selectedTag || saving}>
            <Text style={[textStyles.body, { color: selectedTag ? theme.primary : theme.textDisabled }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[textStyles.body, { color: theme.text, fontWeight: '600', marginBottom: SPACING.md }]}>
              Select Profession
            </Text>
            <View style={styles.tagGrid}>
              {PROFESSION_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagOption,
                    {
                      backgroundColor: selectedTag === tag ? theme.primary : theme.surface,
                      borderColor: selectedTag === tag ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => handleSelectTag(tag)}
                >
                  <Text style={[
                    textStyles.body,
                    { color: selectedTag === tag ? '#fff' : theme.text }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[textStyles.body, { color: theme.text, fontWeight: '600', marginBottom: SPACING.md }]}>
              Upload Certificate (Optional)
            </Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md }]}>
              Upload a certificate to support your profession claim. This will be reviewed by moderators.
            </Text>
            
            {certificateUri ? (
              <View style={[styles.certificatePreview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icon name="file-document" size={24} color={theme.primary} />
                <Text style={[textStyles.body, { color: theme.text }]} numberOfLines={1}>
                  {certificateName}
                </Text>
                <TouchableOpacity onPress={() => setCertificateUri(null)}>
                  <Icon name="close" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.primary }]}
                onPress={handleUploadCertificate}
              >
                <Icon name="upload" size={20} color="#fff" />
                <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
                  Upload Certificate
                </Text>
              </TouchableOpacity>
            )}
            
            <Text style={[textStyles.small, { color: theme.textSecondary, marginTop: SPACING.sm }]}>
              Supported formats: PDF, JPEG, PNG. Maximum size: 10MB
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading profession tags...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Profession Tags</Text>
        <TouchableOpacity onPress={handleAddTag} style={styles.addButton}>
          <Icon name="plus" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={professionTags}
        renderItem={renderTagItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="badge-account" size={64} color={theme.textSecondary} />
            <Text style={[textStyles.heading4, { color: theme.text, marginTop: SPACING.md }]}>
              No Profession Tags
            </Text>
            <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>
              Add your profession tags to showcase your expertise
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.primary }]}
              onPress={handleAddTag}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
                Add Your First Tag
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {renderAddModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  tagCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tagInfo: {
    flex: 1,
  },
  verificationStatus: {
    marginTop: SPACING.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  removeButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verificationDetails: {
    marginBottom: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  certificatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfessionTagsScreen;
