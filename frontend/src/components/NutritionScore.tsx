import { Info } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';

interface NutritionScoreProps {
  score: number;
  showInfo?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // Optional: provide food details for detailed breakdown
  foodDetails?: {
    proteinContent: number;
    carbohydrateContent: number;
    fatContent: number;
    caloriesPerServing: number;
    servingSize: number;
    category: string;
    name: string;
  };
}

const NutritionScore = ({ score, showInfo = true, size = 'md', foodDetails }: NutritionScoreProps) => {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Clamp score between 0 and 10
  const clampedScore = Math.max(0, Math.min(10, score));

  // Calculate gradient color from red (0) to green (10)
  // Using HSL for smooth transition: red is 0deg, green is 120deg
  const hue = (clampedScore / 10) * 120; // 0-120 degrees
  const saturation = 70; // 70% saturation for vibrant colors
  const lightness = 45; // 45% lightness for good contrast

  const barColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Calculate bar width percentage (0-100%)
  const barWidth = (clampedScore / 10) * 100;

  // Size classes
  const sizeClasses = {
    sm: {
      text: 'text-sm',
      bar: 'h-3',
      icon: 'w-3 h-3',
      tooltip: 'text-xs max-w-xs'
    },
    md: {
      text: 'text-base',
      bar: 'h-4',
      icon: 'w-4 h-4',
      tooltip: 'text-sm max-w-sm'
    },
    lg: {
      text: 'text-lg',
      bar: 'h-5',
      icon: 'w-5 h-5',
      tooltip: 'text-base max-w-md'
    }
  };

  const currentSize = sizeClasses[size];

  // Calculate detailed breakdown if food details are provided
  const calculateBreakdown = () => {
    if (!foodDetails) return null;

    const { proteinContent, carbohydrateContent, fatContent, servingSize, category, name } = foodDetails;

    // Normalize to per 100g
    const multiplier = servingSize !== 100 ? 100 / servingSize : 1;
    const protein = proteinContent * multiplier;
    const carbs = carbohydrateContent * multiplier;
    const fat = fatContent * multiplier;

    // 1. Protein score (30% of total, max 3 points)
    const proteinScore = Math.min(protein / 10, 3);
    const proteinScoreScaled = proteinScore * (0.3 * 10 / 3);

    // 2. Carb quality score (30% of total, max 3 points)
    let carbQualityScore = 1.5; // default
    const categoryLower = category.toLowerCase();
    const nameLower = name.toLowerCase();

    if (categoryLower.includes('vegetable') || categoryLower.includes('fruit')) {
      carbQualityScore = 3;
    } else if (nameLower.includes('whole') && categoryLower.includes('grain')) {
      carbQualityScore = 2.5;
    } else if (categoryLower.includes('grain')) {
      carbQualityScore = 2;
    } else if (categoryLower.includes('dairy')) {
      carbQualityScore = 1.5;
    } else if (categoryLower.includes('sweets') || categoryLower.includes('snacks')) {
      carbQualityScore = 0.5;
    }

    const carbQualityScoreScaled = carbQualityScore * (0.3 * 10 / 3);

    // 3. Nutrient balance score (40% of total, max 4 points)
    const totalMacros = protein * 4 + carbs * 4 + fat * 9;
    let nutrientBalanceScore = 0;

    if (totalMacros > 0) {
      const proteinPct = (protein * 4) / totalMacros;
      const carbsPct = (carbs * 4) / totalMacros;
      const fatPct = (fat * 9) / totalMacros;

      let proteinBalance = 0.5;
      if (proteinPct >= 0.1 && proteinPct <= 0.35) proteinBalance = 1.0;
      else if (proteinPct > 0.35) proteinBalance = 0.7;

      let carbsBalance = 0.7;
      if (carbsPct >= 0.45 && carbsPct <= 0.65) carbsBalance = 1.0;
      else if (carbsPct > 0.65) carbsBalance = 0.7;

      let fatBalance = 0.7;
      if (fatPct >= 0.2 && fatPct <= 0.35) fatBalance = 1.0;
      else if (fatPct > 0.35) fatBalance = 0.5;

      nutrientBalanceScore = (proteinBalance + carbsBalance + fatBalance) * (0.4 * 10 / 3);
    }

    return {
      proteinScore: proteinScoreScaled,
      carbQualityScore: carbQualityScoreScaled,
      nutrientBalanceScore,
      proteinRaw: proteinScore,
      carbQualityRaw: carbQualityScore,
      protein,
      carbs,
      fat,
      totalMacros
    };
  };

  const breakdown = calculateBreakdown();

  // Calculate tooltip position using fixed positioning relative to viewport
  useEffect(() => {
    if (showTooltip && buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const padding = 16;
      const tooltipWidth = 320; // w-80

      // Check available space
      const spaceTop = buttonRect.top;
      const spaceBottom = window.innerHeight - buttonRect.bottom;

      // Estimate tooltip height
      const estimatedTooltipHeight = 280;

      // Find the arrow element
      const arrow = tooltip.querySelector('.tooltip-arrow') as HTMLElement;

      // Determine vertical position (prefer above, but use below if not enough space)
      const positionAbove = spaceTop >= estimatedTooltipHeight || spaceTop > spaceBottom;

      // Calculate horizontal position - align right edge of tooltip with right edge of button
      let left = buttonRect.right - tooltipWidth;

      // Ensure tooltip doesn't overflow left
      if (left < padding) {
        left = padding;
      }

      // Ensure tooltip doesn't overflow right
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - padding - tooltipWidth;
      }

      // Set horizontal position
      tooltip.style.left = `${left}px`;

      // Calculate arrow position relative to button
      const arrowLeft = buttonRect.left + (buttonRect.width / 2) - left;

      // Set vertical position
      if (positionAbove) {
        tooltip.style.top = `${buttonRect.top - estimatedTooltipHeight - 8}px`;
        tooltip.style.bottom = '';
        if (arrow) {
          arrow.style.top = '100%';
          arrow.style.marginTop = '-0.25rem';
          arrow.style.bottom = '';
          arrow.style.left = `${arrowLeft}px`;
          arrow.style.right = '';
          arrow.style.transform = 'translateX(-50%)';
          arrow.style.borderTopColor = 'var(--color-bg-tertiary)';
          arrow.style.borderTopWidth = '8px';
          arrow.style.borderBottomColor = 'transparent';
          arrow.style.borderBottomWidth = '0';
        }
      } else {
        tooltip.style.top = `${buttonRect.bottom + 8}px`;
        tooltip.style.bottom = '';
        if (arrow) {
          arrow.style.bottom = '100%';
          arrow.style.marginBottom = '-0.25rem';
          arrow.style.top = '';
          arrow.style.left = `${arrowLeft}px`;
          arrow.style.right = '';
          arrow.style.transform = 'translateX(-50%)';
          arrow.style.borderBottomColor = 'var(--color-bg-tertiary)';
          arrow.style.borderBottomWidth = '8px';
          arrow.style.borderTopColor = 'transparent';
          arrow.style.borderTopWidth = '0';
        }
      }
    }
  }, [showTooltip]);

  return (
    <div className="flex flex-col gap-2">
      {/* Score and Info Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`${currentSize.text} font-semibold text-[var(--color-text-primary)]`}>
              {clampedScore.toFixed(2)}
            </span>
            <span className={`${currentSize.text} text-[var(--color-text-secondary)]`}>
              / 10.00
            </span>
          </div>
        </div>
        {showInfo && (
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              className="flex items-center justify-center rounded-full transition-all hover:bg-[var(--color-bg-secondary)] p-1 flex-shrink-0"
              style={{
                color: 'var(--color-info)',
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              aria-label="Nutrition score information"
              aria-describedby="nutrition-score-info"
            >
              <Info className={currentSize.icon} weight="fill" />
            </button>
          </div>
        )}
      </div>

      {/* Color Gradient Bar */}
      <div className="w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden border border-[var(--color-border)]">
        <div
          className={`${currentSize.bar} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${barWidth}%`,
            backgroundColor: barColor,
            boxShadow: barWidth > 0 ? `0 0 8px ${barColor}40` : 'none',
          }}
        />
      </div>

      {/* Tooltip rendered at root level with fixed positioning to avoid overflow issues */}
      {showInfo && showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[100] pointer-events-none whitespace-normal w-80"
        >
          <div
            className={`${currentSize.tooltip} bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl`}
            style={{
              wordWrap: 'break-word'
            }}
          >
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-xs">
              Nutrition Score Breakdown
            </h4>

            {breakdown ? (
              <>
                <div className="space-y-2 text-[var(--color-text-secondary)]">
                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreProtein30')}</p>
                      <p className="font-bold text-[var(--color-accent)] text-xs">+{breakdown.proteinScore.toFixed(2)} {t('food.pts')}</p>
                    </div>
                    <p className="text-xs leading-tight">{breakdown.protein.toFixed(1)}g {t('food.per100g')}</p>
                    <p className="text-xs leading-tight text-[var(--color-text-tertiary)] mt-0.5">
                      {t('food.nutritionScoreProteinRange')}
                    </p>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreCarbQuality30')}</p>
                      <p className="font-bold text-[var(--color-accent)] text-xs">+{breakdown.carbQualityScore.toFixed(2)} {t('food.pts')}</p>
                    </div>
                    <p className="text-xs leading-tight">{t('food.basedOnFoodCategory')}</p>
                    <p className="text-xs leading-tight text-[var(--color-text-tertiary)] mt-0.5">
                      {t('food.carbQualityExamples')}
                    </p>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreBalance40')}</p>
                      <p className="font-bold text-[var(--color-accent)] text-xs">+{breakdown.nutrientBalanceScore.toFixed(2)} {t('food.pts')}</p>
                    </div>
                    <p className="text-xs leading-tight">
                      {t('food.current')}: P {breakdown.totalMacros > 0 ? ((breakdown.protein * 4 / breakdown.totalMacros) * 100).toFixed(0) : 0}%, C {breakdown.totalMacros > 0 ? ((breakdown.carbs * 4 / breakdown.totalMacros) * 100).toFixed(0) : 0}%, F {breakdown.totalMacros > 0 ? ((breakdown.fat * 9 / breakdown.totalMacros) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-xs leading-tight text-[var(--color-text-tertiary)] mt-0.5">
                      {t('food.idealMacroDistribution')}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-[var(--color-text-primary)] text-xs">{t('food.totalScore')}:</p>
                    <p className="font-bold text-[var(--color-accent)] text-sm">{clampedScore.toFixed(2)}/10.00</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1 text-center">
                    {breakdown.proteinScore.toFixed(2)} + {breakdown.carbQualityScore.toFixed(2)} + {breakdown.nutrientBalanceScore.toFixed(2)} = {clampedScore.toFixed(2)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-secondary)] mb-2 text-xs leading-tight">
                  {t('food.scoreFromThreeComponents')}
                </p>
                <div className="space-y-1.5 text-[var(--color-text-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreProtein30')}</p>
                    <p className="text-xs mt-0.5 leading-tight">{t('food.proteinRange')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreCarbQuality30')}</p>
                    <p className="text-xs mt-0.5 leading-tight">{t('food.carbQualityExamples')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] text-xs">{t('food.nutritionScoreBalance40')}</p>
                    <p className="text-xs mt-0.5 leading-tight">{t('food.macroDistribution')}</p>
                  </div>
                </div>
                <p className="text-[var(--color-text-tertiary)] text-xs mt-2 italic leading-tight">
                  {t('food.finalScoreCalculation')}
                </p>
              </>
            )}
          </div>
          {/* Tooltip arrow - position and direction determined dynamically */}
          <div
            className="absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-b-8 tooltip-arrow"
            style={{
              right: '0.5rem',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: 'var(--color-bg-tertiary)',
              borderBottomColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default NutritionScore;
