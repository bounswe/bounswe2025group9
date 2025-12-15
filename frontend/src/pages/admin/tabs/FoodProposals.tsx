import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ForkKnife, Check, X, Eye, PencilSimple, Clock, CheckCircle, XCircle, Hamburger, CaretDown, CaretRight } from '@phosphor-icons/react';
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
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<FoodProposal[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<FoodProposal | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    macros: true,
    dietary: false,
    pricing: false,
    micronutrients: false,
  });

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

  const openEditModal = (proposal: FoodProposal) => {
    // Navigate to the propose page with moderation data
    navigate('/foods/propose', {
      state: {
        moderationData: {
          proposalId: proposal.id,
          name: proposal.name,
          category: proposal.category,
          servingSize: proposal.servingSize,
          caloriesPerServing: proposal.caloriesPerServing,
          proteinContent: proposal.proteinContent,
          fatContent: proposal.fatContent,
          carbohydrateContent: proposal.carbohydrateContent,
          dietaryOptions: proposal.dietaryOptions,
          imageUrl: proposal.imageUrl,
          micronutrients: proposal.micronutrients,
        }
      }
    });
  };

  const getStatusIcon = (isApproved: boolean | null) => {
    if (isApproved === null) return <Clock size={16} weight="fill" />;
    if (isApproved) return <CheckCircle size={16} weight="fill" />;
    return <XCircle size={16} weight="fill" />;
  };

  const getStatusColor = (isApproved: boolean | null) => {
    if (isApproved === null) return '#f59e0b'; // amber
    if (isApproved) return '#10b981'; // green
    return '#ef4444'; // red
  };

  const getStatusLabel = (isApproved: boolean | null) => {
    if (isApproved === null) return 'Pending';
    if (isApproved) return 'Approved';
    return 'Rejected';
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-4 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: 'var(--forum-search-border)' }}></div>
              <div className="flex-1">
                <div className="h-5 w-1/3 rounded mb-2" style={{ backgroundColor: 'var(--forum-search-border)' }}></div>
                <div className="h-4 w-1/4 rounded" style={{ backgroundColor: 'var(--forum-search-border)' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => {
          const isActive = filter === status;
          const statusColors: Record<string, string> = {
            pending: '#f59e0b',
            approved: '#10b981',
            rejected: '#ef4444',
            all: 'var(--color-primary)',
          };
          
          return (
          <button
            key={status}
            onClick={() => setFilter(status)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? statusColors[status] : 'var(--dietary-option-bg)',
                color: isActive ? 'white' : 'inherit',
              }}
            >
              {status === 'pending' && <Clock size={16} weight="fill" />}
              {status === 'approved' && <CheckCircle size={16} weight="fill" />}
              {status === 'rejected' && <XCircle size={16} weight="fill" />}
              {status === 'all' && <ForkKnife size={16} weight="fill" />}
              <span className="capitalize">{status}</span>
              {status !== 'all' && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : statusColors[status],
                    color: 'white'
                  }}
                >
                  {proposals.filter(p => 
                    status === 'pending' ? p.isApproved === null :
                    status === 'approved' ? p.isApproved === true :
                    p.isApproved === false
                  ).length}
                </span>
              )}
          </button>
          );
        })}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div 
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: 'var(--dietary-option-bg)' }}
          >
            <ForkKnife size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium opacity-70">No food proposals found</p>
            <p className="text-sm opacity-50 mt-1">
              {filter === 'pending' ? 'All proposals have been reviewed' : 
               filter === 'approved' ? 'No approved proposals yet' :
               filter === 'rejected' ? 'No rejected proposals' :
               'No proposals have been submitted'}
            </p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="nh-card hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                {proposal.imageUrl ? (
                  <img
                    src={proposal.imageUrl}
                    alt={proposal.name}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--forum-search-border)' }}
                  >
                    <div className="text-center">
                      <Hamburger size={28} className="mx-auto opacity-50" />
                      <span className="text-xs opacity-40">No image</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{proposal.name}</h3>
                      <p className="text-sm opacity-70">{proposal.category} • {proposal.servingSize}g serving</p>
                </div>
                    
                    {/* Status Badge */}
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ 
                        backgroundColor: `${getStatusColor(proposal.isApproved)}20`,
                        color: getStatusColor(proposal.isApproved)
                      }}
                    >
                      {getStatusIcon(proposal.isApproved)}
                      {getStatusLabel(proposal.isApproved)}
                  </div>
                  </div>

                  {/* Nutrition Score */}
                  <div className="mt-3 flex items-center gap-4">
                    <div 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      <span className="text-xs font-medium">Score</span>
                      <span className="text-lg font-bold">{proposal.nutritionScore.toFixed(1)}</span>
              </div>

                    {/* Macros Preview */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium text-orange-500">{proposal.caloriesPerServing} kcal</span>
                      <span className="opacity-60">P: {proposal.proteinContent}g</span>
                      <span className="opacity-60">C: {proposal.carbohydrateContent}g</span>
                      <span className="opacity-60">F: {proposal.fatContent}g</span>
                </div>
              </div>

                  {/* Dietary Tags */}
                  {(proposal.allergens?.length || proposal.dietaryOptions?.length) ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                  {proposal.dietaryOptions?.map((option) => (
                    <span
                      key={option}
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                    >
                      {option}
                    </span>
                  ))}
                  {proposal.allergens?.map((allergen) => (
                    <span
                      key={allergen}
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
                  ) : null}

                  {/* Pricing */}
                {proposal.base_price ? (
                    <div 
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                    >
                      <span className="font-semibold">{proposal.base_price} {proposal.currency || 'TRY'}</span>
                      <span className="text-xs opacity-70">
                      {PRICE_UNIT_LABELS[(proposal.price_unit as PriceUnit) || 'per_100g']}
                    </span>
                  </div>
                  ) : null}

                  {/* Meta Info */}
                  <div className="mt-3 flex items-center gap-4 text-xs opacity-60">
                    <span>Proposed by: <span className="font-medium">{proposal.proposedBy.username}</span></span>
                    <span>•</span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 flex flex-wrap gap-2 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                >
                  <Eye size={18} />
                  View Details
                </button>
                <button
                  onClick={() => openEditModal(proposal)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                >
                  <PencilSimple size={18} />
                  Edit
                </button>
                {proposal.isApproved === null && (
                  <>
                    <button
                      onClick={() => handleApprove(proposal.id, true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ml-auto"
                      style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                      <Check size={18} weight="bold" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(proposal.id, false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                    >
                      <X size={18} weight="bold" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedProposal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl shadow-lg"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--dietary-option-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="nh-card mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      <ForkKnife size={24} weight="fill" />
                    </div>
                    <div>
                      <h2 className="nh-subtitle">{selectedProposal.name}</h2>
                      <p className="text-sm opacity-70">{selectedProposal.category}</p>
                    </div>
                  </div>
              <button
                onClick={() => setSelectedProposal(null)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                    <X size={20} />
              </button>
            </div>
              </div>

              {/* Image */}
              <div className="nh-card mb-6">
                {selectedProposal.imageUrl ? (
                  <img
                    src={selectedProposal.imageUrl}
                    alt={selectedProposal.name}
                    className="w-full max-h-64 object-contain rounded-lg"
                    style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                  />
                ) : (
                  <div 
                    className="w-full h-48 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                  >
                    <div className="text-center">
                      <ForkKnife size={48} className="mx-auto opacity-30 mb-2" />
                      <span className="text-sm opacity-50">AI image is being generated...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nutrition Summary */}
              <div className="nh-card mb-6">
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    <p className="text-xs opacity-80 mb-1">Score</p>
                    <p className="text-2xl font-bold">{selectedProposal.nutritionScore.toFixed(1)}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                    <p className="text-xs opacity-70 mb-1">Calories</p>
                    <p className="text-xl font-bold text-orange-500">{selectedProposal.caloriesPerServing}</p>
                    <p className="text-xs opacity-50">kcal</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                    <p className="text-xs opacity-70 mb-1">Protein</p>
                    <p className="text-xl font-bold text-blue-500">{selectedProposal.proteinContent}</p>
                    <p className="text-xs opacity-50">grams</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                    <p className="text-xs opacity-70 mb-1">Carbs</p>
                    <p className="text-xl font-bold text-green-500">{selectedProposal.carbohydrateContent}</p>
                    <p className="text-xs opacity-50">grams</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                    <p className="text-xs opacity-70 mb-1">Fat</p>
                    <p className="text-xl font-bold text-yellow-500">{selectedProposal.fatContent}</p>
                    <p className="text-xs opacity-50">grams</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {/* Basic Info Section */}
                <div className="nh-card">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="font-semibold">Basic Information</span>
                    {expandedSections.basic ? <CaretDown size={18} /> : <CaretRight size={18} />}
                  </button>
                  {expandedSections.basic && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <p className="text-xs opacity-70">Category</p>
                        <p className="font-medium">{selectedProposal.category}</p>
                  </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <p className="text-xs opacity-70">Serving Size</p>
                        <p className="font-medium">{selectedProposal.servingSize}g</p>
                  </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <p className="text-xs opacity-70">Proposed By</p>
                        <p className="font-medium">{selectedProposal.proposedBy.username}</p>
                  </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <p className="text-xs opacity-70">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: getStatusColor(selectedProposal.isApproved) }}>
                            {getStatusIcon(selectedProposal.isApproved)}
                          </span>
                          <span className="font-medium">{getStatusLabel(selectedProposal.isApproved)}</span>
                          {selectedProposal.is_private && <span className="text-xs opacity-50">(Private)</span>}
                  </div>
                </div>
                    </div>
                  )}
              </div>

                {/* Micronutrients Section */}
              {selectedProposal.micronutrients && Object.keys(selectedProposal.micronutrients).length > 0 && (
                  <div className="nh-card">
                    <button
                      onClick={() => toggleSection('micronutrients')}
                      className="w-full flex items-center justify-between"
                    >
                      <span className="font-semibold">Micronutrients</span>
                      {expandedSections.micronutrients ? <CaretDown size={18} /> : <CaretRight size={18} />}
                    </button>
                    {expandedSections.micronutrients && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                    {Object.entries(selectedProposal.micronutrients).map(([nutrient, value]) => (
                          <div key={nutrient} className="p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                            <span className="opacity-70 capitalize">{nutrient}:</span>
                            <span className="ml-2 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                    )}
                </div>
              )}

                {/* Dietary & Allergens Section */}
              {(selectedProposal.allergens?.length || selectedProposal.dietaryOptions?.length) && (
                  <div className="nh-card">
                    <button
                      onClick={() => toggleSection('dietary')}
                      className="w-full flex items-center justify-between"
                    >
                      <span className="font-semibold">Dietary Information</span>
                      {expandedSections.dietary ? <CaretDown size={18} /> : <CaretRight size={18} />}
                    </button>
                    {expandedSections.dietary && (
                      <div className="mt-4 space-y-3">
                    {selectedProposal.dietaryOptions && selectedProposal.dietaryOptions.length > 0 && (
                      <div>
                            <p className="text-sm opacity-70 mb-2">Dietary Options</p>
                            <div className="flex flex-wrap gap-2">
                          {selectedProposal.dietaryOptions.map((option) => (
                            <span
                              key={option}
                                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProposal.allergens && selectedProposal.allergens.length > 0 && (
                      <div>
                            <p className="text-sm opacity-70 mb-2">Allergens</p>
                            <div className="flex flex-wrap gap-2">
                          {selectedProposal.allergens.map((allergen) => (
                            <span
                              key={allergen}
                                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                    )}
                </div>
              )}

                {/* Pricing Section */}
                <div className="nh-card">
                  <button
                    onClick={() => toggleSection('pricing')}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="font-semibold">Pricing Details</span>
                    {expandedSections.pricing ? <CaretDown size={18} /> : <CaretRight size={18} />}
                  </button>
                  {expandedSections.pricing && (
                    <div className="mt-4">
                {selectedProposal.base_price ? (
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-blue-500">
                        {selectedProposal.base_price} {selectedProposal.currency || 'TRY'}
                      </span>
                    </div>
                          <p className="text-sm text-blue-500 opacity-80 mt-1">
                            {PRICE_UNIT_LABELS[(selectedProposal.price_unit as PriceUnit) || 'per_100g']}
                          </p>
                  </div>
                ) : (
                        <div 
                          className="p-4 rounded-lg text-center"
                          style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                        >
                          <p className="text-amber-600">No pricing information submitted</p>
                        </div>
                      )}
                  </div>
                )}
              </div>

                {/* Timeline */}
                <div className="nh-card">
                  <p className="text-sm opacity-70">Submitted</p>
                  <p className="font-medium">{new Date(selectedProposal.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => openEditModal(selectedProposal)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                >
                  <PencilSimple size={20} />
                  Edit
                </button>
              {selectedProposal.isApproved === null && (
                  <>
                  <button
                    onClick={() => handleApprove(selectedProposal.id, true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#10b981', color: 'white' }}
                  >
                    <Check size={20} weight="bold" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprove(selectedProposal.id, false)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                  >
                    <X size={20} weight="bold" />
                    Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodProposals;
