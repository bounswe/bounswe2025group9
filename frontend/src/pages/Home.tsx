import { Link } from 'react-router-dom'
import { Calculator, CookingPot, HeartHalf } from '@phosphor-icons/react'
import { useLanguage } from '../context/LanguageContext'

// home page component
const Home = () => {
    const { t } = useLanguage()
    
    return (
        <div className="w-full py-16">
            <div className="nh-container">
                <div className="text-center mb-16">
                    <h1 className="nh-title-lg">{t('home.welcomeToNutriHub')}</h1>
                    <p className="nh-text text-xl max-w-3xl mx-auto">
                        {t('home.welcomeDescription')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row justify-center gap-8 mt-12">
                    <Link to="/foods" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        {t('home.exploreFoods')}
                    </Link>
                    <Link to="/forum" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        {t('home.joinForum')}
                    </Link>
                    <Link to="/mealplanner" className="nh-button nh-button-lg nh-button-primary flex items-center justify-center">
                        {t('home.createMealPlan')}
                    </Link>
                </div>

                <div className="nh-grid mt-24">
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <Calculator size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">{t('home.trackNutrition')}</h3>
                        </div>
                        <p className="nh-text">
                            {t('home.trackNutritionDesc')}
                        </p>
                    </div>
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <CookingPot size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">{t('home.shareRecipes')}</h3>
                        </div>
                        <p className="nh-text">
                            {t('home.shareRecipesDesc')}
                        </p>
                    </div>
                    <div className="nh-card">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center mr-3">
                                <HeartHalf size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="nh-subtitle">{t('home.getSupport')}</h3>
                        </div>
                        <p className="nh-text">
                            {t('home.getSupportDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
