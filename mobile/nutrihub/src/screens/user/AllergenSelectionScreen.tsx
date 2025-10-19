import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { COMMON_ALLERGENS } from '../../constants/foodConstants';
import { Allergen } from '../../types/types';

const AllergenSelectionScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [newCustomAllergen, setNewCustomAllergen] = useState('');
  const [loading, setLoading] = useState(false);

  // Convert COMMON_ALLERGENS object to array format for the UI
  const allergenOptions = Object.entries(COMMON_ALLERGENS).map(([key, value]) => ({
    id: key.toLowerCase(),
    name: value,
    category: ['sulfites', 'colorants', 'preservatives'].includes(key.toLowerCase()) ? 'additive' as const : 'common' as const
  }));

  // Load user's current allergens on mount
  useEffect(() => {
    loadUserAllergens();
  }, []);

  const loadUserAllergens = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const userAllergens = await userService.getAllergens();
      // setSelectedAllergens(userAllergens.predefined || []);
      // setCustomAllergens(userAllergens.custom || []);
    } catch (error) {
      console.error('Error loading allergens:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId) 
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const addCustomAllergen = () => {
    const trimmed = newCustomAllergen.trim();
    if (!trimmed) return;
    
    if (customAllergens.includes(trimmed)) {
      Alert.alert('Duplicate', 'This allergen is already in your custom list.');
      return;
    }

    setCustomAllergens(prev => [...prev, trimmed]);
    setNewCustomAllergen('');
  };

  const removeCustomAllergen = (allergen: string) => {
    setCustomAllergens(prev => prev.filter(item => item !== allergen));
  };

  const saveAllergens = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await userService.updateAllergens({
      //   predefined: selectedAllergens,
      //   custom: customAllergens
      // });
      
      Alert.alert('Success', 'Your allergens have been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save allergens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAllergenItem = ({ item }: { item: { id: string; name: string; category: 'common' | 'additive' } }) => {
    const isSelected = selectedAllergens.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.allergenItem,
          { 
            backgroundColor: theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => toggleAllergen(item.id)}
      >
        <View style={styles.allergenContent}>
          <View style={styles.allergenInfo}>
            <Text style={[textStyles.body, { color: theme.text }]}>
              {item.name}
            </Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              {item.category === 'common' ? 'Common Allergen' : 'Food Additive'}
            </Text>
          </View>
          <Icon
            name={isSelected ? 'check-circle' : 'circle-outline'}
            size={24}
            color={isSelected ? theme.primary : theme.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomAllergen = ({ item }: { item: string }) => (
    <View style={[styles.customAllergenItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[textStyles.body, { color: theme.text }]}>{item}</Text>
      <TouchableOpacity
        onPress={() => removeCustomAllergen(item)}
        style={styles.removeButton}
      >
        <Icon name="close-circle" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.text }]}>Loading allergens...</Text>
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
        <Text style={[styles.headerTitle, textStyles.heading3]}>Allergens</Text>
        <TouchableOpacity onPress={saveAllergens} style={styles.saveButton}>
          <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Predefined Allergens Section */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text }]}>Common Allergens</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md }]}>
            Select from common allergens and food additives
          </Text>
          
          <FlatList
            data={allergenOptions}
            renderItem={renderAllergenItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Custom Allergens Section */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text }]}>Custom Allergens</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md }]}>
            Add allergens not in the predefined list
          </Text>

          {/* Add Custom Allergen Input */}
          <View style={[styles.addCustomContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.customInput, textStyles.body, { color: theme.text }]}
              placeholder="Enter custom allergen..."
              placeholderTextColor={theme.textSecondary}
              value={newCustomAllergen}
              onChangeText={setNewCustomAllergen}
              onSubmitEditing={addCustomAllergen}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addCustomAllergen}
              disabled={!newCustomAllergen.trim()}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Custom Allergens List */}
          {customAllergens.length > 0 && (
            <View style={styles.customList}>
              <FlatList
                data={customAllergens}
                renderItem={renderCustomAllergen}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[textStyles.body, { color: theme.text }]}>
            Selected: {selectedAllergens.length + customAllergens.length} allergens
          </Text>
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
  contentContainer: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  allergenItem: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  allergenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allergenInfo: {
    flex: 1,
  },
  separator: {
    height: SPACING.sm,
  },
  customAllergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  addCustomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  customInput: {
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  addButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  customList: {
    marginTop: SPACING.sm,
  },
  summary: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AllergenSelectionScreen;
