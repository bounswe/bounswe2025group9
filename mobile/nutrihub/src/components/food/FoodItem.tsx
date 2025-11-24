/**
 * FoodItem Component
 * 
 * Displays detailed information about a food item in a consistent format.
 * Can be used in list views, grid views, or as standalone items.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, GestureResponderEvent, Image } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BORDER_RADIUS, SPACING, getValidIconName } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';
import { FoodItem as FoodItemType } from '../../types/types';
import { getPriceCategoryText, getPriceCategoryColor } from '../../utils/priceUtils';

interface FoodItemProps {
  /**
   * Food item data to display
   */
  item: FoodItemType;
  
  /**
   * Function to call when the food item is pressed
   */
  onPress?: (item: FoodItemType) => void;
  
  /**
   * Visual layout style to use
   * @default 'list'
   */
  variant?: 'list' | 'grid' | 'detailed';
  
  /**
   * Additional style to apply to the container
   */
  style?: ViewStyle;
  
  /**
   * Whether to show the nutrition score
   * @default true
   */
  showNutritionScore?: boolean;
  
  /**
   * Whether to show dietary options/tags
   * @default false
   */
  showDietaryOptions?: boolean;
  
  /**
   * Whether to show the price
   * @default false
   */
  showPrice?: boolean;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * Component for displaying food items in various layouts
 */
const FoodItemComponent: React.FC<FoodItemProps> = ({
  item,
  onPress,
  variant = 'list',
  style,
  showNutritionScore = true,
  showDietaryOptions = false,
  showPrice = false,
  testID,
}) => {
  const { theme, textStyles } = useTheme();
  
  // Handle press event
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(item);
    }
  };
  
  // Get nutrition score display color based on value
  const getNutritionScoreColor = (score?: number): string => {
    if (!score) return theme.textSecondary;
    
    if (score >= 8) return theme.success;
    if (score >= 5) return theme.warning;
    return theme.error;
  };
  
  // Render a badge with text
  const renderBadge = (text: string, color: string = theme.textSecondary) => (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );

  // Render price category badge
  const renderPriceCategoryBadge = () => {
    if (!item.priceCategory) return null;
    
    const categoryText = getPriceCategoryText(item.priceCategory);
    const categoryColor = getPriceCategoryColor(item.priceCategory);
    
    return (
      <View style={[styles.priceCategoryBadge, { backgroundColor: categoryColor + '20', borderColor: categoryColor }]}>
        <Text style={[styles.priceCategoryText, { color: categoryColor }]}>
          {categoryText}
        </Text>
      </View>
    );
  };

  // Render list layout
  const renderListLayout = () => (
    <Card 
      onPress={handlePress}
      style={style}
      contentStyle={styles.listContent}
      testID={testID}
    >
      <View style={styles.listContentInner}>
        {/* Image or Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.placeholder }]}> 
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <Icon 
              name={getValidIconName(item.iconName)} 
              size={32} 
              color={theme.primary} 
            />
          )}
        </View>
        
        {/* Text content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, textStyles.subtitle]} numberOfLines={1}>{item.title}</Text>
            
            {/* Nutrition score */}
            {showNutritionScore && item.nutritionScore !== undefined && (
              <View style={styles.scoreContainer}>
                <Text 
                  style={[
                    styles.scoreText, 
                    { color: getNutritionScoreColor(item.nutritionScore) }
                  ]}
                >
                  {item.nutritionScore.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.description, textStyles.caption]} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Dietary options */}
          {showDietaryOptions && item.dietaryOptions && item.dietaryOptions.length > 0 && (
            <View style={styles.badgeContainer}>
              {item.dietaryOptions.slice(0, 2).map((option, index) => (
                <View key={index} style={styles.badgeWrapper}>
                  {renderBadge(option, theme.primary)}
                </View>
              ))}
              {item.dietaryOptions.length > 2 && (
                <Text style={[styles.moreBadges, textStyles.small]}>
                  +{item.dietaryOptions.length - 2} more
                </Text>
              )}
            </View>
          )}
          
          {/* Price Category */}
          {showPrice && item.priceCategory && (
            <View style={styles.priceRow}>
              {renderPriceCategoryBadge()}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
  
  // Render grid layout
  const renderGridLayout = () => (
    <Card
      onPress={handlePress}
      style={style}
      testID={testID}
    >
      {/* Image or Icon */}
      <View style={[styles.gridIconContainer, { backgroundColor: theme.placeholder }]}> 
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <Icon 
            name={getValidIconName(item.iconName)} 
            size={40} 
            color={theme.primary} 
          />
        )}
        
        {/* Nutrition score overlay */}
        {showNutritionScore && item.nutritionScore !== undefined && (
          <View style={[styles.gridScoreContainer, { backgroundColor: theme.surface }]}>
            <Text 
              style={[
                styles.gridScoreText, 
                { color: getNutritionScoreColor(item.nutritionScore) }
              ]}
            >
              {item.nutritionScore.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.gridContent}>
        <Text style={[styles.title, textStyles.subtitle]} numberOfLines={1}>
          {item.title}
        </Text>
        
        <Text style={[styles.description, textStyles.caption]} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Price Category */}
        {showPrice && item.priceCategory && (
          <View style={styles.priceRow}>
            {renderPriceCategoryBadge()}
          </View>
        )}
        
        {/* Dietary options */}
        {showDietaryOptions && item.dietaryOptions && item.dietaryOptions.length > 0 && (
          <View style={styles.gridBadgeContainer}>
            {item.dietaryOptions.slice(0, 1).map((option, index) => (
              <View key={index} style={styles.badgeWrapper}>
                {renderBadge(option, theme.primary)}
              </View>
            ))}
            {item.dietaryOptions.length > 1 && (
              <Text style={[styles.moreBadges, textStyles.small]}>
                +{item.dietaryOptions.length - 1} more
              </Text>
            )}
          </View>
        )}
      </View>
    </Card>
  );
  
  // Render detailed layout
  const renderDetailedLayout = () => (
    <Card
      onPress={handlePress}
      style={style}
      contentStyle={styles.detailedContainer}
      testID={testID}
    >
      <View style={styles.detailedHeader}>
        <View style={styles.detailedTitleContainer}>
          <Icon 
            name={getValidIconName(item.iconName)} 
            size={24} 
            color={theme.primary} 
            style={styles.detailedIcon} 
          />
          <Text style={[styles.detailedTitle, textStyles.heading1]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        
        {/* Nutrition score */}
        {showNutritionScore && item.nutritionScore !== undefined && (
          <View style={[
            styles.detailedScoreContainer, 
            { backgroundColor: getNutritionScoreColor(item.nutritionScore) + '20' }
          ]}>
            <Text style={[styles.detailedScoreLabel, textStyles.caption]}>
              Nutrition Score
            </Text>
            <Text 
              style={[
                styles.detailedScoreValue, 
                { color: getNutritionScoreColor(item.nutritionScore) }
              ]}
            >
              {item.nutritionScore.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.detailedDescription, textStyles.body]}>
        {item.description}
      </Text>
      
      {/* Dietary options */}
      {showDietaryOptions && item.dietaryOptions && item.dietaryOptions.length > 0 && (
        <View style={styles.detailedBadgeContainer}>
          <Text style={[styles.sectionTitle, textStyles.subtitle]}>
            Dietary Options
          </Text>
          <View style={styles.badgeRow}>
            {item.dietaryOptions.map((option, index) => (
              <View key={index} style={styles.badgeWrapper}>
                {renderBadge(option, theme.primary)}
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Macronutrients if available */}
      {item.macronutrients && (
        <View style={styles.macroContainer}>
          <Text style={[styles.sectionTitle, textStyles.subtitle]}>
            Nutritional Information
          </Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, textStyles.body]}>
                {item.macronutrients.calories}
              </Text>
              <Text style={[styles.macroLabel, textStyles.caption]}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, textStyles.body]}>
                {item.macronutrients.protein}g
              </Text>
              <Text style={[styles.macroLabel, textStyles.caption]}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, textStyles.body]}>
                {item.macronutrients.carbohydrates}g
              </Text>
              <Text style={[styles.macroLabel, textStyles.caption]}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, textStyles.body]}>
                {item.macronutrients.fat}g
              </Text>
              <Text style={[styles.macroLabel, textStyles.caption]}>Fat</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Price Category */}
      {showPrice && item.priceCategory && (
        <View style={styles.detailedPriceContainer}>
          <View style={styles.detailedPriceHeader}>
            <Text style={[styles.detailedPriceLabel, textStyles.caption]}>
              Price Category
            </Text>
            {renderPriceCategoryBadge()}
          </View>
        </View>
      )}
    </Card>
  );
  
  // Render appropriate layout based on variant
  switch (variant) {
    case 'grid':
      return renderGridLayout();
    case 'detailed':
      return renderDetailedLayout();
    case 'list':
    default:
      return renderListLayout();
  }
};

const styles = StyleSheet.create({
  // List layout styles
  listContent: {
    padding: 0, // Remove padding from Card content
  },
  listContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  listImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  description: {
    marginBottom: SPACING.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  badgeWrapper: {
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  moreBadges: {
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  price: {
    fontWeight: 'bold',
  },
  priceCategoryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  priceCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Grid layout styles
  gridContainer: {
    width: '48%',
  },
  gridIconContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  gridScoreContainer: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    minWidth: 30,
    alignItems: 'center',
  },
  gridScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: SPACING.sm,
  },
  gridPrice: {
    fontWeight: 'bold',
  },
  gridBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  
  // Detailed layout styles
  detailedContainer: {
    padding: SPACING.md,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailedIcon: {
    marginRight: SPACING.sm,
  },
  detailedTitle: {
    flex: 1,
  },
  detailedScoreContainer: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  detailedScoreLabel: {
    marginBottom: SPACING.xs,
  },
  detailedScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailedDescription: {
    marginBottom: SPACING.lg,
  },
  detailedBadgeContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroContainer: {
    marginBottom: SPACING.lg,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  macroLabel: {},
  detailedPriceContainer: {
    alignItems: 'flex-end',
  },
  detailedPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  detailedPriceLabel: {},
  detailedPriceValue: {
    fontWeight: 'bold',
  },
  detailedPriceUnit: {
    marginTop: SPACING.xs,
  },
});

export default FoodItemComponent;