/**
 * Language Settings Screen
 * 
 * Allows users to select their preferred language.
 * Supports: English (en-US), Turkish (tr-TR), Arabic (ar - RTL)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../../i18n';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface LanguageItem {
  code: LanguageCode;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

const LanguageSettingsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const { currentLanguage, changeLanguage, isLoading, t } = useLanguage();
  const navigation = useNavigation();

  // Convert supported languages to array
  const languages: LanguageItem[] = Object.values(SUPPORTED_LANGUAGES).map((lang) => ({
    code: lang.code as LanguageCode,
    name: lang.name,
    nativeName: lang.nativeName,
    isRTL: lang.isRTL,
  }));

  const handleSelectLanguage = async (language: LanguageCode) => {
    if (language === currentLanguage) return;
    
    try {
      await changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const renderLanguageItem = ({ item }: { item: LanguageItem }) => {
    const isSelected = item.code === currentLanguage;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          { 
            backgroundColor: isSelected ? `${theme.primary}15` : theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
          }
        ]}
        onPress={() => handleSelectLanguage(item.code)}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Text style={[textStyles.heading4, { color: theme.text }]}>
            {item.nativeName}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {item.name}
          </Text>
          {item.isRTL && (
            <View style={[styles.rtlBadge, { backgroundColor: theme.warning }]}>
              <Text style={[textStyles.small, { color: '#fff' }]}>RTL</Text>
            </View>
          )}
        </View>
        
        {isSelected && (
          <Icon name="check-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[textStyles.heading3, { color: theme.text }]}>
          {t('language.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={[textStyles.body, { color: theme.textSecondary }]}>
          {t('language.select')}
        </Text>
      </View>

      {/* Language List */}
      <FlatList
        data={languages}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Info about RTL */}
      <View style={[styles.infoContainer, { backgroundColor: `${theme.info}15`, borderColor: theme.info }]}>
        <Icon name="information" size={20} color={theme.info} />
        <Text style={[textStyles.caption, { color: theme.text, marginLeft: SPACING.sm, flex: 1 }]}>
          {t('language.restartRequired')}
        </Text>
      </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  placeholder: {
    width: 32,
  },
  descriptionContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  rtlBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.xs,
  },
  separator: {
    height: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
});

export default LanguageSettingsScreen;

