import { Dialog } from '@headlessui/react';
import { X, Trash, FloppyDisk, Warning } from '@phosphor-icons/react';
import { WhatIfEntry, calculateWhatIfTotals } from '../types/whatif';
import { useLanguage } from '../context/LanguageContext';

interface WhatIfExitDialogProps {
  open: boolean;
  onClose: () => void;
  entries: WhatIfEntry[];
  onIgnore: () => void;
  onSaveAsMealPlan: () => void;
  isSaving?: boolean;
}

const WhatIfExitDialog = ({
  open,
  onClose,
  entries,
  onIgnore,
  onSaveAsMealPlan,
  isSaving = false,
}: WhatIfExitDialogProps) => {
  const { t } = useLanguage();
  const totals = calculateWhatIfTotals(entries);
  const plannedCount = entries.filter(e => e.isPlanned).length;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel 
          className="mx-auto max-w-md w-full rounded-xl shadow-xl p-6"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="nh-subtitle flex items-center gap-2">
              <Warning size={24} weight="fill" className="text-amber-500" />
              {t('profile.exitWhatIfMode')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <p className="nh-text mb-4" dangerouslySetInnerHTML={{
              __html: t('profile.youHavePlannedItems', { 
                count: plannedCount, 
                plural: plannedCount !== 1 ? 's' : '' 
              })
            }} />
            
            {/* Summary of planned items */}
            <div 
              className="p-4 rounded-lg mb-4"
              style={{ backgroundColor: 'var(--dietary-option-bg)' }}
            >
              <p className="text-sm font-medium mb-2">{t('profile.plannedNutrition')}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="nh-text opacity-70">{t('profile.calories')}:</span>
                  <span className="ml-2 font-semibold text-orange-500">{Math.round(totals.calories)}</span>
                </div>
                <div>
                  <span className="nh-text opacity-70">{t('profile.protein')}:</span>
                  <span className="ml-2 font-semibold text-blue-500">{totals.protein.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="nh-text opacity-70">{t('profile.carbs')}:</span>
                  <span className="ml-2 font-semibold text-green-500">{totals.carbs.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="nh-text opacity-70">{t('profile.fat')}:</span>
                  <span className="ml-2 font-semibold text-yellow-500">{totals.fat.toFixed(1)}g</span>
                </div>
              </div>
            </div>

            <p className="text-sm nh-text opacity-70">
              {t('profile.whatWouldYouLikeToDo')}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onSaveAsMealPlan}
              disabled={isSaving || plannedCount === 0}
              className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              <FloppyDisk size={20} weight="fill" />
              {isSaving ? t('nutrition.saving') : t('profile.saveAsMealPlan')}
            </button>
            
            <button
              onClick={onIgnore}
              className="nh-button flex items-center justify-center gap-2 py-3"
              style={{ 
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-error)'
              }}
            >
              <Trash size={20} weight="fill" />
              {t('profile.ignoreAndDiscard')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default WhatIfExitDialog;
