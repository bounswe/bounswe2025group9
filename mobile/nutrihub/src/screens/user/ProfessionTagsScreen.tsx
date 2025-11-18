import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ProfessionTag, PROFESSION_TAGS } from '../../types/types';
import { userService } from '../../services/api/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfessionTagsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);

  // Save profession tags to AsyncStorage
  const saveProfessionTagsToStorage = async (tags: ProfessionTag[]) => {
    try {
      await AsyncStorage.setItem('profession_tags_cache', JSON.stringify(tags));
    } catch (error) {
      console.error('Error saving profession tags to storage:', error);
    }
  };

  // Load profession tags from AsyncStorage
  const loadProfessionTagsFromStorage = async (): Promise<ProfessionTag[]> => {
    try {
      const cached = await AsyncStorage.getItem('profession_tags_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error loading profession tags from storage:', error);
      return [];
    }
  };

  useEffect(() => {
    loadProfessionTags();
  }, []);

  // Note: Removed useFocusEffect to prevent data loss when navigating back to screen
  // The data is already loaded in useEffect and maintained in local state

  const loadProfessionTags = async () => {
    setLoading(true);
    try {
      console.log('Loading profession tags...');
      
      // Load from server
      const serverTags = await userService.getProfessionTags();
      console.log('🔍 Server profession tags:', JSON.stringify(serverTags, null, 2));
      
      // Load from cache
      const cachedTags = await loadProfessionTagsFromStorage();
      console.log('💾 Cached profession tags:', JSON.stringify(cachedTags, null, 2));
      
      // Merge server data with cached certificate data
      const mergedTags = serverTags.map(serverTag => {
        const cachedTag = cachedTags.find(cached => cached.id === serverTag.id);
        const mergedTag = {
          ...serverTag,
          // Prioritize cached certificate data over server data
          certificate: cachedTag?.certificate || serverTag.certificate
        };
        console.log(`Tag ${serverTag.id} (${serverTag.name}):`, {
          serverCertificate: serverTag.certificate,
          cachedCertificate: cachedTag?.certificate,
          finalCertificate: mergedTag.certificate
        });
        return mergedTag;
      });
      
      console.log('🔄 Merged profession tags:', JSON.stringify(mergedTags, null, 2));
      setProfessionTags(mergedTags);
      
      // Save merged data to cache
      await saveProfessionTagsToStorage(mergedTags);
      
      // Get available tags that user doesn't have
      const userTagNames = mergedTags.map(tag => tag.name);
      const available = PROFESSION_TAGS.filter(tag => !userTagNames.includes(tag));
      setAvailableTags(available);
    } catch (error) {
      console.error('Error loading profession tags:', error);
      Alert.alert('Error', `Failed to load profession tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addProfessionTag = async (tagName: string) => {
    try {
      console.log('Adding profession tag:', tagName);
      const newTags = await userService.setProfessionTags([
        ...professionTags.map(tag => ({ name: tag.name, verified: tag.verified })),
        { name: tagName, verified: false }
      ]);
      console.log('API returned tags:', newTags);
      setProfessionTags(newTags);
      
      // Save to cache
      await saveProfessionTagsToStorage(newTags);
      
      // Update available tags
      const userTagNames = newTags.map(tag => tag.name);
      const available = PROFESSION_TAGS.filter(tag => !userTagNames.includes(tag));
      setAvailableTags(available);
    } catch (error) {
      console.error('Error adding profession tag:', error);
      Alert.alert('Error', `Failed to add profession tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const removeProfessionTag = async (tagId: number) => {
    try {
      console.log('Removing profession tag:', tagId);
      const updatedTags = professionTags.filter(tag => tag.id !== tagId);
      await userService.setProfessionTags(
        updatedTags.map(tag => ({ name: tag.name, verified: tag.verified }))
      );
      setProfessionTags(updatedTags);
      
      // Save to cache
      await saveProfessionTagsToStorage(updatedTags);
      
      // Update available tags
      const userTagNames = updatedTags.map(tag => tag.name);
      const available = PROFESSION_TAGS.filter(tag => !userTagNames.includes(tag));
      setAvailableTags(available);
    } catch (error) {
      console.error('Error removing profession tag:', error);
      Alert.alert('Error', 'Failed to remove profession tag');
    }
  };

  const removeCertificate = async (tagId: number) => {
    try {
      console.log('Removing certificate for tag:', tagId);
      // Update the tag to remove the certificate
      const updatedTag = await userService.removeCertificate(tagId);
      console.log('Certificate removal successful:', updatedTag);
      
      // Update the tag in the list
      const newTags = professionTags.map(tag => tag.id === tagId ? updatedTag : tag);
      setProfessionTags(newTags);
      
      // Save to cache
      await saveProfessionTagsToStorage(newTags);
      
      // Clear cache if certificate was removed
      if (!updatedTag.certificate) {
        console.log('Certificate removed, clearing cache for tag:', tagId);
      }
    } catch (error) {
      console.error('Error removing certificate:', error);
      Alert.alert('Error', `Failed to remove certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const uploadCertificate = async (tagId: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log('Uploading certificate for tag:', tagId, 'File:', file.name);
      setUploading(tagId);

      const updatedTag = await userService.uploadCertificate(
        tagId,
        file.uri,
        file.name
      );

      console.log('✅ Certificate upload successful:', updatedTag);
      // Update the tag in the list
      const newTags = professionTags.map(tag => tag.id === tagId ? updatedTag : tag);
      setProfessionTags(newTags);
      
      // Save to cache
      console.log('💾 Saving to cache:', JSON.stringify(newTags, null, 2));
      await saveProfessionTagsToStorage(newTags);
      console.log('✅ Cache saved successfully');
    } catch (error) {
      console.error('Error uploading certificate:', error);
      Alert.alert('Error', `Failed to upload certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(null);
    }
  };

  const viewDocument = async (certificateUrl: string) => {
    try {
      console.log('Opening document:', certificateUrl);
      await WebBrowser.openBrowserAsync(certificateUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: theme.primary,
      });
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document. Please try again.');
    }
  };

  const renderProfessionTag = ({ item }: { item: ProfessionTag }) => (
    <View style={[styles.tagItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.tagContent}>
        <View style={styles.tagHeader}>
          <Text style={[textStyles.heading4, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.tagStatus}>
            {item.verified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                <Icon name="check-circle" size={16} color="#fff" />
                <Text style={[textStyles.small, { color: '#fff' }]}>Verified</Text>
              </View>
            ) : (
              <View style={[styles.unverifiedBadge, { backgroundColor: theme.warning }]}>
                <Icon name="clock-outline" size={16} color="#fff" />
                <Text style={[textStyles.small, { color: '#fff' }]}>Unverified</Text>
              </View>
            )}
          </View>
        </View>
        
        {item.certificate && (
          <View style={styles.certificateInfo}>
            <Icon name="certificate" size={16} color={theme.primary} />
            <Text style={[textStyles.caption, { color: theme.primary }]}>
              Document uploaded
            </Text>
            <TouchableOpacity
              style={[styles.viewDocumentButton, { borderColor: theme.primary }]}
              onPress={() => viewDocument(item.certificate!)}
            >
              <Icon name="eye" size={14} color={theme.primary} />
              <Text style={[textStyles.small, { color: theme.primary }]}>
                View Document
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tagActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => uploadCertificate(item.id)}
            disabled={uploading === item.id}
          >
            {uploading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name={item.certificate ? "file-document-edit" : "upload"} size={16} color="#fff" />
            )}
            <Text style={[textStyles.caption, { color: '#fff' }]}>
              {uploading === item.id 
                ? 'Uploading...' 
                : item.certificate 
                  ? 'Replace Document' 
                  : 'Upload Document'
              }
            </Text>
          </TouchableOpacity>
          
          {item.certificate && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton, { borderColor: theme.warning }]}
              onPress={() => removeCertificate(item.id)}
            >
              <Icon name="file-document-remove" size={16} color={theme.warning} />
              <Text style={[textStyles.caption, { color: theme.warning }]}>Remove Document</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton, { borderColor: theme.error }]}
            onPress={() => removeProfessionTag(item.id)}
          >
            <Icon name="delete" size={16} color={theme.error} />
            <Text style={[textStyles.caption, { color: theme.error }]}>Remove Tag</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAvailableTag = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.availableTag, { backgroundColor: theme.primary }]}
      onPress={() => addProfessionTag(item)}
    >
      <Icon name="plus" size={16} color="#fff" />
      <Text style={[textStyles.caption, { color: '#fff' }]}>{item}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text, marginTop: SPACING.md }]}>
            Loading profession tags...
          </Text>
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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Tags */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
            My Profession Tags
          </Text>
          
          {professionTags.length > 0 ? (
            <FlatList
              data={professionTags}
              renderItem={renderProfessionTag}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="badge-account" size={48} color={theme.textSecondary} />
              <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center' }]}>
                No profession tags added yet
              </Text>
            </View>
          )}
        </View>

        {/* Available Tags */}
        {availableTags.length > 0 && (
          <View style={styles.section}>
            <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
              Add Profession Tag
            </Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md }]}>
              Select a profession tag to add to your profile
            </Text>
            
            <View style={styles.availableTagsContainer}>
              {availableTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.availableTag, { backgroundColor: theme.primary }]}
                  onPress={() => addProfessionTag(tag)}
                >
                  <Icon name="plus" size={16} color="#fff" />
                  <Text style={[textStyles.caption, { color: '#fff' }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="information" size={20} color={theme.primary} />
          <View style={styles.infoContent}>
            <Text style={[textStyles.caption, { color: theme.text }]}>
              Profession tags help establish your expertise. Upload documents to get verified badges.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  tagItem: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  tagContent: {
    flex: 1,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tagStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  tagActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  availableTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  separator: {
    height: SPACING.sm,
  },
  infoSection: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfessionTagsScreen;
