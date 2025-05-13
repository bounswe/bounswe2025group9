import { Hamburger} from '@phosphor-icons/react'
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

const Foods = () => {
    const [foods, setFoods] = useState<Food[]>([])
    const [fetchSuccess, setFetchSuccess] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [shouldFetch, setShouldFetch] = useState(true);
    const [lastSearchedTerm, setLastSearchedTerm] = useState('');
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [warning, setWarning] = useState<string | null>(null);

    const fetchFoods = async (pageNum = 1, search = '') => {
        try {
            const response = await apiClient.getFoods({ page: pageNum, search });

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

    const handlePrev = () => {
        if (previous && page > 1) {
            setPage(page - 1);
            setShouldFetch(true);
        }
    };
    
    const handleNext = () => {
        if (next && page < totalPages) {
            setPage(page + 1);
            setShouldFetch(true);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setShouldFetch(true);
        setLastSearchedTerm(searchTerm);
    };

    return (
        <div className="py-12">
            <div className="nh-container">
                <h1 className="nh-title text-center mb-4">Foods Catalog</h1>
                <p className="nh-text text-center mb-12">
                    Browse our selection of available foods.
                </p>

                <form className="flex flex-col sm:flex-row gap-4 mb-8" onSubmit={handleSearch}>
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            className="w-full nh-input pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Search for a food..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                // No automatic search on change anymore
                            }}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="nh-button-primary px-6 py-2.5 whitespace-nowrap"
                        >
                            Search 
                        </button> 
                        <Link to="/foods/propose" className="nh-button-secondary px-6 py-2.5 whitespace-nowrap"> Add Food</Link>
                    </div>
                </form>
                {warning && (
                    <div className="mb-6 text-center text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-3">
                        {warning} {searchTerm && <span>(searched: <b>{searchTerm}</b>)</span>}
                    </div>
                )}
                {fetchSuccess ? (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {foods.length > 0 ?
                            (foods.map(food => (
                                <FoodItem 
                                    key={food.id} 
                                    item={food} 
                                    onClick={() => setSelectedFood(food)}
                                />
                            ))) : 
                            <p className="col-span-full text-center nh-text">
                                No foods found matching your search: <b>{lastSearchedTerm}</b>
                            </p>
                        }
                        </div>
                        <div className="flex justify-center mt-8 gap-4">
                            <button 
                                className="nh-button-secondary px-4 py-2"
                                onClick={handlePrev}
                                disabled={!previous || page <= 1}
                            >
                                Previous
                            </button>
                            <span className="nh-text flex items-center">
                                Page {page} of {totalPages}
                            </span>
                            <button 
                                className="nh-button-secondary px-4 py-2"
                                onClick={handleNext}
                                disabled={!next || page >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                        </>
                    ) : (
                        <p className="col-span-full text-center nh-text">Error fetching foods. Please try again later.</p>
                )}

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