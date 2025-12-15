import { useState, useEffect, useRef } from 'react';
import { apiClient, Food } from '../lib/apiClient';
import { MagnifyingGlass, X, Hamburger } from '@phosphor-icons/react';
import { Dialog } from '@headlessui/react';
import NutritionScore from './NutritionScore';

const FOOD_FUZZY_SIMILARITY_THRESHOLD = 65;

const levenshteinDistance = (source: string, target: string): number => {
    const lenSource = source.length;
    const lenTarget = target.length;

    if (lenSource === 0) return lenTarget;
    if (lenTarget === 0) return lenSource;

    const matrix = Array.from({ length: lenSource + 1 }, () => new Array(lenTarget + 1).fill(0));

    for (let i = 0; i <= lenSource; i++) matrix[i][0] = i;
    for (let j = 0; j <= lenTarget; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenSource; i++) {
        for (let j = 1; j <= lenTarget; j++) {
            const cost = source[i - 1] === target[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[lenSource][lenTarget];
};

const simpleRatio = (a: string, b: string): number => {
    if (!a || !b) return 0;
    if (a === b) return 100;
    const dist = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return Math.round(((maxLen - dist) / maxLen) * 100);
};

const partialRatio = (a: string, b: string): number => {
    if (!a || !b) return 0;
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;

    const lenShort = shorter.length;
    if (lenShort === 0) return 0;

    let highest = 0;
    for (let i = 0; i <= longer.length - lenShort; i++) {
        const window = longer.slice(i, i + lenShort);
        const ratio = simpleRatio(shorter, window);
        if (ratio > highest) highest = ratio;
        if (highest === 100) break;
    }

    return highest;
};

const tokenSortRatio = (a: string, b: string): number => {
    if (!a || !b) return 0;
    const normalize = (str: string) =>
        str
            .split(/\s+/)
            .map(token => token.trim())
            .filter(Boolean)
            .sort()
            .join(' ');
    const normalizedA = normalize(a);
    const normalizedB = normalize(b);
    return simpleRatio(normalizedA, normalizedB);
};

const calculateFuzzySimilarity = (query: string, target: string): number => {
    const source = query.toLowerCase();
    const compared = target.toLowerCase();

    const ratio = simpleRatio(source, compared);
    const partial = partialRatio(source, compared);
    const tokenSort = tokenSortRatio(source, compared);

    return Math.max(ratio, partial, tokenSort);
};

const scoreFoodMatch = (normalizedQuery: string, food: Food): number => {
    const candidates = [
        food.name || '',
        food.category || '',
        (food.dietaryOptions || []).join(' ')
    ];

    let bestScore = 0;
    candidates.forEach(text => {
        const lower = text.toLowerCase();
        if (lower.includes(normalizedQuery)) {
            bestScore = Math.max(bestScore, 100);
        } else {
            bestScore = Math.max(bestScore, calculateFuzzySimilarity(normalizedQuery, lower));
        }
    });

    return bestScore;
};

export const rankFoodsByQuery = (query: string, foods: Food[]) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return foods;

    const scored = foods.map(food => ({
        food,
        score: scoreFoodMatch(normalizedQuery, food)
    }));

    const passing = scored.filter(item => item.score >= FOOD_FUZZY_SIMILARITY_THRESHOLD);
    const pool = passing.length > 0 ? passing : scored;

    return pool
        .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
        .map(item => item.food);
};

interface FoodSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (food: Food) => void;
}

const FoodSelector = ({ open, onClose, onSelect }: FoodSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Food[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        // debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchTerm.trim().length === 0) {
            setSearchResults([]);
            setLoading(false);
            return;
        }

        debounceRef.current = window.setTimeout(async () => {
            setLoading(true);
            try {
                const response = await apiClient.getFoods({ page: 1, search: searchTerm });

                if (response.status === 200 || response.status === 206) {
                    const foods = response.results || [];
                    const ranked = rankFoodsByQuery(searchTerm, foods);
                    setSearchResults(ranked);
                } else if (response.status === 204) {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error('Error searching foods:', err);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div
                className="fixed inset-0"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel
                    className="mx-auto max-w-2xl w-full rounded-xl shadow-lg p-6"
                    style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--dietary-option-border)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="nh-subtitle">
                            Select Food Item
                        </Dialog.Title>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full transition-all"
                            style={{
                                color: 'var(--color-primary)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MagnifyingGlass size={20} style={{ color: 'var(--forum-search-icon)' }} />
                            </div>
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search"
                                placeholder="Search foods..."
                                aria-label="Search foods"
                            />
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading && (
                                <div className="col-span-full p-6 text-center nh-text">Searching...</div>
                            )}

                            {!loading && searchResults.map((food) => {
                                return (
                                    <div
                                        key={food.id}
                                        className="nh-card p-4 cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
                                        onClick={() => {
                                            onSelect(food);
                                            onClose();
                                            setSearchTerm(''); // Reset search on selection
                                            setSearchResults([]);
                                        }}
                                    >
                                        <div className="food-image-container h-40 w-full flex justify-center items-center mb-4 overflow-hidden">
                                            {food.imageUrl ? (
                                                <img
                                                    src={food.imageUrl}
                                                    alt={food.name}
                                                    className="object-contain h-full w-full rounded"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="food-image-placeholder w-full h-full flex items-center justify-center">
                                                    <Hamburger size={48} weight="fill" className="text-primary opacity-50" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center">
                                            <h3 className="nh-subtitle text-base">{food.name}</h3>
                                        </div>

                                        <div className="mt-2">
                                            <p className="nh-text text-sm">Category: {food.category}</p>
                                            <div className="mt-2">
                                                <p className="nh-text text-sm mb-1">Nutrition Score:</p>
                                                <NutritionScore score={food.nutritionScore} size="sm" />
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <p className="nh-text text-sm">
                                                    Per {food.servingSize}g: {food.caloriesPerServing} kcal
                                                </p>
                                                <p className="nh-text text-sm">
                                                    Per 100g: {((food.caloriesPerServing / food.servingSize) * 100).toFixed(1)} kcal
                                                </p>
                                            </div>
                                            {food.dietaryOptions && food.dietaryOptions.length > 0 && (
                                                <p className="nh-text text-sm mt-2">
                                                    Dietary Tags: {food.dietaryOptions.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {!loading && searchResults.length === 0 && searchTerm.trim().length > 0 && (
                            <div className="text-center py-12">
                                <p className="nh-text">No foods found matching your search.</p>
                            </div>
                        )}

                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default FoodSelector;
