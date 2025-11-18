import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowsClockwise,
  Check,
  Coins,
  MagnifyingGlass,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import {
  Food,
  PaginatedResponse,
  PaginatedResponseWithStatus,
  PriceAudit,
  PriceCategory,
  PriceCategoryThreshold,
  PriceReport,
  PriceReportStatus,
  PriceUnit,
  apiClient,
} from '../../../lib/apiClient';

const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  per_100g: 'Per 100g',
  per_unit: 'Per Unit',
};

const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  '₺': '₺ • Budget friendly',
  '₺ ₺': '₺ ₺ • Mid range',
  '₺ ₺₺': '₺ ₺₺ • Premium',
};

const PRICE_CATEGORY_OPTIONS: PriceCategory[] = ['₺', '₺ ₺', '₺ ₺₺'];
const PRICE_UNITS: PriceUnit[] = ['per_100g', 'per_unit'];

const DEFAULT_CURRENCY = 'TRY';

const normalizeList = <T,>(
  data: PaginatedResponse<T> | PaginatedResponseWithStatus<T> | T[]
): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if ('results' in data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

const PriceModeration = () => {
  const [thresholdCurrency, setThresholdCurrency] = useState(DEFAULT_CURRENCY);
  const [thresholds, setThresholds] = useState<PriceCategoryThreshold[]>([]);
  const [thresholdLoading, setThresholdLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [priceForm, setPriceForm] = useState({
    base_price: '',
    price_unit: PRICE_UNITS[0],
    currency: DEFAULT_CURRENCY,
    reason: '',
    override_category: '',
    override_reason: '',
    clear_override: false,
  });

  const [audits, setAudits] = useState<PriceAudit[]>([]);
  const [auditFilters, setAuditFilters] = useState<{
    change_type?: string;
    price_unit?: PriceUnit | '';
  }>({});
  const [auditsLoading, setAuditsLoading] = useState(false);

  const [reports, setReports] = useState<PriceReport[]>([]);
  const [reportStatus, setReportStatus] =
    useState<'all' | PriceReportStatus>('open');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<number, string>>({});

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchThresholds();
  }, [thresholdCurrency]);

  useEffect(() => {
    fetchAudits();
  }, [auditFilters.change_type, auditFilters.price_unit]);

  useEffect(() => {
    fetchReports();
  }, [reportStatus]);

  const fetchThresholds = async () => {
    setThresholdLoading(true);
    try {
      const data = await apiClient.moderation.getPriceThresholds({
        currency: thresholdCurrency,
      });
      const normalized = normalizeList<PriceCategoryThreshold>(data);
      setThresholds(normalized);
    } catch (error) {
      console.error('Failed to load price thresholds', error);
      setFeedback('Unable to load price thresholds.');
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleRecalculateThreshold = async (price_unit: PriceUnit) => {
    try {
      const updated = await apiClient.moderation.recalculatePriceThreshold({
        price_unit,
        currency: thresholdCurrency,
      });
      setThresholds((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setFeedback('Thresholds recalculated successfully.');
    } catch (error) {
      console.error('Recalculation failed', error);
      setFeedback('Could not recalculate thresholds. Please try again.');
    }
  };

  const handleFoodSearch = async (event: FormEvent) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (term.length < 2) {
      setFeedback('Enter at least 2 characters to search for foods.');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiClient.getFoods({ search: term });
      const results = normalizeList(response);
      setFoods(results);
      if (results.length === 0) {
        setFeedback('No foods matched your search.');
      }
    } catch (error) {
      console.error('Food search failed', error);
      setFeedback('Food search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setPriceForm({
      base_price: food.base_price ? String(food.base_price) : '',
      price_unit: (food.price_unit as PriceUnit) || PRICE_UNITS[0],
      currency: food.currency || DEFAULT_CURRENCY,
      reason: '',
      override_category: '',
      override_reason: '',
      clear_override: false,
    });
  };

  const handlePriceUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFood) {
      return;
    }
    if (!priceForm.base_price) {
      setFeedback('Base price is required.');
      return;
    }
    if (
      priceForm.override_category &&
      priceForm.override_category !== '' &&
      !priceForm.override_reason
    ) {
      setFeedback('Override reason is required when selecting a category.');
      return;
    }
    if (priceForm.override_category && priceForm.clear_override) {
      setFeedback('Cannot override and clear override simultaneously.');
      return;
    }

    try {
      const payload: any = {
        base_price: priceForm.base_price,
        price_unit: priceForm.price_unit,
        currency: priceForm.currency,
        reason: priceForm.reason,
      };
      if (priceForm.override_category) {
        payload.override_category = priceForm.override_category;
        payload.override_reason = priceForm.override_reason;
      }
      if (priceForm.clear_override) {
        payload.clear_override = true;
      }

      const updated = await apiClient.moderation.updateFoodPrice(
        selectedFood.id,
        payload
      );
      setSelectedFood(updated);
      setFoods((prev) =>
        prev.map((food) => (food.id === updated.id ? updated : food))
      );
      setFeedback('Food price updated and recipes recalculated.');
    } catch (error) {
      console.error('Failed to update price', error);
      setFeedback('Failed to update price. Please check the values and retry.');
    }
  };

  const fetchAudits = async () => {
    setAuditsLoading(true);
    try {
      const data = await apiClient.moderation.getPriceAudits({
        change_type: auditFilters.change_type || undefined,
        price_unit: auditFilters.price_unit || undefined,
      });
      const normalized = normalizeList<PriceAudit>(data);
      setAudits(normalized.slice(0, 10));
    } catch (error) {
      console.error('Failed to load audits', error);
      setFeedback('Unable to load price audit history.');
    } finally {
      setAuditsLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const data = await apiClient.moderation.getPriceReports({
        status: reportStatus === 'all' ? undefined : reportStatus,
      });
      const normalized = normalizeList<PriceReport>(data);
      setReports(normalized);
      setReportNotes(
        normalized.reduce<Record<number, string>>((map, report) => {
          map[report.id] = report.resolution_notes || '';
          return map;
        }, {})
      );
    } catch (error) {
      console.error('Failed to load price reports', error);
      setFeedback('Unable to load price reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReportUpdate = async (
    report: PriceReport,
    status: PriceReportStatus
  ) => {
    if (status === 'resolved' && !reportNotes[report.id]) {
      setFeedback('Resolution notes are required to close a report.');
      return;
    }

    try {
      await apiClient.moderation.updatePriceReport(report.id, {
        status,
        resolution_notes:
          status === 'resolved' ? reportNotes[report.id] : undefined,
      });
      setFeedback(`Report #${report.id} updated.`);
      fetchReports();
    } catch (error) {
      console.error('Failed to update report', error);
      setFeedback('Could not update report status.');
    }
  };

  const activeOverride = useMemo(() => {
    if (!selectedFood || !selectedFood.category_overridden_by) {
      return null;
    }
    return {
      by: selectedFood.category_overridden_by,
      reason: selectedFood.category_override_reason,
      at: selectedFood.category_overridden_at,
    };
  }, [selectedFood]);

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100 flex justify-between items-center">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-amber-700 dark:text-amber-50 hover:text-amber-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Price Thresholds
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review tertile boundaries per price unit. Eşikler otomatik
              hesaplanır ama gerekirse yeniden başlatabilirsiniz.
            </p>
          </div>
          <input
            value={thresholdCurrency}
            onChange={(e) => setThresholdCurrency(e.target.value.toUpperCase())}
            className="w-24 border border-gray-200 dark:border-gray-700 rounded px-3 py-1 text-sm bg-transparent"
            placeholder="TRY"
          />
        </div>
        {thresholdLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {PRICE_UNITS.map((unit) => {
              const threshold = thresholds.find(
                (item) => item.price_unit === unit
              );
              return (
                <div
                  key={unit}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {PRICE_UNIT_LABELS[unit]}
                      </p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {threshold?.lower_threshold
                          ? `${threshold.lower_threshold} - ${threshold.upper_threshold || '∞'}`
                          : 'No data yet'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRecalculateThreshold(unit)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <ArrowsClockwise size={16} />
                      Recalculate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Updates since last: {threshold?.updates_since_recalculation ?? 0}
                  </p>
                  {threshold?.last_recalculated_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last updated:{' '}
                      {new Date(
                        threshold.last_recalculated_at
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Coins size={20} className="text-primary" />
            Food Price Updates
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search foods, review current category badges, and adjust base prices
            or overrides.
          </p>
        </div>

        <form
          onSubmit={handleFoodSearch}
          className="flex gap-2 flex-col md:flex-row"
        >
          <div className="flex-1 relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
              placeholder="Search foods by name"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={searchLoading}
          >
            Search
          </button>
        </form>

        {searchLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          foods.length > 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              {foods.slice(0, 6).map((food) => (
                <button
                  type="button"
                  key={food.id}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedFood?.id === food.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
                  onClick={() => selectFood(food)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {food.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {food.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {food.base_price
                        ? `${food.base_price} ${food.currency || DEFAULT_CURRENCY}`
                        : 'No price'}
                    </span>
                  </div>
                  {food.price_category && (
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      Category: {PRICE_CATEGORY_LABELS[food.price_category]}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {selectedFood && (
          <form onSubmit={handlePriceUpdate} className="space-y-4 border-t pt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Base Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceForm.base_price}
                  onChange={(e) =>
                    setPriceForm((prev) => ({
                      ...prev,
                      base_price: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Price Unit
                </label>
                <select
                  value={priceForm.price_unit}
                  onChange={(e) =>
                    setPriceForm((prev) => ({
                      ...prev,
                      price_unit: e.target.value as PriceUnit,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                >
                  {PRICE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {PRICE_UNIT_LABELS[unit]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Currency
                </label>
                <input
                  value={priceForm.currency}
                  onChange={(e) =>
                    setPriceForm((prev) => ({
                      ...prev,
                      currency: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Reason / Notes
              </label>
              <textarea
                value={priceForm.reason}
                onChange={(e) =>
                  setPriceForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                rows={2}
                placeholder="Visible in audit log (optional)"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Manual Category Override
                </label>
                <select
                  value={priceForm.override_category}
                  onChange={(e) =>
                    setPriceForm((prev) => ({
                      ...prev,
                      override_category: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                >
                  <option value="">Use automatic category</option>
                  {PRICE_CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {PRICE_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <textarea
                  value={priceForm.override_reason}
                  onChange={(e) =>
                    setPriceForm((prev) => ({
                      ...prev,
                      override_reason: e.target.value,
                    }))
                  }
                  placeholder="Explain override reason"
                  className="w-full mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Current Badge
                </label>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedFood.price_category
                      ? PRICE_CATEGORY_LABELS[selectedFood.price_category]
                      : 'Not categorized yet'}
                  </p>
                  {activeOverride && (
                    <p className="text-xs text-amber-600 dark:text-amber-200 mt-1 flex items-center gap-1">
                      <WarningCircle size={14} />
                      Override active: {activeOverride.reason || 'N/A'}
                    </p>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={priceForm.clear_override}
                    onChange={(e) =>
                      setPriceForm((prev) => ({
                        ...prev,
                        clear_override: e.target.checked,
                      }))
                    }
                  />
                  Clear manual override
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Check size={18} />
              Save Price Update
            </button>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Price Audit Trail
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recent price changes, overrides, and recipe recalculations.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={auditFilters.change_type || ''}
              onChange={(e) =>
                setAuditFilters((prev) => ({
                  ...prev,
                  change_type: e.target.value || undefined,
                }))
              }
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1 text-sm"
            >
              <option value="">All changes</option>
              <option value="price_update">Price updates</option>
              <option value="category_override">Overrides</option>
              <option value="threshold_recalc">Threshold recalcs</option>
              <option value="recipe_recalc">Recipe recalcs</option>
            </select>
            <select
              value={auditFilters.price_unit || ''}
              onChange={(e) =>
                setAuditFilters((prev) => ({
                  ...prev,
                  price_unit: (e.target.value as PriceUnit) || undefined,
                }))
              }
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1 text-sm"
            >
              <option value="">All units</option>
              {PRICE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {PRICE_UNIT_LABELS[unit]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {auditsLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : audits.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No audit records found for the selected filters.
          </p>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {audit.food_name || audit.change_type}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {new Date(audit.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {PRICE_UNIT_LABELS[audit.price_unit]} • {audit.currency}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {audit.reason || 'No notes'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex flex-wrap gap-2">
                  {audit.old_base_price && (
                    <span>
                      {audit.old_base_price} → {audit.new_base_price}
                    </span>
                  )}
                  {audit.old_price_category && (
                    <span>
                      Badge: {audit.old_price_category} →{' '}
                      {audit.new_price_category || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Price Reports
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Community members can report inaccurate prices. Update their status
            here.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'in_review', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setReportStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                reportStatus === status
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {status.toString().replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        {reportsLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No price reports for this status.
          </p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {report.food_name || `Food #${report.food}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported by {report.reported_by_username} •{' '}
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {report.description}
                </p>
                <textarea
                  value={reportNotes[report.id] || ''}
                  onChange={(e) =>
                    setReportNotes((prev) => ({
                      ...prev,
                      [report.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Moderator notes"
                />
                <div className="flex gap-2 flex-wrap">
                  {report.status === 'open' && (
                    <button
                      onClick={() => handleReportUpdate(report, 'in_review')}
                      className="px-3 py-1.5 rounded-lg border border-primary text-primary text-sm"
                    >
                      Mark In Review
                    </button>
                  )}
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleReportUpdate(report, 'resolved')}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PriceModeration;

