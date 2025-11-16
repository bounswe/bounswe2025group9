import { useState, useEffect, useRef } from 'react';
import { apiClient, Food } from '../lib/apiClient';
import { MagnifyingGlass, X, Hamburger } from '@phosphor-icons/react';
import { Dialog } from '@headlessui/react';
import NutritionScore from './NutritionScore';

interface FoodSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (food: Food) => void;
}

const FoodSelector = ({ open, onClose, onSelect }: FoodSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Food[]>([]);
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        // debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchTerm.trim().length === 0) {
            setSearchResults([]);
            setWarning(null);
            setLoading(false);
            return;
        }

        debounceRef.current = window.setTimeout(async () => {
            setLoading(true);
            try {
                const response = await apiClient.getFoods({ page: 1, search: searchTerm });

                if (response.status === 200 || response.status === 206) {
                    setSearchResults(response.results || []);
                    setWarning(response.warning || null);
                } else if (response.status === 204) {
                    setSearchResults([]);
                    setWarning(response.warning || `No foods found for "${searchTerm}".`);
                }
            } catch (err) {
                console.error('Error searching foods:', err);
                setWarning('Error searching for foods.');
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
                    className="mx-auto max-w-4xl w-full rounded-xl shadow-lg p-6"
                    style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--dietary-option-border)'
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
                                            <p className="nh-text text-sm mt-2">
                                                Calories: {food.caloriesPerServing} kcal per {food.servingSize}
                                            </p>
                                            {food.dietaryOptions && food.dietaryOptions.length > 0 && (
                                                <p className="nh-text text-sm">
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
                        {!loading && warning && (
                            <div className="text-center py-4 text-yellow-700">{warning}</div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default FoodSelector;
