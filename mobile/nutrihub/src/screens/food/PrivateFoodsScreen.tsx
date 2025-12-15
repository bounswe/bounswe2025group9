import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { getPrivateFoodsAsFoodItems } from '../../services/api/privateFood.service';
import { FoodItem } from '../../types/types';
import { ProfileStackParamList } from '../../navigation/types';

type PrivateFoodsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'PrivateFoods'>;

const PrivateFoodsScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<PrivateFoodsScreenNavigationProp>();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFoods = async () => {
    try {
      const list = await getPrivateFoodsAsFoodItems();
      setFoods(list);
    } catch (error) {
      console.error('Failed to load private foods:', error);
      setFoods([]);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadFoods();
    }, [])
  );

  const handleItemPress = useCallback((item: FoodItem) => {
    navigation.navigate('PrivateFoodDetail', { foodId: item.id });
  }, [navigation]);

  const renderItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.success}15` }]}>
          <Icon name="lock" size={22} color={theme.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {item.category} • {item.macronutrients?.calories || 0} kcal • {item.servingSize || 100}g
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={[styles.empty, { borderColor: theme.border }]}>
      <Text style={[textStyles.body, { color: theme.textSecondary }]}>
        {t('food.noPrivateFoods', { defaultValue: 'You have not created any private foods yet.' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Go back' })}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderColor: theme.border }]}
        >
          <Icon name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.heading2, { color: theme.text }]}>{t('food.myPrivateFoods', { defaultValue: 'My Private Foods' })}</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            {t('food.privateFoodsDescription', { defaultValue: 'Private foods you created from the proposal form.' })}
          </Text>
        </View>
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => `private-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SPACING.xl },
          foods.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={!refreshing ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFoods();
            }}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrivateFoodsScreen;

