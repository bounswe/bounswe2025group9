import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { createFontStyles } from '../constants/theme';
// use the Expo-wrapped icon 
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// pull the exact union of icon names
type IconName = React.ComponentProps<typeof Icon>['name'];

// define a typed shape
type FoodItemType = {
  id: number;
  title: string;
  description: string;
  iconName: IconName;
};

// annotate the array
const FOOD_ITEMS: FoodItemType[] = [
  { id: 1, title: 'Food Item 1', description: 'Placeholder food description', iconName: 'hamburger' },
  { id: 2, title: 'Food Item 2', description: 'Placeholder food description', iconName: 'carrot' },
  { id: 3, title: 'Food Item 3', description: 'Placeholder food description', iconName: 'cookie' },
  { id: 4, title: 'Food Item 4', description: 'Placeholder food description', iconName: 'hamburger' },
  { id: 5, title: 'Food Item 5', description: 'Placeholder food description', iconName: 'carrot' },
  { id: 6, title: 'Food Item 6', description: 'Placeholder food description', iconName: 'cookie' },
];

const FoodScreen: React.FC = () => {
  const { colors } = useTheme();
  const fonts = createFontStyles(colors);

  const renderItem = ({ item }: { item: FoodItemType }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: colors.card }]}
      onPress={() => console.log(`Selected food item: ${item.id}`)}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.placeholder }]}>
        <Icon name={item.iconName} size={32} color={colors.textSecondary} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Icon name={item.iconName} size={16} color={colors.accent} />
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, fonts.heading]}>Foods Catalog</Text>
        <Text style={[styles.subtitle, fonts.caption]}>
          This is a placeholder for the Foods catalog page. Implementation will come in the next phase.
        </Text>
      </View>
      
      <FlatList
        data={FOOD_ITEMS}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  listContent: {
    padding: SPACING.sm,
  },
  itemContainer: {
    flex: 1,
    margin: SPACING.xs,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
  },
  iconContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  itemDescription: {
    fontSize: 14,
  },
});

export default FoodScreen;