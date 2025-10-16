import { useState } from 'react';
import { Food } from '../lib/apiClient';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Dialog } from '@headlessui/react';

interface FoodSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (food: Food) => void;
    foods: Food[];
}

const FoodSelector = ({ open, onClose, onSelect, foods }: FoodSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredFoods = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-medium">
                            Select Food Item
                        </Dialog.Title>
                        <button onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlass size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="Search foods..."
                            />
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-1 gap-4">
                            {filteredFoods.map(food => (
                                <div
                                    key={food.id}
                                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                                    onClick={() => {
                                        onSelect(food);
                                        onClose();
                                    }}
                                >
                                    <h3 className="font-medium">{food.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {food.category} • {food.caloriesPerServing} kcal
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default FoodSelector;
