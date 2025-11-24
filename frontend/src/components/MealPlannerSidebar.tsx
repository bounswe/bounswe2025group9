import { Funnel, CalendarBlank } from '@phosphor-icons/react'

interface MealPlannerSidebarProps {
  dietaryPreference: string
  setDietaryPreference: (pref: string) => void
  planDuration: 'weekly' | 'daily'
  setPlanDuration: (duration: 'weekly' | 'daily') => void
  onSave: () => void
}

const MealPlannerSidebar = ({
  dietaryPreference,
  setDietaryPreference,
  planDuration,
  setPlanDuration,
  onSave
}: MealPlannerSidebarProps) => {
  // Helper to get tag styles based on dietary preference
  const getTagStyle = (preference: string) => {
    switch (preference) {
      case 'vegan':
        return {
          bg: 'var(--forum-vegan-bg)',
          text: 'var(--forum-vegan-text)',
          activeBg: 'var(--forum-vegan-active-bg)',
          activeText: 'var(--forum-vegan-active-text)',
          hoverBg: 'var(--forum-vegan-hover-bg)'
        };
      case 'halal':
        return {
          bg: 'var(--forum-halal-bg)',
          text: 'var(--forum-halal-text)',
          activeBg: 'var(--forum-halal-active-bg)',
          activeText: 'var(--forum-halal-active-text)',
          hoverBg: 'var(--forum-halal-hover-bg)'
        };
      case 'high-protein':
        return {
          bg: 'var(--forum-high-protein-bg)',
          text: 'var(--forum-high-protein-text)',
          activeBg: 'var(--forum-high-protein-active-bg)',
          activeText: 'var(--forum-high-protein-active-text)',
          hoverBg: 'var(--forum-high-protein-hover-bg)'
        };
      default:
        return {
          bg: 'var(--forum-default-bg)',
          text: 'var(--forum-default-text)',
          activeBg: 'var(--forum-default-active-bg)',
          activeText: 'var(--forum-default-active-text)',
          hoverBg: 'var(--forum-default-hover-bg)'
        };
    }
  };

  return (
    <div className="sticky top-20 flex flex-col gap-4">
      {/* Dietary Preferences */}
      <div className="nh-card">
        <h3 className="nh-subtitle mb-4 flex items-center gap-2">
          <Funnel size={20} weight="fill" className="text-primary" />
          Dietary Preferences
        </h3>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setDietaryPreference('high-protein')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: dietaryPreference === 'high-protein'
                ? getTagStyle('high-protein').activeBg
                : getTagStyle('high-protein').bg,
              color: dietaryPreference === 'high-protein'
                ? getTagStyle('high-protein').activeText
                : getTagStyle('high-protein').text
            }}
          >
            <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
            <span className="flex-grow text-center">High-Protein</span>
          </button>

          <button
            onClick={() => setDietaryPreference('halal')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: dietaryPreference === 'halal'
                ? getTagStyle('halal').activeBg
                : getTagStyle('halal').bg,
              color: dietaryPreference === 'halal'
                ? getTagStyle('halal').activeText
                : getTagStyle('halal').text
            }}
          >
            <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
            <span className="flex-grow text-center">Halal</span>
          </button>

          <button
            onClick={() => setDietaryPreference('vegan')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: dietaryPreference === 'vegan'
                ? getTagStyle('vegan').activeBg
                : getTagStyle('vegan').bg,
              color: dietaryPreference === 'vegan'
                ? getTagStyle('vegan').activeText
                : getTagStyle('vegan').text
            }}
          >
            <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
            <span className="flex-grow text-center">Vegan</span>
          </button>
        </div>
      </div>

      {/* Plan Settings */}
      <div className="nh-card">
        <h3 className="nh-subtitle mb-4 text-sm">Plan Settings</h3>
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-medium nh-text">Plan Duration</label>
            <select 
              value={planDuration}
              onChange={(e) => setPlanDuration(e.target.value as 'weekly' | 'daily')}
              className="w-full px-3 py-2 text-sm rounded-md border focus:ring-primary focus:border-primary nh-text"
              style={{
                backgroundColor: 'var(--dietary-option-bg)',
                borderColor: 'var(--dietary-option-border)'
              }}
            >
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium"
      >
        Save Meal Plan
      </button>
    </div>
  )
}

export default MealPlannerSidebar

