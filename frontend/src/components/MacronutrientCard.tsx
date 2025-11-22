import { CheckCircle, Warning, TrendUp } from '@phosphor-icons/react';

interface MacronutrientCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon?: string; // 'P', 'C', 'F' for Protein, Carbs, Fat
}

const MacronutrientCard = ({ name, current, target, unit, color, icon }: MacronutrientCardProps) => {
  const percentage = Math.round((current / target) * 100);
  const isOverTarget = percentage > 100;
  const isNearTarget = percentage >= 90 && percentage <= 100;
  const remaining = Math.max(0, target - current);

  return (
    <div className="nh-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: `${color}20`,
                border: `2px solid ${color}`
              }}
            >
              <span className="text-lg font-bold" style={{ color }}>{icon}</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-xs nh-text opacity-70">Daily Target: {target}{unit}</p>
          </div>
        </div>
        
        {/* Status Icon */}
        {isNearTarget ? (
          <CheckCircle size={28} weight="fill" className="text-green-500" />
        ) : isOverTarget ? (
          <Warning size={28} weight="fill" className="text-orange-500" />
        ) : (
          <TrendUp size={28} weight="fill" className="opacity-40" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-primary">{current}{unit}</span>
          <span className="text-sm font-medium" style={{ 
            color: isOverTarget ? 'var(--color-error)' : isNearTarget ? 'var(--color-success)' : 'var(--color-warning)'
          }}>
            {percentage}%
          </span>
        </div>
        
        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div 
            className="h-4 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color
            }}
          />
          {/* Overflow indicator */}
          {isOverTarget && (
            <div 
              className="absolute top-0 right-0 h-4 rounded-r-full"
              style={{
                width: `${Math.min((percentage - 100) / 2, 50)}%`,
                backgroundColor: 'var(--color-error)',
                opacity: 0.7
              }}
            />
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between text-sm">
        {isOverTarget ? (
          <p className="nh-text opacity-70">
            <span style={{ color: 'var(--color-error)' }} className="font-medium">
              {Math.round(current - target)}{unit} over target
            </span>
          </p>
        ) : (
          <p className="nh-text opacity-70">
            <span className="font-medium">{remaining}{unit} remaining</span> to reach goal
          </p>
        )}
        
        {isNearTarget && (
          <span className="text-xs px-2 py-1 rounded" style={{
            backgroundColor: 'var(--color-success)',
            color: 'white'
          }}>
            On Track
          </span>
        )}
      </div>

      {/* Additional Info for Calories */}
      {name === 'Calories' && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="nh-text opacity-70">Breakfast</p>
              <p className="font-semibold text-primary">500 kcal</p>
            </div>
            <div>
              <p className="nh-text opacity-70">Lunch</p>
              <p className="font-semibold text-primary">610 kcal</p>
            </div>
            <div>
              <p className="nh-text opacity-70">Dinner</p>
              <p className="font-semibold text-primary">690 kcal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacronutrientCard;

