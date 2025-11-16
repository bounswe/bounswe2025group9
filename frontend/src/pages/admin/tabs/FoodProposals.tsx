import { useState, useEffect } from 'react';
import { ForkKnife, Check, X, Eye } from '@phosphor-icons/react';

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
}

// Mock data for UI-only PR
const MOCK_PROPOSALS: FoodProposal[] = [
  {
    id: 1,
    name: 'Quinoa Salad',
    category: 'Salad',
    servingSize: 250,
    caloriesPerServing: 320,
    proteinContent: 12,
    fatContent: 8,
    carbohydrateContent: 48,
    nutritionScore: 8.6,
    imageUrl: 'https://picsum.photos/seed/quinoa/200/200',
    isApproved: null,
    proposedBy: { id: 11, username: 'dietlover' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    dietaryOptions: ['Vegan'],
    allergens: ['Nuts']
  },
  {
    id: 2,
    name: 'Greek Yogurt Bowl',
    category: 'Breakfast',
    servingSize: 200,
    caloriesPerServing: 180,
    proteinContent: 15,
    fatContent: 4,
    carbohydrateContent: 22,
    nutritionScore: 7.9,
    imageUrl: 'https://picsum.photos/seed/yogurt/200/200',
    isApproved: true,
    proposedBy: { id: 12, username: 'nutrihero' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    dietaryOptions: ['High-Protein']
  },
  {
    id: 3,
    name: 'Fried Donut',
    category: 'Dessert',
    servingSize: 90,
    caloriesPerServing: 410,
    proteinContent: 3,
    fatContent: 24,
    carbohydrateContent: 44,
    nutritionScore: 3.2,
    imageUrl: 'https://picsum.photos/seed/donut/200/200',
    isApproved: false,
    proposedBy: { id: 13, username: 'sweettooth' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    allergens: ['Gluten']
  }
];

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
    // Mocked filtering logic
    let data = [...MOCK_PROPOSALS];
    if (filter === 'pending') data = data.filter(p => p.isApproved === null);
    if (filter === 'approved') data = data.filter(p => p.isApproved === true);
    if (filter === 'rejected') data = data.filter(p => p.isApproved === false);
    setTimeout(() => {
      setProposals(data);
      setLoading(false);
    }, 200); // tiny delay to show loader
  };

  const handleApprove = async (proposalId: number, approve: boolean) => {
    alert('Moderation API is not included in this PR.');
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
                {proposal.imageUrl && (
                  <img
                    src={proposal.imageUrl}
                    alt={proposal.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
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

              {/* Actions */}
              {proposal.isApproved === null && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedProposal(proposal)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Eye size={16} />
                    Details
                  </button>
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
                </div>
              )}

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Full Nutritional Information</h4>
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedProposal.caloriesPerServing}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodProposals;
