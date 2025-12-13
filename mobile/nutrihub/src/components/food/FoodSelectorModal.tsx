/**
 * FoodSelectorModal Component
 * 
 * A modal for selecting foods from the catalog or private foods.
 * Used in NutritionTrackingScreen, ForumScreen, and FoodCompareScreen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import TextInput from '../common/TextInput';
import { FoodItem } from '../../types/types';
import { PrivateFood } from '../../types/nutrition';
import { getFoodCatalog } from '../../services/api/food.service';
import { privateFoodService } from '../../services/api/privateFood.service';

interface FoodSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (food: FoodItem, isPrivate?: boolean, privateFoodData?: PrivateFood) => void;
    onCreatePrivateFood?: () => void;
    title?: string;
}

type TabType = 'catalog' | 'private';

const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
    visible,
    onClose,
    onSelect,
    onCreatePrivateFood,
    title = 'Select Food',
}) => {
    const { theme, textStyles } = useTheme();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('catalog');
    const [searchQuery, setSearchQuery] = useState('');
    const [catalogFoods, setCatalogFoods] = useState<FoodItem[]>([]);
    const [privateFoods, setPrivateFoods] = useState<PrivateFood[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const PAGE_SIZE = 20;

    // Load catalog foods
    const loadCatalogFoods = useCallback(async (reset = false) => {
        if (loading || (!hasMore && !reset)) return;

        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;
            const result = await getFoodCatalog(
                PAGE_SIZE,
                currentOffset,
                undefined,
                searchQuery.trim() || undefined
            );

            if (result.data) {
                if (reset) {
                    setCatalogFoods(result.data);
                    setOffset(PAGE_SIZE);
                } else {
                    setCatalogFoods(prev => [...prev, ...result.data!]);
                    setOffset(prev => prev + PAGE_SIZE);
                }
                setHasMore(result.hasMore);
            }
        } catch (error) {
            console.error('Error loading catalog foods:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loading, hasMore, offset, searchQuery]);

    // Load private foods
    const loadPrivateFoods = useCallback(async () => {
        try {
            const foods = searchQuery.trim()
                ? await privateFoodService.searchPrivateFoods(searchQuery)
                : await privateFoodService.getPrivateFoods();
            setPrivateFoods(foods);
        } catch (error) {
            console.error('Error loading private foods:', error);
        }
    }, [searchQuery]);

    // Initial load when modal opens
    useEffect(() => {
        if (visible) {
            setOffset(0);
            setHasMore(true);
            loadCatalogFoods(true);
            loadPrivateFoods();
        }
    }, [visible]);

    // Search effect
    useEffect(() => {
        const debounce = setTimeout(() => {
            if (activeTab === 'catalog') {
                setOffset(0);
                setHasMore(true);
                loadCatalogFoods(true);
            } else {
                loadPrivateFoods();
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchQuery, activeTab]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        if (activeTab === 'catalog') {
            setOffset(0);
            setHasMore(true);
            loadCatalogFoods(true);
        } else {
            loadPrivateFoods();
            setRefreshing(false);
        }
    };

    // Handle tab change
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchQuery('');
    };

    // Handle food selection
    const handleFoodSelect = (food: FoodItem | PrivateFood) => {
        if ('id' in food && typeof food.id === 'string') {
            // It's a PrivateFood, convert it and mark as private
            const convertedFood = privateFoodService.convertToFoodItem(food as PrivateFood);
            onSelect(convertedFood, true, food as PrivateFood);
        } else {
            // It's already a FoodItem
            onSelect(food as FoodItem, false);
        }
        onClose();
    };

    // Render catalog food item
    const renderCatalogItem = ({ item }: { item: FoodItem }) => (
        <TouchableOpacity
            style={[styles.foodItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleFoodSelect(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.foodIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Icon name={item.iconName as any || 'food'} size={24} color={theme.primary} />
            </View>
            <View style={styles.foodInfo}>
                <Text style={[textStyles.body, { color: theme.text, fontWeight: '500' }]} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                    {item.macronutrients?.calories || 0} kcal • {item.servingSize || 100}g
                </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    // Render private food item
    const renderPrivateItem = ({ item }: { item: PrivateFood }) => (
        <TouchableOpacity
            style={[styles.foodItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleFoodSelect(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.foodIcon, { backgroundColor: `${theme.success}15` }]}>
                <Icon name="lock" size={24} color={theme.success} />
            </View>
            <View style={styles.foodInfo}>
                <View style={styles.foodNameRow}>
                    <Text style={[textStyles.body, { color: theme.text, fontWeight: '500', flex: 1 }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={[styles.privateBadge, { backgroundColor: `${theme.success}20` }]}>
                        <Text style={[textStyles.small, { color: theme.success, fontWeight: '600' }]}>Private</Text>
                    </View>
                </View>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                    {item.calories} kcal • {item.servingSize}g
                </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    // Render empty state for catalog
    const renderCatalogEmpty = () => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Icon
                    name="food-off"
                    size={64}
                    color={theme.textSecondary}
                    style={{ opacity: 0.3 }}
                />
                <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: SPACING.md, textAlign: 'center' }]}>
                    No foods found. Try a different search.
                </Text>
            </View>
        );
    };

    // Render footer (loading indicator for pagination)
    const renderFooter = () => {
        if (!loading || catalogFoods.length === 0) return null;

        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    // Render create button as first item in private foods list
    const renderPrivateListHeader = () => {
        const handleCreatePress = () => {
            if (onCreatePrivateFood) {
                onClose(); // Close this modal first
                setTimeout(() => {
                    onCreatePrivateFood(); // Then open the create modal
                }, 100);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.foodItem, styles.createFoodItem, { backgroundColor: `${theme.primary}10`, borderColor: theme.primary, borderStyle: 'dashed' }]}
                onPress={handleCreatePress}
                activeOpacity={0.7}
            >
                <View style={[styles.foodIcon, { backgroundColor: `${theme.primary}20` }]}>
                    <Icon name="plus" size={24} color={theme.primary} />
                </View>
                <View style={styles.foodInfo}>
                    <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                        Create Private Food
                    </Text>
                    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                        Add custom food with your own values
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={onClose}
            >
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[textStyles.heading3, { color: theme.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Search foods..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'catalog' && [styles.activeTab, { borderBottomColor: theme.primary }]
                            ]}
                            onPress={() => handleTabChange('catalog')}
                        >
                            <Icon
                                name="food-apple"
                                size={18}
                                color={activeTab === 'catalog' ? theme.primary : theme.textSecondary}
                            />
                            <Text
                                style={[
                                    textStyles.body,
                                    {
                                        color: activeTab === 'catalog' ? theme.primary : theme.textSecondary,
                                        fontWeight: activeTab === 'catalog' ? '600' : '400',
                                        marginLeft: SPACING.xs
                                    }
                                ]}
                            >
                                Food Catalog
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'private' && [styles.activeTab, { borderBottomColor: theme.primary }]
                            ]}
                            onPress={() => handleTabChange('private')}
                        >
                            <Icon
                                name="lock"
                                size={18}
                                color={activeTab === 'private' ? theme.primary : theme.textSecondary}
                            />
                            <Text
                                style={[
                                    textStyles.body,
                                    {
                                        color: activeTab === 'private' ? theme.primary : theme.textSecondary,
                                        fontWeight: activeTab === 'private' ? '600' : '400',
                                        marginLeft: SPACING.xs
                                    }
                                ]}
                            >
                                Private ({privateFoods.length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {activeTab === 'catalog' ? (
                        <FlatList
                            data={catalogFoods}
                            renderItem={renderCatalogItem}
                            keyExtractor={(item) => `catalog-${item.id}`}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={renderCatalogEmpty}
                            ListFooterComponent={renderFooter}
                            onEndReached={() => loadCatalogFoods(false)}
                            onEndReachedThreshold={0.3}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[theme.primary]}
                                    tintColor={theme.primary}
                                />
                            }
                        />
                    ) : (
                        <FlatList
                            data={privateFoods}
                            renderItem={renderPrivateItem}
                            keyExtractor={(item) => `private-${item.id}`}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListHeaderComponent={renderPrivateListHeader}
                            ListEmptyComponent={null}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[theme.primary]}
                                    tintColor={theme.primary}
                                />
                            }
                        />
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    createButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    searchContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: SPACING.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    listContent: {
        padding: SPACING.md,
        flexGrow: 1,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        marginBottom: SPACING.sm,
    },
    foodIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    foodInfo: {
        flex: 1,
    },
    foodNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    privateBadge: {
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    footer: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    createFoodItem: {
        borderWidth: 1.5,
    },
});

export default FoodSelectorModal;
