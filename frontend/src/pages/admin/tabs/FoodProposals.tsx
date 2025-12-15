import { useState, useEffect } from 'react';
import { ForkKnife, Check, X, Eye } from '@phosphor-icons/react';
import { apiClient, PriceUnit } from '../../../lib/apiClient';

const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  per_100g: 'Per 100g',
  per_unit: 'Per Unit',
};

interface FoodProposal {
  id: number;
  name: string;
  category: string;
  servingSize: number;
  caloriesPerServing: number;
  proteinContent: number;
  fatContent: number;
  carbohydrateContent: number;
  nutritionScore: number;
  imageUrl?: string;
  isApproved: boolean | null;
  proposedBy: {
    id: number;
    username: string;
  };
  createdAt: string;
  allergens?: string[];
  dietaryOptions?: string[];
  base_price?: string | number | null;
  price_unit?: PriceUnit | null;
  currency?: string | null;
  micronutrients?: Record<string, number>;
  is_private?: boolean;
}

const FoodProposals = () => {
  const [proposals, setProposals] = useState<FoodProposal[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<FoodProposal | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params: { isApproved?: 'null' | 'true' | 'false' } = {};

      if (filter === 'pending') {
        params.isApproved = 'null';  // Pending proposals have isApproved=null (not reviewed)
      } else if (filter === 'approved') {
        params.isApproved = 'true';
      } else if (filter === 'rejected') {
        params.isApproved = 'false';  // Rejected proposals have isApproved=false
      }

      const data = await apiClient.moderation.getFoodProposals(params);
      setProposals(data.results || data);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: number, approve: boolean) => {
    try {
      const result = await apiClient.moderation.approveFoodProposal(proposalId, approve);
      console.log(result.message);

      // Refresh the list
      fetchProposals();
      setSelectedProposal(null);
    } catch (error) {
      console.error('Failed to update proposal:', error);
      alert('Failed to update proposal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: filter === status
                ? 'var(--forum-default-active-bg)'
                : 'var(--forum-default-bg)',
              color: filter === status
                ? 'var(--forum-default-active-text)'
                : 'var(--forum-default-text)'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Proposals Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {proposals.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
            <ForkKnife size={48} className="mx-auto mb-4 opacity-50" />
            <p>No food proposals found</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                {proposal.imageUrl ? (
                  <img
                    src={proposal.imageUrl}
                    alt={proposal.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <ForkKnife size={24} className="mx-auto text-gray-400" />
                      <span className="text-xs text-gray-400">Generating...</span>
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {proposal.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {proposal.category} • {proposal.servingSize}g serving
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Proposed by: {proposal.proposedBy.username}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {proposal.nutritionScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Score
                  </div>
                </div>
              </div>

              {/* Nutritional Info */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {proposal.caloriesPerServing}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Protein</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {proposal.proteinContent}g
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Carbs</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {proposal.carbohydrateContent}g
                  </div>
                </div>
              </div>

              {/* Tags */}
              {(proposal.allergens?.length || proposal.dietaryOptions?.length) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {proposal.dietaryOptions?.map((option) => (
                    <span
                      key={option}
                      className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded"
                    >
                      {option}
                    </span>
                  ))}
                  {proposal.allergens?.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 text-sm">
                {proposal.base_price ? (
                  <div className="px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">
                      {proposal.base_price} {proposal.currency || 'TRY'}
                    </span>
                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-300">
                      {PRICE_UNIT_LABELS[(proposal.price_unit as PriceUnit) || 'per_100g']}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-100 text-xs">
                    No pricing information submitted with this proposal.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye size={16} />
                  Details
                </button>
                {proposal.isApproved === null && (
                  <>
                    <button
                      onClick={() => handleApprove(proposal.id, true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      <Check size={16} weight="bold" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(proposal.id, false)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      <X size={16} weight="bold" />
                      Reject
                    </button>
                  </>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Submitted: {new Date(proposal.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedProposal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {selectedProposal.name}
              </h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Image */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Image</h4>
                {selectedProposal.imageUrl ? (
                  <img
                    src={selectedProposal.imageUrl}
                    alt={selectedProposal.name}
                    className="w-full max-h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <ForkKnife size={48} className="mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        AI image is being generated...
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Refresh the page in a few seconds
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.category}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Serving Size:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.servingSize}g</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Nutrition Score:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.nutritionScore.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Proposed By:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.proposedBy.username}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedProposal.isApproved === null ? 'Pending' : selectedProposal.isApproved ? 'Approved' : 'Rejected'}
                      {selectedProposal.is_private && ' (Private)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Macronutrients */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Macronutrients (per serving)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.caloriesPerServing} kcal</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Protein:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.proteinContent}g</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fat:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.fatContent}g</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Carbohydrates:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.carbohydrateContent}g</span>
                  </div>
                </div>
              </div>

              {/* Micronutrients */}
              {selectedProposal.micronutrients && Object.keys(selectedProposal.micronutrients).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Micronutrients (per serving)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedProposal.micronutrients).map(([nutrient, value]) => (
                      <div key={nutrient} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{nutrient}:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens & Dietary Options */}
              {(selectedProposal.allergens?.length || selectedProposal.dietaryOptions?.length) && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Allergens & Dietary Information</h4>
                  <div className="space-y-2">
                    {selectedProposal.dietaryOptions && selectedProposal.dietaryOptions.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Dietary Options:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProposal.dietaryOptions.map((option) => (
                            <span
                              key={option}
                              className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProposal.allergens && selectedProposal.allergens.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Allergens:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProposal.allergens.map((allergen) => (
                            <span
                              key={allergen}
                              className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pricing Details</h4>
                {selectedProposal.base_price ? (
                  <div className="p-3 rounded-md border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {selectedProposal.base_price} {selectedProposal.currency || 'TRY'}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      Unit: {PRICE_UNIT_LABELS[(selectedProposal.price_unit as PriceUnit) || 'per_100g']}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-100 text-sm">
                    This proposal does not include pricing data.
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Submitted: {new Date(selectedProposal.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Action Buttons - Only show for pending proposals */}
              {selectedProposal.isApproved === null && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleApprove(selectedProposal.id, true)}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check size={20} weight="bold" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprove(selectedProposal.id, false)}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X size={20} weight="bold" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodProposals;
