import { Link } from 'react-router-dom'
import { Calculator, CookingPot, HeartHalf } from '@phosphor-icons/react'

// home page component
const Home = () => {
    return (
        <div className="w-full py-16">
            <div className="nh-container">
                <div className="text-center mb-16">
                    <h1 className="nh-title-lg">Welcome to NutriHub</h1>
                    <p className="nh-text text-xl max-w-3xl mx-auto">
                        Your complete nutrition platform for discovering healthy foods,
                        sharing recipes, and joining a community of health enthusiasts.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row justify-center gap-8 mt-12">
                    <Link to="/foods" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        Explore Foods
                    </Link>
                    <Link to="/forum" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        Join Forum
                    </Link>
                    <Link to="/mealplanner" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        Create a Meal Plan
                    </Link>
                </div>

                <div className="nh-grid mt-24">
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <Calculator size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">Track Nutrition</h3>
                        </div>
                        <p className="nh-text">
                            Access detailed nutritional information for thousands of foods.
                        </p>
                    </div>
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <CookingPot size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">Share Recipes</h3>
                        </div>
                        <p className="nh-text">
                            Discover and share healthy recipes with the community.
                        </p>
                    </div>
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <HeartHalf size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">Get Support</h3>
                        </div>
                        <p className="nh-text">
                            Connect with others on your journey to better nutrition.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home