import { Hamburger, Funnel, MagnifyingGlass, X, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { apiClient , Food} from '../../lib/apiClient';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FoodDetail from './FoodDetail';
import NutritionScore from '../../components/NutritionScore';

export const FoodItem = ({ item, onClick }: { item: Food, onClick: () => void }) => {
  return (
    <div
      key={item.id}
      className="nh-card p-4 cursor-pointer hover:shadow-lg transition-shadow w-full max-w-xs mx-auto flex flex-col"
      onClick={onClick}
    >
      <div className="food-image-container h-60 w-full flex justify-center items-center mb-4 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="object-contain h-full w-full rounded"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="food-image-placeholder w-full h-full flex items-center justify-center">
            <Hamburger size={64} weight="fill" className="text-primary opacity-50" />
          </div>
        )}
      </div>

      <div className="flex items-center mt-4">
        <h3 className="nh-subtitle">{item.name}</h3>
      </div>

      <div className="mt-2">
        <p className="nh-text">Category: {item.category}</p>
        <div className="mt-2">
          <p className="nh-text mb-2">Nutrition Score:</p>
          <NutritionScore 
            score={item.nutritionScore} 
            size="sm"
            foodDetails={{
              proteinContent: item.proteinContent,
              carbohydrateContent: item.carbohydrateContent,
              fatContent: item.fatContent,
              caloriesPerServing: item.caloriesPerServing,
              servingSize: item.servingSize,
              category: item.category,
              name: item.name
            }}
          />
        </div>
        <div className="mt-2 space-y-1">
          <p className="nh-text font-medium">Per {item.servingSize}g serving:</p>
          <p className="nh-text text-sm ml-2">Calories: {item.caloriesPerServing} kcal</p>
          <p className="nh-text font-medium mt-2">Per 100g:</p>
          <p className="nh-text text-sm ml-2">Calories: {((item.caloriesPerServing / item.servingSize) * 100).toFixed(1)} kcal</p>
        </div>
        <p className="nh-text mt-2">Dietary Tags: {item.dietaryOptions.join(', ')}</p>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
    { key: 'nutritionscore', label: 'By Nutrition Score' },
    { key: 'carbohydratecontent', label: 'By Carb Content' },
    { key: 'proteincontent', label: 'By Protein Content' },
    { key: 'fatcontent', label: 'By Fat Content' },
    { key: '', label: 'Remove Sort' }
];

const Foods = () => {
    const [foods, setFoods] = useState<Food[]>([])
    const [fetchSuccess, setFetchSuccess] = useState(false)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [shouldFetch, setShouldFetch] = useState(true);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [warning, setWarning] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const fetchFoods = async (pageNum = 1, search = '', sortByParam = sortBy, sortOrderParam = sortOrder) => {
        setLoading(true);
        try {
            const params: any = { 
                page: pageNum, 
                search,
                ...(sortByParam && { sort_by: sortByParam, order: sortOrderParam })
            };
            console.log("API request params:", params);
            const response = await apiClient.getFoods(params);

            if (response.status == 200){
                setFoods(response.results);
                setCount(response.count || 0);
                setNext(response.next || null);
                setPrevious(response.previous || null);
                setFetchSuccess(true);
                setWarning(null);
                console.log("Fetched foods:", response);
            }
            else if (response.status == 206){ // partial content, some categories are not found
                setFoods(response.results);
                setCount(response.count || 0);
                setNext(response.next || null);
                setPrevious(response.previous || null);
                setFetchSuccess(true);
                setWarning(response.warning || "Some categories are not available.");
            }
            else if (response.status == 204){ // No content, searched terms are not found
                setFoods([]);
                setFetchSuccess(true);
                setWarning(response.warning || `No foods found for "${searchTerm}".`);
            }
        } catch (error) {
            console.error('Error fetching foods:', error);
            setFetchSuccess(false);
            setWarning(null);
        } finally {
            setLoading(false);
        }
    }

    // Initial load on component mount
    useEffect(() => {
        fetchFoods(1, '');
    }, []);

    // Refetch when shouldFetch flag is set (for pagination and search)
    useEffect(() => {
        if (shouldFetch) {
            fetchFoods(page, searchTerm);
            setShouldFetch(false);
        }
    }, [shouldFetch]);

    // Refetch when sort options change (but not on initial mount)
    useEffect(() => {
        // Skip if this is initial render (sortBy will be empty string on mount)
        if (sortBy !== undefined && sortBy !== '') {
            console.log("Sort changed, fetching with:", { sortBy, sortOrder, page, searchTerm });
            fetchFoods(page, searchTerm);
        }
    }, [sortBy, sortOrder]);

    const pageSize = foods.length
    const totalPages = count && pageSize ? Math.ceil(count / pageSize) : 1;


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setLoading(true); // Show skeleton immediately when searching
        setShouldFetch(true);
    };

    const handleSortChange = (key: string) => {
        console.log("Sort button clicked with key:", key);
        let newSortBy = sortBy;
        let newSortOrder = sortOrder;
        
        if (key === '') {
            newSortBy = '';
            newSortOrder = 'desc';
        } else {
            if (sortBy === key) {
                console.log("Toggling sort order from", sortOrder, "to", sortOrder === 'desc' ? 'asc' : 'desc');
                newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
            } else {
                console.log("Setting new sort by:", key);
                newSortBy = key;
                newSortOrder = 'desc';
            }
        }
        
        // Update state
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setPage(1);
        setLoading(true); // Show skeleton immediately when sorting changes
        
        // Fetch with the new sorting parameters directly
        console.log("Immediately fetching with new sort:", { newSortBy, newSortOrder });
        
        // Use empty search to show all foods with the new sort
        setSearchTerm('');
        fetchFoods(1, '', newSortBy, newSortOrder);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setPage(1);
        setLoading(true); // Show skeleton immediately when clearing search
        setShouldFetch(true);
    };

    // Add handlePageChange function for pagination
    const handlePageChange = (page: number) => {
        setPage(page);
        setLoading(true); // Show skeleton immediately when page changes
        setShouldFetch(true);
        // Scroll to top when changing page
        window.scrollTo(0, 0);
    };

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Filters */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20">
                            <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                                <Funnel size={20} weight="fill" className="text-primary" />
                                Sort Options
                            </h3>
                            
                            {/* Current sort indicator */}
                            {sortBy && (
                                <div className="mb-4 px-4 py-2 bg-primary bg-opacity-10 rounded-lg">
                                    <p className="text-sm font-medium">
                                        Sorting: {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label || 'Custom'}
                                        <span className="ml-1 font-bold">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    </p>
                                </div>
                            )}
                            
                            <div className="flex flex-col gap-3">
                                {/* Sort buttons */}
                                {SORT_OPTIONS.map(option => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow`}
                                        style={{
                                            backgroundColor: sortBy === option.key 
                                                ? 'var(--forum-default-active-bg)' 
                                                : 'var(--forum-default-bg)',
                                            color: sortBy === option.key 
                                                ? 'var(--forum-default-active-text)' 
                                                : 'var(--forum-default-text)',
                                        }}
                                        onClick={() => handleSortChange(option.key)}
                                    >
                                        <span className="flex-grow text-center">
                                            {option.label}
                                            {option.key !== '' && sortBy === option.key && (
                                                <span className="ml-1 font-bold text-lg">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle column - Food items */}
                    <div className="w-full md:w-3/5">
                        {/* Search bar */}
                        <div className="mb-6">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <MagnifyingGlass size={20} style={{ color: 'var(--forum-search-icon)' }} />
                                    </div>
                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-2 pl-10 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search"
                                        placeholder="Search for a food..."
                                        aria-label="Search foods"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        >
                                            <X size={20} style={{ color: 'var(--forum-search-icon)' }} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-5 py-3 nh-button nh-button-primary rounded-lg flex items-center"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        {warning && (
                            <div className="mb-6 text-center text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-3">
                                {warning}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(6)].map((_, index) => (
                                    <div
                                        key={index}
                                        className="nh-card p-4 w-full max-w-xs mx-auto flex flex-col animate-pulse"
                                    >
                                        <div 
                                            className="h-60 w-full mb-4 rounded"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-6 w-3/4 rounded mb-4"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-4 w-full rounded mb-2"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-4 w-2/3 rounded mb-2"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-4 w-full rounded mb-2"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-4 w-4/5 rounded mb-2"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                        <div 
                                            className="h-4 w-3/4 rounded"
                                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        ) : fetchSuccess ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {foods.length > 0 ?
                                        (foods.map(food => (
                                            <FoodItem 
                                                key={food.id} 
                                                item={food} 
                                                onClick={() => setSelectedFood(food)}
                                            />
                                        ))) : 
                                        <p className="text-center nh-text col-span-full">No foods found. Try adjusting your search.</p>
                                    }
                                </div>
                                
                                {/* Updated pagination styling */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-10 gap-2">
                                        <button 
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            disabled={!previous || page <= 1}
                                            className="flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer"
                                            style={{
                                                color: (!previous || page <= 1) ? 'var(--pagination-disabled-text)' : 'var(--color-primary)',
                                                cursor: (!previous || page <= 1) ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (previous && page > 1) {
                                                    e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (previous && page > 1) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            <CaretLeft size={20} weight="bold" />
                                        </button>
                                        
                                        {totalPages <= 5 ? (
                                            // Show all pages if 5 or fewer
                                            [...Array(totalPages)].map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                                    style={{
                                                        backgroundColor: page === index + 1 ? 'var(--color-primary)' : 'transparent',
                                                        color: page === index + 1 ? 'white' : 'var(--pagination-inactive-text)',
                                                        boxShadow: page === index + 1 ? 'var(--shadow-sm)' : 'none',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (page !== index + 1) {
                                                            e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (page !== index + 1) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))
                                        ) : (
                                            // Show limited range of pages
                                            <>
                                                {/* First page */}
                                                <button
                                                    onClick={() => handlePageChange(1)}
                                                    className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                                    style={{
                                                        backgroundColor: page === 1 ? 'var(--color-primary)' : 'transparent',
                                                        color: page === 1 ? 'white' : 'var(--pagination-inactive-text)',
                                                        boxShadow: page === 1 ? 'var(--shadow-sm)' : 'none',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (page !== 1) {
                                                            e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (page !== 1) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    1
                                                </button>
                                                
                                                {/* Ellipsis for many pages */}
                                                {page > 3 && <span className="mx-1" style={{ color: 'var(--pagination-ellipsis-text)' }}>...</span>}
                                                
                                                {/* Pages around current page */}
                                                {Array.from(
                                                    { length: Math.min(3, totalPages - 2) },
                                                    (_, i) => {
                                                        let pageNum;
                                                        if (page <= 2) {
                                                            pageNum = i + 2; // Show 2, 3, 4
                                                        } else if (page >= totalPages - 1) {
                                                            pageNum = totalPages - 3 + i; // Show last 3 pages before the last
                                                        } else {
                                                            pageNum = page - 1 + i; // Show around current
                                                        }
                                                        
                                                        if (pageNum <= 1 || pageNum >= totalPages) return null;
                                                        
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => handlePageChange(pageNum)}
                                                                className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                                                style={{
                                                                    backgroundColor: page === pageNum ? 'var(--color-primary)' : 'transparent',
                                                                    color: page === pageNum ? 'white' : 'var(--pagination-inactive-text)',
                                                                    boxShadow: page === pageNum ? 'var(--shadow-sm)' : 'none',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (page !== pageNum) {
                                                                        e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (page !== pageNum) {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }
                                                                }}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    }
                                                )}

                                                {/* Ellipsis for many pages */}
                                                {page < totalPages - 2 && <span className="mx-1" style={{ color: 'var(--pagination-ellipsis-text)' }}>...</span>}

                                                {/* Last page */}
                                                <button
                                                    onClick={() => handlePageChange(totalPages)}
                                                    className="w-10 h-10 rounded-full transition-all cursor-pointer"
                                                    style={{
                                                        backgroundColor: page === totalPages ? 'var(--color-primary)' : 'transparent',
                                                        color: page === totalPages ? 'white' : 'var(--pagination-inactive-text)',
                                                        boxShadow: page === totalPages ? 'var(--shadow-sm)' : 'none',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (page !== totalPages) {
                                                            e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (page !== totalPages) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                            disabled={!next || page >= totalPages}
                                            className="flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer"
                                            style={{
                                                color: (!next || page >= totalPages) ? 'var(--pagination-disabled-text)' : 'var(--color-primary)',
                                                cursor: (!next || page >= totalPages) ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (next && page < totalPages) {
                                                    e.currentTarget.style.backgroundColor = 'var(--pagination-inactive-hover-bg)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (next && page < totalPages) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            <CaretRight size={20} weight="bold" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="col-span-full text-center nh-text">Error fetching foods. Please try again later.</p>
                        )}
                    </div>
                    
                    {/* Right column - Actions */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20 flex flex-col gap-4">
                            <Link to="/foods/propose" className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium">
                                <div className="flex items-center justify-center w-full">
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Food
                                </div>
                            </Link>

                            <Link to="/foods/compare" className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium">
                                <div className="flex items-center justify-center w-full">
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Compare Foods
                                </div>
                            </Link>

                            <div className="nh-card rounded-lg shadow-md">
                                <h3 className="nh-subtitle mb-3 text-sm">Food Facts</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Nutrition score indicates overall health value</li>
                                    <li>• Categories help you find similar foods</li>
                                    <li>• Dietary tags show diet compatibility</li>
                                    <li>• Click on a food to see full details</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <FoodDetail 
                    food={selectedFood}
                    open={!!selectedFood}
                    onClose={() => setSelectedFood(null)}
                />
            </div>
        </div>
    )
}

export default Foods