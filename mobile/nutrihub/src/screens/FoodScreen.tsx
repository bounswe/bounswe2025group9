import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../constants/theme';
// use the Expo-wrapped icon 
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// pull the exact union of icon names
type IconName = React.ComponentProps<typeof Icon>['name'];

// define a typed shape for your data
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
  const renderItem = ({ item }: { item: FoodItemType }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => console.log(`Selected food item: ${item.id}`)}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Icon name={item.iconName} size={32} color={COLORS.lightGray} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Icon name={item.iconName} size={16} color={COLORS.accent} />
          <Text style={styles.itemTitle}>{item.title}</Text>
        </View>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foods Catalog</Text>
        <Text style={styles.subtitle}>
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.heading,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.caption,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  listContent: {
    padding: SPACING.sm,
  },
  itemContainer: {
    flex: 1,
    margin: SPACING.xs,
    backgroundColor: COLORS.darkCard,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
  },
  iconContainer: {
    backgroundColor: COLORS.darkGray,
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
    ...FONTS.subheading,
    fontSize: 16,
    marginLeft: SPACING.xs,
  },
  itemDescription: {
    ...FONTS.caption,
  },
});

export default FoodScreen;
