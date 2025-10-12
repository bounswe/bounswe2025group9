import React from 'react';
import { X, Hamburger, Tag, Fire, Scales } from '@phosphor-icons/react';
import { Food } from '../../lib/apiClient';

interface FoodDetailProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
}

const FoodDetail: React.FC<FoodDetailProps> = ({ food, open, onClose }) => {
  if (!food) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? 'visible' : 'invisible'}`}>
      {/* Backdrop with blur effect */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className={`max-w-3xl w-full mx-4 bg-[var(--color-bg-primary)] rounded-lg shadow-xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto relative ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-button-danger-bg)] hover:bg-[var(--color-button-danger-hover-bg)] z-10"
        >
          <X size={24} weight="bold" className="text-[var(--color-text-on-danger)]" />
        </button>

        {/* Food image section */}
        <div className="w-full h-48 md:h-64 relative overflow-hidden border-b border-[var(--color-border)]">
          {food.imageUrl ? (
            <img 
              src={food.imageUrl} 
              alt={food.name} 
              className="w-full h-full object-cover"
              onError={e => { 
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-[var(--color-bg-secondary)]');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
              <Hamburger size={72} weight="fill" className="text-[var(--color-text-tertiary)]" />
            </div>
          )}
        </div>
          
        {/* Content section */}
        <div className="p-6">
          {/* Food title */}
          <h2 className="nh-title text-3xl font-bold text-[var(--color-accent)] mb-6">{food.name}</h2>
            
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Tag size={20} weight="fill" className="text-[var(--color-accent)]" />
              Basic Information
            </h3>
              
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">Category</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-1">{food.category}</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">Nutrition Score</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-1">{food.nutritionScore}</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">Serving Size</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-1">{food.servingSize}g</p>
              </div>
            </div>
          </div>
            
          {/* Nutrition Information */}
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Fire size={20} weight="fill" className="text-[var(--color-accent)]" />
              Nutrition Information (per {food.servingSize}g)
            </h3>
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.caloriesPerServing} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.proteinContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.fatContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-green-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.carbohydrateContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Carbs</p>
              </div>
            </div>
          </div>
            
          {/* Dietary Tags */}
          <div>
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Tag size={20} weight="fill" className="text-[var(--color-accent)]" />
              Dietary Tags
            </h3>
              
            <div className="flex flex-wrap gap-2">
              {food.dietaryOptions.length > 0 ? (
                food.dietaryOptions.map((tag) => (
                  <div 
                    key={tag}
                    className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent-bg-soft)] text-[var(--color-accent)] border border-[var(--color-accent-border-soft)]"
                  >
                    <Tag size={14} weight="fill" className="mr-1.5" />
                    {tag}
                  </div>
                ))
              ) : (
                <p className="text-[var(--color-text-secondary)] italic">No dietary tags specified</p>
              )}
            </div>
          </div>
        </div>
            
      </div>
    </div>
  );
};

export default FoodDetail;
