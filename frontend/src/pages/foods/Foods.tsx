import { Hamburger, Funnel, MagnifyingGlass, X, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { apiClient , Food} from '../../lib/apiClient';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FoodDetail from './FoodDetail';

const FoodItem = ({ item, onClick }: { item: Food, onClick: () => void }) => {
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
        <p className="nh-text">Nutrition Score: {item.nutritionScore}</p>
        <p className="nh-text">Calories: {item.caloriesPerServing} kcal per {item.servingSize}</p>
        <p className="nh-text">Dietary Tags: {item.dietaryOptions.join(', ')}</p>
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
    const [fetchSuccess, setFetchSuccess] = useState(true)
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

    const fetchFoods = async (pageNum = 1, search = '') => {
        try {
            const params: any = { page: pageNum, search };
            if (sortBy) {
                params.sort_by = sortBy;
                params.order = sortOrder;
            }
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
        }
    }

    useEffect(() => {
        if (shouldFetch) {
            fetchFoods(page, searchTerm);
            setShouldFetch(false);
        }
    }, [page, shouldFetch, searchTerm]);

    // Initial load on component mount
    useEffect(() => {
        fetchFoods(1, '');
    }, []);

    const pageSize = foods.length
    const totalPages = count && pageSize ? Math.ceil(count / pageSize) : 1;


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setShouldFetch(true);
    };

    const handleSortChange = (key: string) => {
        if (key === '') {
            setSortBy('');
            setSortOrder('desc');
        } else {
            if (sortBy === key) {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            } else {
                setSortBy(key);
                setSortOrder('desc');
            }
        }
        setPage(1);
        setShouldFetch(true);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setPage(1);
        setShouldFetch(true);
    };

    // Add handlePageChange function for pagination
    const handlePageChange = (page: number) => {
        setPage(page);
        setShouldFetch(true);
        // Scroll to top when changing page
        window.scrollTo(0, 0);
    };

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="mb-8 flex flex-col items-center">
                    <h1 className="nh-title text-center">Foods Catalog</h1>
                    <p className="nh-text text-lg max-w-2xl text-center">
                        Browse our selection of available foods.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Filters */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20">
                            <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                                <Funnel size={20} weight="fill" className="text-primary" />
                                Sort Options
                            </h3>
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
                                                <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
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

                        {fetchSuccess ? (
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
                                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${!previous || page <= 1 ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
                                        >
                                            <CaretLeft size={20} weight="bold" />
                                        </button>
                                        
                                        {totalPages <= 5 ? (
                                            // Show all pages if 5 or fewer
                                            [...Array(totalPages)].map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    className={`w-10 h-10 rounded-full transition-all ${
                                                        page === index + 1 
                                                        ? 'bg-primary text-white shadow' 
                                                        : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                                    }`}
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
                                                    className={`w-10 h-10 rounded-full transition-all ${
                                                        page === 1 
                                                        ? 'bg-primary text-white shadow' 
                                                        : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                                    }`}
                                                >
                                                    1
                                                </button>
                                                
                                                {/* Ellipsis for many pages */}
                                                {page > 3 && <span className="mx-1">...</span>}
                                                
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
                                                                className={`w-10 h-10 rounded-full transition-all ${
                                                                    page === pageNum
                                                                    ? 'bg-primary text-white shadow'
                                                                    : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                                                }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    }
                                                )}

                                                {/* Ellipsis for many pages */}
                                                {page < totalPages - 2 && <span className="mx-1">...</span>}

                                                {/* Last page */}
                                                <button
                                                    onClick={() => handlePageChange(totalPages)}
                                                    className={`w-10 h-10 rounded-full transition-all ${
                                                        page === totalPages
                                                        ? 'bg-primary text-white shadow'
                                                        : 'text-gray-400 hover:bg-gray-800 hover:shadow'
                                                    }`}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                            disabled={!next || page >= totalPages}
                                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${!next || page >= totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-gray-800 hover:shadow'}`}
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