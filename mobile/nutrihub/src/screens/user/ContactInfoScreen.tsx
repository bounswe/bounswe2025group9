import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { User, PrivacySettings } from '../../types/types';

const ContactInfoScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Contact information fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_email: true,
    show_phone: true,
    show_location: true,
    show_profession_tags: true,
    show_recipes: true,
    show_posts: true,
    show_badges: true,
  });

  // Load user's contact information on mount
  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const userInfo = await userService.getContactInfo();
      // setEmail(userInfo.email || '');
      // setPhone(userInfo.phone || '');
      // setLocation(userInfo.location || '');
      // setWebsite(userInfo.website || '');
      // setAddress(userInfo.address || '');
      // setPrivacySettings(userInfo.privacy_settings || defaultPrivacySettings);
      
      // Mock data for now
      setEmail('user@example.com');
      setPhone('+1 (555) 123-4567');
      setLocation('New York, NY');
      setWebsite('https://mywebsite.com');
      setAddress('123 Main St, New York, NY 10001');
    } catch (error) {
      console.error('Error loading contact info:', error);
      Alert.alert('Error', 'Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    setSaving(true);
    try {
      // TODO: Replace with actual API call
      // await userService.updateContactInfo({
      //   email,
      //   phone,
      //   location,
      //   website,
      //   address,
      //   privacy_settings: privacySettings
      // });
      
      Alert.alert('Success', 'Contact information updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePrivacySetting = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWebsite = (website: string) => {
    if (!website) return true; // Optional field
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(website);
  };

  const handleSave = () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    if (website && !validateWebsite(website)) {
      Alert.alert('Invalid Website', 'Please enter a valid website URL (starting with http:// or https://)');
      return;
    }

    saveContactInfo();
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'url' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[textStyles.body, { color: theme.text, fontWeight: '600', marginBottom: SPACING.xs }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          textStyles.body,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
          multiline && styles.multilineInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const renderPrivacyToggle = (key: keyof PrivacySettings, label: string, description: string) => (
    <View style={[styles.privacyItem, { borderBottomColor: theme.border }]}>
      <View style={styles.privacyInfo}>
        <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
          {label}
        </Text>
        <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={privacySettings[key]}
        onValueChange={() => togglePrivacySetting(key)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={privacySettings[key] ? '#fff' : theme.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading contact information...</Text>
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
        <Text style={[styles.headerTitle, textStyles.heading3]}>Contact Information</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
            Contact Information
          </Text>
          
          {renderInputField(
            'Email Address',
            email,
            setEmail,
            'Enter your email address',
            'email-address'
          )}
          
          {renderInputField(
            'Phone Number',
            phone,
            setPhone,
            'Enter your phone number',
            'phone-pad'
          )}
          
          {renderInputField(
            'Location',
            location,
            setLocation,
            'Enter your city, state/country',
            'default'
          )}
          
          {renderInputField(
            'Website',
            website,
            setWebsite,
            'Enter your website URL',
            'url'
          )}
          
          {renderInputField(
            'Address',
            address,
            setAddress,
            'Enter your full address',
            'default',
            true
          )}
        </View>

        {/* Privacy Settings Section */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
            Privacy Settings
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.lg }]}>
            Choose what information to display on your public profile
          </Text>

          <View style={[styles.privacyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {renderPrivacyToggle(
              'show_email',
              'Email Address',
              'Show your email on your public profile'
            )}
            
            {renderPrivacyToggle(
              'show_phone',
              'Phone Number',
              'Show your phone number on your public profile'
            )}
            
            {renderPrivacyToggle(
              'show_location',
              'Location',
              'Show your location on your public profile'
            )}
            
            {renderPrivacyToggle(
              'show_profession_tags',
              'Profession Tags',
              'Show your profession tags and certifications'
            )}
            
            {renderPrivacyToggle(
              'show_recipes',
              'Recipes',
              'Show your personal recipes on your public profile'
            )}
            
            {renderPrivacyToggle(
              'show_posts',
              'Posts',
              'Show your forum posts on your public profile'
            )}
            
            {renderPrivacyToggle(
              'show_badges',
              'Badges',
              'Show your achievement badges on your public profile'
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButtonBottom, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="content-save" size={20} color="#fff" />
          )}
          <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
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
  saveButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  privacyContainer: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  privacyInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  saveButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactInfoScreen;
