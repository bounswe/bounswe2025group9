import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import ForumPostCard from '../components/ForumPostCard'
import { subscribeLikeChanges, notifyLikeChange } from '../lib/likeNotifications'
import { Lock, User, Heart, BookOpen, Certificate, Warning, Plus, X, BookmarkSimple, Hamburger, CaretDown, CaretRight, Trash, CalendarBlank, PencilSimple, ForkKnife } from '@phosphor-icons/react'
import { apiClient, Food, FoodProposalStatus, ForumPost, MealPlan } from '../lib/apiClient'
import { UserMetrics } from '../types/nutrition'
import NutritionSummary from '../components/NutritionSummary'
import MealPlanner from './mealplanner/MealPlanner'
import MealPlannerSidebar from '../components/MealPlannerSidebar'
import { FoodItem } from './foods/Foods'
import PrivateFoodDetail from './foods/PrivateFoodDetail'

// Predefined allergen list
const PREDEFINED_ALLERGENS = [
  'Gluten',
  'Lactose',
  'Peanuts',
  'Soy',
  'Shellfish',
  'Eggs',
  'Tree Nuts',
  'Sesame',
  'Fish',
  'Sulfites',
  'Artificial Colorants',
  'Preservatives'
]

// Predefined profession tags
const PROFESSION_TAGS = [
  'Dietitian',
  'Nutritionist',
  'Chef',
  'Food Scientist',
  'Health Coach'
]

interface AllergenData {
  id?: number
  name: string
  isCustom?: boolean
}

interface ProfessionTag {
  id?: number
  name: string
  verified: boolean
  certificateUrl?: string
}

interface ReportOption {
  value: string
  label: string
}

const REPORT_OPTIONS: ReportOption[] = [
  { value: 'invalid_certificate', label: 'Invalid certificate' },
  { value: 'misleading_info', label: 'Misleading information' }
]

const Profile = () => {
  const { user, fetchUserProfile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'allergens' | 'posts' | 'recipes' | 'tags' | 'report' | 'mealPlans' | 'mealPlanner' | 'metrics' | 'foodProposals'| 'privateFoods'>('overview')
  
  // Meal Planner state (for sidebar in profile)
  const [mealPlannerDietaryPreference, setMealPlannerDietaryPreference] = useState('high-protein')
  const [mealPlannerDuration, setMealPlannerDuration] = useState<'weekly' | 'daily'>('weekly')
  const mealPlannerSaveRef = useRef<(() => void) | null>(null)
  const mealPlannerLogRef = useRef<(() => void) | null>(null)
  const [isLoggingMeals, setIsLoggingMeals] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenData[]>([])
  const [customAllergen, setCustomAllergen] = useState('')
  const [likedPosts, setLikedPosts] = useState<ForumPost[]>([])
  const [likedRecipes, setLikedRecipes] = useState<ForumPost[]>([])
  const [foodProposals, setFoodProposals] = useState<FoodProposalStatus[]>([])
  const [privateFoods, setPrivateFoods] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [likedPostsMap, setLikedPostsMap] = useState<{ [key: number]: boolean }>({})
  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([])
  const [selectedProfession, setSelectedProfession] = useState('')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Followers and following counts
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  // Report user states
  const [reportUserId, setReportUserId] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  // States for saved meal plans
  const [allMealPlans, setAllMealPlans] = useState<MealPlan[]>([])
  const [expandedMealPlans, setExpandedMealPlans] = useState<Set<number>>(new Set())
  const [editingMealPlanId, setEditingMealPlanId] = useState<number | null>(null)
  const [editedMealPlanName, setEditedMealPlanName] = useState('')
  const [isLoggingMealPlan, setIsLoggingMealPlan] = useState(false)
  const [loggingMealPlanId, setLoggingMealPlanId] = useState<number | null>(null)

  // Metrics state
  const [metrics, setMetrics] = useState<UserMetrics>({
    height: 170,
    weight: 70,
    age: 30,
    gender: 'M',
    activity_level: 'moderate'
  })
  const [originalMetrics, setOriginalMetrics] = useState<UserMetrics>({
    height: 170,
    weight: 70,
    age: 30,
    gender: 'M',
    activity_level: 'moderate'
  })
  const [hasMetrics, setHasMetrics] = useState(false)
  const [metricsUpdateKey, setMetricsUpdateKey] = useState(0) // Key to force NutritionTracking refresh

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [user])

  // Function to handle tab change
  const handleTabChange = (tab: 'overview' | 'allergens' | 'posts' | 'recipes' | 'tags' | 'report' | 'mealPlans' | 'mealPlanner' | 'metrics'| 'foodProposals' | 'privateFoods') => {
    setActiveTab(tab)
  }

  // Note: Nutrition tracking is now on a separate page (/nutrition)

  // Set up cross-tab like listener
  useEffect(() => {
    const unsubscribe = subscribeLikeChanges((event) => {
      console.log('[Profile] Received like change notification from another tab:', event)

      // Refetch liked posts and recipes when a like event occurs
      if (event.type === 'post') {
        loadLikedPosts()
        loadLikedRecipes()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadUserData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load metrics first (needed for nutrition tracking)
      await loadUserMetrics()
      
      // Load allergens
      if (user.allergens && user.allergens.length > 0) {
        setSelectedAllergens(user.allergens.map((a: any) => ({
          id: a.id,
          name: a.name,
          isCustom: !PREDEFINED_ALLERGENS.includes(a.name)
        })))
      }

      // Load profession tags
      if (user.tags && user.tags.length > 0) {
        setProfessionTags(user.tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          verified: t.verified || false,
          certificateUrl: t.certificate_url
        })))
      }

      // Load liked posts
      await loadLikedPosts()

      // Load liked recipes
      await loadLikedRecipes()

      await loadFoodProposals()
      await loadPrivateFoods()

      // Load profile picture if available
      if (user.profile_image) {
        setProfilePicture(user.profile_image)
      }

      // Load followers and following counts
      if (user.username) {
        try {
          const [followersData, followingData] = await Promise.all([
            apiClient.getFollowers(user.username),
            apiClient.getFollowing(user.username)
          ])
          
          // The API returns an array directly, not an object with followers property
          const followers = Array.isArray(followersData) ? followersData : (followersData.followers || [])
          const following = Array.isArray(followingData) ? followingData : (followingData.following || [])
          
          setFollowersCount(followers.length)
          setFollowingCount(following.length)
        } catch (err) {
          console.error('Error loading follow data:', err)
          // Don't show error, just set to 0
          setFollowersCount(0)
          setFollowingCount(0)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      showError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadLikedPosts = async () => {
    try {
      // Get liked post IDs from the API
      const likedResponse = await apiClient.getLikedPosts()
      const likedPostIds = (likedResponse.results || []).map(post => post.id)

      console.log('[Profile] Liked post IDs:', likedPostIds)

      if (likedPostIds.length === 0) {
        setLikedPosts([])
        setLikedPostsMap({})
        return
      }

      // Fetch all posts to get complete data including like counts
      const allPostsResponse = await apiClient.getForumPosts({
        ordering: '-created_at',
        page: 1,
        page_size: 500
      })

      console.log('[Profile] All posts fetched:', allPostsResponse.results.length)

      // Filter to only liked posts
      const likedPostsWithData = allPostsResponse.results.filter(post =>
        likedPostIds.includes(post.id)
      )

      console.log('[Profile] Liked posts with data:', likedPostsWithData)
      console.log('[Profile] First liked post like count:', likedPostsWithData[0]?.likes)

      setLikedPosts(likedPostsWithData)

      // Build a map of liked posts for easy lookup
      const likedMap: { [key: number]: boolean } = {}
      likedPostsWithData.forEach(post => {
        likedMap[post.id] = true
      })
      setLikedPostsMap(likedMap)
    } catch (error) {
      console.error('Error loading liked posts:', error)
      setLikedPosts([])
      setLikedPostsMap({})
    }
  }

  const loadLikedRecipes = async () => {
    try {
      // Get liked post IDs from the API
      const likedResponse = await apiClient.getLikedPosts()
      const likedPostIds = (likedResponse.results || []).map(post => post.id)

      console.log('[Profile] Liked post IDs for recipes:', likedPostIds)

      if (likedPostIds.length === 0) {
        setLikedRecipes([])
        return
      }

      // Fetch all posts to get complete data including like counts
      const allPostsResponse = await apiClient.getForumPosts({
        ordering: '-created_at',
        page: 1,
        page_size: 500
      })

      // Filter to only liked posts with Recipe tag
      const recipePosts = allPostsResponse.results.filter(post =>
        likedPostIds.includes(post.id) &&
        post.tags.some(tag => tag.name === 'Recipe')
      )

      console.log('[Profile] Liked recipe posts with data:', recipePosts)
      console.log('[Profile] First recipe like count:', recipePosts[0]?.likes)

      // Store as posts since we're using ForumPostCard to render them
      setLikedRecipes(recipePosts)
    } catch (error) {
      console.error('Error loading liked recipes:', error)
      setLikedRecipes([])
    }
  }

  const loadFoodProposals = async () => {
    try {
      const response = await apiClient.getFoodProposals()
      setFoodProposals(response || [])
    } 
    catch (error) {
      console.error('Error loading food proposals:', error)
      setFoodProposals([])
    } 
  }

  const loadPrivateFoods = async () => {
    try {
      const response = await apiClient.getPrivateFoods()
      setPrivateFoods(response || [])
    } 
    catch (error) {
      console.error('Error loading private foods:', error)
      setPrivateFoods([])
    } 
  }

  // Handle like toggle for posts
  const handleLikeToggle = async (postId: number) => {
    try {
      console.log(`[Profile] Toggling like for post ID: ${postId}`)

      const currentLiked = likedPostsMap[postId] || false
      const newLiked = !currentLiked
      const likeDelta = newLiked ? 1 : -1

      // Find the post in either likedPosts or likedRecipes
      const currentPost = likedPosts.find(p => p.id === postId) || likedRecipes.find(r => r.id === postId)

      if (!currentPost) {
        console.error('[Profile] Post not found in liked posts or recipes')
        return
      }

      const currentLikeCount = Math.max(0, currentPost.likes || 0)
      const optimisticLikeCount = Math.max(0, currentLikeCount + likeDelta)

      // Optimistically update the UI
      setLikedPostsMap(prev => ({ ...prev, [postId]: newLiked }))

      // Update the like count in both likedPosts and likedRecipes
      setLikedPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, liked: newLiked, likes: optimisticLikeCount }
          : post
      ))

      setLikedRecipes(prev => prev.map(recipe =>
        recipe.id === postId
          ? { ...recipe, liked: newLiked, likes: optimisticLikeCount }
          : recipe
      ))

      // Call the API
      const response = await apiClient.toggleLikePost(postId)
      console.log(`[Profile] Toggle like API response:`, response)

      // Get actual like count from server response
      const responseObj = response as any
      const serverLiked = responseObj.liked
      const serverLikeCount = responseObj.like_count

      // ALWAYS use server values as the source of truth
      const finalLiked = serverLiked !== undefined ? serverLiked : newLiked
      const finalLikeCount = serverLikeCount !== undefined ? serverLikeCount : optimisticLikeCount

      console.log(`[Profile] Server response - liked: ${finalLiked}, count: ${finalLikeCount}`)

      // Notify other tabs with ACTUAL server values
      notifyLikeChange(postId, finalLiked, finalLikeCount, 'post')

      // Update with final values from server
      setLikedPostsMap(prev => ({ ...prev, [postId]: finalLiked }))

      setLikedPosts(prev => {
        if (!finalLiked) {
          // Remove from liked posts if unliked
          return prev.filter(post => post.id !== postId)
        }
        return prev.map(post =>
          post.id === postId
            ? { ...post, liked: finalLiked, likes: finalLikeCount }
            : post
        )
      })

      setLikedRecipes(prev => {
        if (!finalLiked) {
          // Remove from liked recipes if unliked
          return prev.filter(recipe => recipe.id !== postId)
        }
        return prev.map(recipe =>
          recipe.id === postId
            ? { ...recipe, liked: finalLiked, likes: finalLikeCount }
            : recipe
        )
      })

    } catch (error) {
      console.error('[Profile] Error toggling post like:', error)
      // Revert on error by refetching
      await loadLikedPosts()
      await loadLikedRecipes()
    }
  }

  // Load all meal plans for user
  const loadAllMealPlans = async () => {
    try {
      const response = await apiClient.getMealPlans()
      // Store all meal plans
      if (response.results && response.results.length > 0) {
        setAllMealPlans(response.results)
      }
    } catch (error) {
      console.error('Error loading meal plans:', error)
      setAllMealPlans([])
    }
  }

  // Toggle expand/collapse meal plan
  const toggleMealPlan = (planId: number) => {
    const newExpanded = new Set(expandedMealPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedMealPlans(newExpanded)
  }

  // Handle delete meal plan
  const handleDeleteMealPlan = async (planId: number, planName: string) => {
    if (window.confirm(`Are you sure you want to delete "${planName}"?`)) {
      try {
        await apiClient.deleteMealPlan(planId)
        // Remove from expanded set if it was expanded
        const newExpanded = new Set(expandedMealPlans)
        newExpanded.delete(planId)
        setExpandedMealPlans(newExpanded)
        await loadAllMealPlans() // Reload meal plans
      } catch (error) {
        console.error('Error deleting meal plan:', error)
        alert('Failed to delete meal plan. Please try again.')
      }
    }
  }

  // Handle save edited meal plan name
  const handleSaveMealPlanName = async () => {
    if (!editingMealPlanId || !editedMealPlanName.trim()) return
    
    try {
      await apiClient.updateMealPlan(editingMealPlanId, {
        name: editedMealPlanName.trim()
      })
      setEditingMealPlanId(null)
      await loadAllMealPlans() // Reload to get updated list
    } catch (error) {
      console.error('Error updating meal plan:', error)
      alert('Failed to update meal plan name. Please try again.')
    }
  }

  // Handle log meal plan to nutrition tracking
  const handleLogMealPlan = async (planId: number) => {
    setLoggingMealPlanId(planId)
    setIsLoggingMealPlan(true)
    try {
      await apiClient.logMealPlanToNutrition(planId)
      alert('Meal plan successfully logged to Nutrition Tracking!')
    } catch (error) {
      console.error('Error logging meal plan:', error)
      alert('Failed to log meal plan to Nutrition Tracking. Please try again.')
    } finally {
      setIsLoggingMealPlan(false)
      setLoggingMealPlanId(null)
    }
  }

  // Render meal plan details
  const renderMealPlanDetails = (mealPlan: MealPlan) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mealTypesOrder = ["breakfast", "lunch", "dinner"];
    const details = mealPlan.meals_details || [];
    
    // Meals are stored sequentially: Monday (breakfast, lunch, dinner), Tuesday (breakfast, lunch, dinner), etc.
    // 3 meals per day, so we organize by day index
    return days.map((day) => {
      const dayIndex = days.indexOf(day);
      const startIndex = dayIndex * 3; // Start index for this day's meals
      const endIndex = startIndex + 3; // End index for this day's meals
      
      // Get meals for this day
      const dayMealsArray = details.slice(startIndex, endIndex);
      
      // Organize meals by meal_type (breakfast, lunch, dinner)
      // Create a map of meal_type -> meal
      const mealsByType: { [key: string]: any } = {};
      dayMealsArray.forEach((meal: any) => {
        if (meal && meal.meal_type) {
          const mealTypeLower = meal.meal_type.toLowerCase();
          mealsByType[mealTypeLower] = meal;
        }
      });
      
      // If meals don't have meal_type, assign based on position
      if (Object.keys(mealsByType).length === 0) {
        dayMealsArray.forEach((meal: any, i: number) => {
          if (meal && i < mealTypesOrder.length) {
            mealsByType[mealTypesOrder[i]] = meal;
          }
        });
      }
      
      // Get meals in order: breakfast, lunch, dinner
      const orderedMeals = mealTypesOrder.map(mealType => mealsByType[mealType] || null).filter(Boolean);
      
      // Calculate daily macros from meals_details
      let dayCalories = 0;
      let dayProtein = 0;
      let dayCarbs = 0;
      let dayFat = 0;
      
      dayMealsArray.forEach((meal: any) => {
        if (meal && meal.calculated_nutrition) {
          dayCalories += meal.calculated_nutrition.calories || 0;
          dayProtein += meal.calculated_nutrition.protein || 0;
          dayCarbs += meal.calculated_nutrition.carbohydrates || 0;
          dayFat += meal.calculated_nutrition.fat || 0;
        }
      });
      
      return (
        <div key={day} className="nh-card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="nh-subtitle mb-0">{day}</h3>
            {/* Daily Macro Values */}
            <div className="flex items-center gap-3 text-xs nh-text opacity-75">
              <span>Calories: <strong className="text-primary">{Math.round(dayCalories)}</strong></span>
              <span>Protein: <strong className="text-primary">{Math.round(dayProtein)}g</strong></span>
              <span>Carbs: <strong className="text-primary">{Math.round(dayCarbs)}g</strong></span>
              <span>Fat: <strong className="text-primary">{Math.round(dayFat)}g</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orderedMeals.length > 0 ? (
              mealTypesOrder.map((mealType) => {
                const meal = mealsByType[mealType];
                if (!meal) {
                  return (
                    <div 
                      key={`${day}-${mealType}-empty`} 
                      className="rounded-md p-3 border relative transition-all hover:shadow-sm flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--dietary-option-bg)',
                        borderColor: 'var(--dietary-option-border)',
                        minHeight: '150px'
                      }}
                    >
                      <span className="text-xs nh-text opacity-50">No {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</span>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={`${day}-${mealType}`}
                    className="rounded-md p-3 border relative transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: 'var(--dietary-option-bg)',
                      borderColor: 'var(--dietary-option-border)'
                    }}
                  >
                    <div
                      className="text-xs font-medium mb-2"
                      style={{ color: 'var(--color-light)' }}
                    >
                      {meal.meal_type ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1) : mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </div>

                    <div className="food-image-container h-20 w-full flex justify-center items-center mb-2 overflow-hidden rounded">
                      {meal.food && meal.food.imageUrl ? (
                        <img
                          src={meal.food.imageUrl}
                          alt={meal.food.name}
                          className="object-contain max-h-14 max-w-full rounded"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="food-image-placeholder w-full h-full flex items-center justify-center">
                          <Hamburger size={28} weight="fill" className="text-primary opacity-50" />
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-medium nh-text mb-1">
                      {meal.food ? meal.food.name : 'No food selected'}
                    </div>
                    <div className="text-xs nh-text opacity-75">
                      {meal.calculated_nutrition ? `${Math.round(meal.calculated_nutrition.calories)} kcal` : 'N/A'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-4 nh-text opacity-50">
                No meals planned for {day}
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  // Fetch saved meal plans when 'mealPlans' tab is activated
  useEffect(() => {
    if (activeTab === 'mealPlans') {
      loadAllMealPlans()
    }
  }, [activeTab])

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 3000)
  }

  // Allergen management
  const toggleAllergen = (allergenName: string) => {
    setSelectedAllergens(prev => {
      const exists = prev.find(a => a.name === allergenName)
      if (exists) {
        return prev.filter(a => a.name !== allergenName)
      } else {
        return [...prev, { name: allergenName, isCustom: false }]
      }
    })
  }

  const addCustomAllergen = () => {
    if (!customAllergen.trim()) return

    const exists = selectedAllergens.find(a => a.name.toLowerCase() === customAllergen.toLowerCase())
    if (exists) {
      showError('This allergen is already added')
      return
    }

    setSelectedAllergens(prev => [...prev, { name: customAllergen, isCustom: true }])
    setCustomAllergen('')
    showSuccess('Custom allergen added')
  }

  const removeAllergen = (allergenName: string) => {
    setSelectedAllergens(prev => prev.filter(a => a.name !== allergenName))
  }

  const saveAllergens = async () => {
    setIsLoading(true)
    try {
      // Format allergens as expected by backend API
      const allergensPayload = selectedAllergens.map(allergen => {
        if (allergen.id) {
          // Existing allergen - send ID
          return { id: allergen.id }
        } else {
          // New custom allergen - send name
          return { name: allergen.name, common: false }
        }
      })

      await apiClient.updateAllergens(allergensPayload)
      await fetchUserProfile()
      showSuccess('Allergens saved successfully')
    } catch (error) {
      console.error('Error saving allergens:', error)
      showError('Failed to save allergens')
    } finally {
      setIsLoading(false)
    }
  }

  // Profession tag management
  const addProfessionTag = () => {
    if (!selectedProfession) return

    const exists = professionTags.find(t => t.name === selectedProfession)
    if (exists) {
      showError('This profession tag is already added')
      return
    }

    setProfessionTags(prev => [...prev, {
      name: selectedProfession,
      verified: false
    }])
    setSelectedProfession('')
    showSuccess('Profession tag added (Unverified)')
  }

  const uploadCertificate = async (tagId: number) => {
    if (!certificateFile) {
      showError('Please select a certificate file')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('certificate', certificateFile)
      formData.append('tag_id', tagId.toString())

      await apiClient.uploadCertificate(formData)
      await fetchUserProfile()
      setCertificateFile(null)
      showSuccess('Certificate uploaded successfully')
    } catch (error) {
      console.error('Error uploading certificate:', error)
      showError('Failed to upload certificate')
    } finally {
      setIsLoading(false)
    }
  }

  const removeProfessionTag = (tagName: string) => {
    setProfessionTags(prev => prev.filter(t => t.name !== tagName))
  }

  const saveProfessionTags = async () => {
    setIsLoading(true)
    try {
      await apiClient.updateProfessionTags(professionTags)
      await fetchUserProfile()
      showSuccess('Profession tags saved successfully')
    } catch (error) {
      console.error('Error saving profession tags:', error)
      showError('Failed to save profession tags')
    } finally {
      setIsLoading(false)
    }
  }

  // Profile picture management
  const cropImageToSquare = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Determine the size for the square (use the smaller dimension)
          const size = Math.min(img.width, img.height)
          canvas.width = size
          canvas.height = size

          // Calculate the crop position (center crop)
          const sx = (img.width - size) / 2
          const sy = (img.height - size) / 2

          // Draw the cropped image on the canvas
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)

          // Convert canvas to blob and create a new file
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }
            const croppedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(croppedFile)
          }, file.type)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      showError('Only JPEG and PNG images are supported')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB')
      return
    }

    try {
      // Crop the image to square
      const croppedFile = await cropImageToSquare(file)
      setProfilePictureFile(croppedFile)

      const reader = new FileReader()
      reader.onloadend = async () => {
        setProfilePicture(reader.result as string)
        // Auto-upload after preview is set
        await uploadProfilePictureWithFile(croppedFile)
      }
      reader.readAsDataURL(croppedFile)
    } catch (error) {
      console.error('Error cropping image:', error)
      showError('Failed to process image')
    }
  }

  const uploadProfilePictureWithFile = async (file: File) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('profile_image', file)

      await apiClient.uploadProfilePicture(formData)
      await fetchUserProfile()
      setProfilePictureFile(null)
      showSuccess('Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      showError('Failed to upload profile picture')
    } finally {
      setIsLoading(false)
    }
  }


  const removeProfilePicture = async () => {
    setIsLoading(true)
    try {
      await apiClient.removeProfilePicture()
      await fetchUserProfile()
      setProfilePicture(null)
      setProfilePictureFile(null)
      showSuccess('Profile picture removed')
    } catch (error) {
      console.error('Error removing profile picture:', error)
      showError('Failed to remove profile picture')
    } finally {
      setIsLoading(false)
    }
  }

  // Report user
  const submitReport = async () => {
    if (!reportUserId || !reportReason || !reportDescription) {
      showError('Please fill in all report fields')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.reportUser({
        userId: reportUserId,
        reason: reportReason,
        description: reportDescription
      })
      setReportUserId('')
      setReportReason('')
      setReportDescription('')
      showSuccess('Report submitted successfully')
    } catch (error) {
      console.error('Error submitting report:', error)
      showError('Failed to submit report')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserMetrics = async () => {
    try {
      const data = await apiClient.getUserMetrics()
      if (data) {
        setMetrics(data)
        setOriginalMetrics(data)
        setHasMetrics(true)
      } else {
        setHasMetrics(false)
      }
    } catch (error: any) {
      // If getUserMetrics fails, check nutrition targets endpoint
      // If targets exist, metrics must exist (targets are auto-created from metrics)
      try {
        const targets = await apiClient.getNutritionTargets()
        if (targets) {
          // Targets exist, so metrics must exist too
          setHasMetrics(true)
          // Try to load metrics again (might have been a transient error)
          try {
            const metricsData = await apiClient.getUserMetrics()
            if (metricsData) {
              setMetrics(metricsData)
              setOriginalMetrics(metricsData)
            }
          } catch {
            // If still fails, that's okay - we know metrics exist from targets
          }
        } else {
          setHasMetrics(false)
        }
      } catch (targetsError: any) {
        // Check if it's a 404 (no targets/metrics) vs other error
        if (targetsError?.status === 404) {
          setHasMetrics(false)
        } else {
          // Other error - don't change hasMetrics state, might be network issue
          console.error('Error checking nutrition targets:', targetsError)
        }
      }
      // Don't show error here as user might not have metrics yet
    }
  }

  const saveMetrics = async () => {
    setIsLoading(true)
    try {
      const savedMetrics = await apiClient.createUserMetrics(metrics)
      // Immediately update state with saved metrics
      if (savedMetrics) {
        setMetrics(savedMetrics)
        setOriginalMetrics(savedMetrics)
        setHasMetrics(true)
      }
      showSuccess('Metrics saved successfully')
      // Refresh targets after saving metrics
      await loadUserMetrics()
      // Force NutritionTracking and NutritionSummary to refresh by updating the key
      // This ensures today's nutrition values are updated immediately with new targets
      setMetricsUpdateKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving metrics:', error)
      showError('Failed to save metrics')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if metrics have changed
  const metricsChanged = () => {
    return metrics.height !== originalMetrics.height ||
      metrics.weight !== originalMetrics.weight ||
      metrics.age !== originalMetrics.age ||
      metrics.gender !== originalMetrics.gender ||
      metrics.activity_level !== originalMetrics.activity_level
  }

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 px-4 py-3 rounded" style={{
            backgroundColor: 'var(--color-success)',
            color: 'white',
            border: '1px solid var(--color-success)'
          }}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded" style={{
            backgroundColor: 'var(--color-error)',
            color: 'white',
            border: '1px solid var(--color-error)'
          }}>
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - Navigation */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20">
              <h3 className="nh-subtitle mb-4">
                Profile Sections
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleTabChange('overview')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'overview'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'overview'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <User size={18} weight="fill" />
                  <span className="grow text-center">Overview</span>
                </button>

                {/* Meal Planner Tab */}
                <button
                  onClick={() => handleTabChange('mealPlanner')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'mealPlanner'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'mealPlanner'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <CalendarBlank size={18} weight="fill" />
                  <span className="grow text-center">Meal Planner</span>
                </button>

                <button
                  onClick={() => handleTabChange('allergens')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'allergens'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'allergens'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <Warning size={18} weight="fill" />
                  <span className="grow text-center">Allergens</span>
                </button>

                <button
                  onClick={() => handleTabChange('posts')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'posts'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'posts'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <Heart size={18} weight="fill" />
                  <span className="grow text-center">Liked Posts</span>
                </button>

                <button
                  onClick={() => handleTabChange('recipes')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'recipes'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'recipes'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <BookOpen size={18} weight="fill" />
                  <span className="grow text-center">Liked Recipes</span>
                </button>

                <button
                  onClick={() => handleTabChange('tags')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'tags'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'tags'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <Certificate size={18} weight="fill" />
                  <span className="grow text-center">Profession Tags</span>
                </button>

                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-sm cursor-not-allowed opacity-50"
                  style={{
                    backgroundColor: 'var(--forum-default-bg)',
                    color: 'var(--forum-default-text)',
                  }}
                >
                  <Warning size={18} weight="fill" />
                  <span className="grow text-center">Report User</span>
                </button>

                {/* New button for Saved Meal Plans */}
                <button
                  onClick={() => handleTabChange('mealPlans')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'mealPlans'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'mealPlans'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <BookmarkSimple size={18} weight="fill" />
                  <span className="grow text-center">Saved Meal Plans</span>
                </button>

                <button
                  onClick={() => handleTabChange('foodProposals')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'foodProposals'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'foodProposals'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <ForkKnife size={18} weight="fill" />
                  <span className="grow text-center">Food Proposals</span>
                </button>

                <button
                  onClick={() => handleTabChange('privateFoods')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                  style={{
                    backgroundColor: activeTab === 'privateFoods'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'privateFoods'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <Lock size={18} weight="fill" />
                  <span className="grow text-center">Private Foods</span>
                </button>

              </div>
            </div>
          </div>

          {/* Middle column - Content */}
          <div className="w-full md:w-3/5">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Profile Overview</h2>

                {/* Combined Profile Card */}
                <div className="nh-card">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Profile Picture */}
                    <div className="flex flex-col items-center lg:items-start">
                      <h3 className="nh-subtitle mb-4 text-center lg:text-left w-full">Profile Picture</h3>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            id="profile-picture-input"
                          />
                          {profilePicture ? (
                            <label
                              htmlFor="profile-picture-input"
                              className="cursor-pointer block"
                            >
                              <img
                                src={profilePicture}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 hover:opacity-80 transition-opacity"
                                style={{ aspectRatio: '1/1' }}
                              />
                            </label>
                          ) : (
                            <label
                              htmlFor="profile-picture-input"
                              className="cursor-pointer block"
                            >
                              <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-primary-500 hover:opacity-80 transition-opacity" style={{
                                backgroundColor: 'var(--dietary-option-bg)'
                              }}>
                                <User size={64} className="text-primary" weight="fill" />
                              </div>
                            </label>
                          )}
                          
                          {/* Delete Icon */}
                          {profilePicture && (
                            <div className="absolute -top-2 right-0">
                              <button
                                onClick={removeProfilePicture}
                                className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                                disabled={isLoading}
                                title="Delete picture"
                              >
                                <Trash size={16} weight="fill" className="text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Auto-upload when file is selected */}
                        {profilePictureFile && (
                          <div className="text-xs nh-text text-center">
                            {isLoading ? 'Uploading...' : 'Picture will be uploaded automatically'}
                          </div>
                        )}
                        
                        {/* Followers and Following Counts */}
                        <div className="grid grid-cols-2 gap-4 w-full text-center pt-2 border-t" style={{
                          borderColor: 'var(--forum-search-border)'
                        }}>
                          <div>
                            <div className="text-xl font-bold text-primary">{followersCount}</div>
                            <div className="nh-text text-xs">Followers</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-primary">{followingCount}</div>
                            <div className="nh-text text-xs">Following</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Account Information */}
                    <div className="lg:col-span-2">
                      <h3 className="nh-subtitle mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Username</label>
                          <p className="nh-text text-sm">{user?.username}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Email</label>
                          <p className="nh-text text-sm">{user?.email}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Full Name</label>
                          <p className="nh-text text-sm">{user?.name} {user?.surname}</p>
                        </div>
                        {user?.address && (
                          <div>
                            <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Address</label>
                            <p className="nh-text text-sm">{user.address}</p>
                          </div>
                        )}
                      </div>

                      {/* Body Metrics - Integrated */}
                      <div className="border-t pt-6" style={{ borderColor: 'var(--forum-search-border)' }}>
                        <h3 className="nh-subtitle mb-2">Body Metrics</h3>
                        <p className="nh-text mb-4 text-sm">
                          Update your body metrics to get personalized nutrition targets.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium mb-1">Height (cm)</label>
                            <input
                              type="number"
                              value={metrics.height || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setMetrics({ ...metrics, height: value === '' ? 0 : Number(value) });
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg input-white-bg"
                              style={{
                                border: '2px solid var(--dietary-option-border)'
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Weight (kg)</label>
                            <input
                              type="number"
                              value={metrics.weight || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setMetrics({ ...metrics, weight: value === '' ? 0 : Number(value) });
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg input-white-bg"
                              style={{
                                border: '2px solid var(--dietary-option-border)'
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Age</label>
                            <input
                              type="number"
                              value={metrics.age || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setMetrics({ ...metrics, age: value === '' ? 0 : Number(value) });
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg input-white-bg"
                              style={{
                                border: '2px solid var(--dietary-option-border)'
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Gender</label>
                            <select
                              value={metrics.gender}
                              onChange={(e) => setMetrics({ ...metrics, gender: e.target.value as 'M' | 'F' })}
                              className="w-full px-3 py-2 text-sm rounded-lg input-white-bg"
                              style={{
                                border: '2px solid var(--dietary-option-border)'
                              }}
                            >
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium mb-1">Activity Level</label>
                            <select
                              value={metrics.activity_level}
                              onChange={(e) => setMetrics({ ...metrics, activity_level: e.target.value as any })}
                              className="w-full px-3 py-2 text-sm rounded-lg input-white-bg"
                              style={{
                                border: '2px solid var(--dietary-option-border)'
                              }}
                            >
                              <option value="sedentary">Sedentary (little or no exercise)</option>
                              <option value="light">Lightly active (light exercise/sports 1-3 days/week)</option>
                              <option value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</option>
                              <option value="active">Active (hard exercise/sports 6-7 days/week)</option>
                              <option value="very_active">Very active (very hard exercise/sports & physical job)</option>
                            </select>
                          </div>
                        </div>

                        {(metricsChanged() || !hasMetrics) && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={saveMetrics}
                              className="nh-button nh-button-primary text-sm"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Saving...' : 'Save Metrics'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Summary */}
                <NutritionSummary 
                  key={metricsUpdateKey} 
                  compact={true} 
                  onNavigateToNutrition={() => navigate('/nutrition')}
                />
              </div>
            )}

            {/* Allergens Tab */}
            {activeTab === 'allergens' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Allergen Management</h2>

                <div className="nh-card">
                  <h3 className="text-lg font-semibold mb-4">Common Allergens</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PREDEFINED_ALLERGENS.map(allergen => {
                      const isSelected = selectedAllergens.some(a => a.name === allergen)
                      return (
                        <button
                          key={allergen}
                          onClick={() => toggleAllergen(allergen)}
                          className={`p-3 rounded-lg border-2 transition-colors ${isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                            }`}
                        >
                          {allergen}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="nh-card">
                  <h3 className="text-lg font-semibold mb-4">Custom Allergens</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAllergen}
                      onChange={(e) => setCustomAllergen(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomAllergen()}
                      placeholder="Enter custom allergen name"
                      className="flex-1 px-4 py-2 rounded-lg border input-white-bg"
                      style={{
                        borderColor: 'var(--color-bg-tertiary)'
                      }}
                    />
                    <button
                      onClick={addCustomAllergen}
                      className="nh-button nh-button-primary flex items-center gap-2"
                    >
                      <Plus size={20} weight="bold" />
                      Add
                    </button>
                  </div>
                </div>

                {selectedAllergens.length > 0 && (
                  <div className="nh-card">
                    <h3 className="text-lg font-semibold mb-4">Your Allergens ({selectedAllergens.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergens.map(allergen => (
                        <div
                          key={allergen.name}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full"
                        >
                          <span>{allergen.name}</span>
                          {allergen.isCustom && (
                            <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-1 rounded">
                              Custom
                            </span>
                          )}
                          <button
                            onClick={() => removeAllergen(allergen.name)}
                            className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-1"
                          >
                            <X size={16} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={saveAllergens}
                      className="nh-button nh-button-primary mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Allergens'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Liked Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Liked Posts</h2>

                {likedPosts.length === 0 ? (
                  <div className="nh-card text-center py-12">
                    <Heart size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="nh-text">You haven't liked any posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedPosts.map(post => (
                      <ForumPostCard
                        key={post.id}
                        post={post}
                        isLiked={likedPostsMap[post.id] || false}
                        onLikeToggle={handleLikeToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Liked Recipes Tab */}
            {activeTab === 'recipes' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Liked Recipes</h2>

                {likedRecipes.length === 0 ? (
                  <div className="nh-card text-center py-12">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="nh-text">You haven't liked any recipes yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedRecipes.map((recipe) => (
                      <ForumPostCard
                        key={recipe.id}
                        post={recipe}
                        isLiked={likedPostsMap[recipe.id] || false}
                        onLikeToggle={handleLikeToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profession Tags Tab */}
            {activeTab === 'tags' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Profession Tags</h2>

                <div className="nh-card">
                  <h3 className="text-lg font-semibold mb-4">Add Profession Tag</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedProfession}
                      onChange={(e) => setSelectedProfession(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border input-white-bg"
                      style={{
                        borderColor: 'var(--color-bg-tertiary)'
                      }}
                    >
                      <option value="">Select a profession</option>
                      {PROFESSION_TAGS.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                    <button
                      onClick={addProfessionTag}
                      className="nh-button nh-button-primary flex items-center gap-2"
                    >
                      <Plus size={20} weight="bold" />
                      Add
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Tags will be marked as "Unverified" until approved by moderators.
                  </p>
                </div>

                {professionTags.length > 0 && (
                  <div className="space-y-4">
                    {professionTags.map(tag => (
                      <div key={tag.name} className="nh-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold">{tag.name}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${tag.verified
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              }`}>
                              {tag.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeProfessionTag(tag.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={20} weight="bold" />
                          </button>
                        </div>

                        {!tag.verified && (
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                              className="hidden"
                              id={`cert-${tag.name}`}
                            />
                            <label
                              htmlFor={`cert-${tag.name}`}
                              className="nh-button nh-button-outline cursor-pointer text-sm"
                            >
                              {certificateFile ? certificateFile.name : 'Choose Certificate'}
                            </label>
                            {certificateFile && tag.id && (
                              <button
                                onClick={() => uploadCertificate(tag.id!)}
                                className="nh-button nh-button-primary text-sm"
                                disabled={isLoading}
                              >
                                Upload
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={saveProfessionTags}
                      className="nh-button nh-button-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Tags'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Report User Tab */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                <h2 className="nh-subtitle">Report User</h2>

                <div className="nh-card space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">User ID or Username</label>
                    <input
                      type="text"
                      value={reportUserId}
                      onChange={(e) => setReportUserId(e.target.value)}
                      placeholder="Enter user ID or username to report"
                      className="w-full px-4 py-2 rounded-lg border input-white-bg"
                      style={{
                        borderColor: 'var(--color-bg-tertiary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Report Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border input-white-bg"
                      style={{
                        borderColor: 'var(--color-bg-tertiary)'
                      }}
                    >
                      <option value="">Select a reason</option>
                      {REPORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Provide details about why you're reporting this user..."
                      rows={6}
                      className="w-full px-4 py-2 rounded-lg border input-white-bg"
                      style={{
                        borderColor: 'var(--color-bg-tertiary)'
                      }}
                    />
                  </div>

                  <button
                    onClick={submitReport}
                    className="nh-button nh-button-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Report Guidelines
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Only report users who violate community guidelines</li>
                    <li>• Provide clear and accurate information</li>
                    <li>• False reports may result in actions against your account</li>
                    <li>• Reports are reviewed by moderators within 48 hours</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Saved Meal Plans Tab */}
            {activeTab === 'mealPlans' && (
              <div className="space-y-4">
                <h2 className="nh-title">Saved Meal Plans</h2>
                {allMealPlans.length > 0 ? (
                  <div className="space-y-3">
                    {allMealPlans.map((mealPlan) => {
                      const isExpanded = expandedMealPlans.has(mealPlan.id)
                      const isEditing = editingMealPlanId === mealPlan.id
                      
                      return (
                        <div
                          key={mealPlan.id}
                          className="nh-card"
                        >
                          {/* Meal Plan Header */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleMealPlan(mealPlan.id)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <CaretDown size={20} className="text-primary" />
                                ) : (
                                  <CaretRight size={20} className="text-primary" />
                                )}
                              </button>
                              
                              {isEditing ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editedMealPlanName}
                                    onChange={(e) => setEditedMealPlanName(e.target.value)}
                                    className="nh-input flex-1"
                                    placeholder="Meal plan name"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSaveMealPlanName}
                                    className="nh-button nh-button-primary px-3 py-1 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMealPlanId(null)
                                      setEditedMealPlanName('')
                                    }}
                                    className="nh-button nh-button-secondary px-3 py-1 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <h3 className="nh-subtitle mb-0">{mealPlan.name}</h3>
                              )}
                            </div>
                            
                            {!isEditing && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleLogMealPlan(mealPlan.id)}
                                  disabled={isLoggingMealPlan && loggingMealPlanId === mealPlan.id}
                                  className="nh-button nh-button-primary flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{ display: 'flex' }}
                                >
                                  <ForkKnife size={16} weight="fill" />
                                  {isLoggingMealPlan && loggingMealPlanId === mealPlan.id ? 'Logging...' : 'Log'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMealPlanId(mealPlan.id)
                                    setEditedMealPlanName(mealPlan.name)
                                  }}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Edit meal plan name"
                                >
                                  <PencilSimple size={18} className="text-primary" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMealPlan(mealPlan.id, mealPlan.name)}
                                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Delete meal plan"
                                >
                                  <Trash size={18} className="text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Meal Plan Details (Expanded) */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                              <div className="space-y-4">
                                {renderMealPlanDetails(mealPlan)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="nh-card text-center py-12">
                    <BookmarkSimple size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="nh-text">You haven't saved any meal plan yet</p>
                  </div>
                )}
              </div>
            )}

            { activeTab === 'foodProposals' &&
              <div className="mt-8 space-y-4">
              <h2 className="nh-title">My Food Proposals</h2>

              {isLoading ? (
                <div className="nh-card text-center py-6">
                  <p className="nh-text">Loading food proposals...</p>
                </div>
              ) : foodProposals.length > 0 ? (
                <div className="nh-card p-0 overflow-hidden">
                  <ul
                    className="divide-y"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {foodProposals.map(food => (
                      <li
                        key={food.id}
                        className="px-5 py-4 flex items-center justify-between gap-4"
                      >
                        {/* Left: Thumbnail + Info */}
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-gray-100">
                            {food.imageUrl ? (
                              <img
                                src={food.imageUrl}
                                alt={food.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs nh-text opacity-50">No image</span>
                            )}
                          </div>

                          {/* Text Info */}
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">
                              {food.name}
                            </div>

                            <div className="text-xs nh-text opacity-60">
                              {food.category} · {food.servingSize} g
                            </div>

                            <div className="text-xs nh-text opacity-50">
                              Submitted on {new Date(food.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Right: Approval Status */}
                        <div className="shrink-0">
                          {food.isApproved === null && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Pending Review
                            </span>
                          )}

                          {food.isApproved === true && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Approved
                            </span>
                          )}

                          {food.isApproved === false && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Rejected
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="nh-card text-center py-8">
                  <p className="nh-text opacity-60">
                    You have not submitted any food proposals yet.
                  </p>
                </div>
              )}
            </div>

          }

          {activeTab === 'privateFoods' && (
            <div className="space-y-6">
              <h2 className="nh-title">My Private Foods</h2>

              {privateFoods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {privateFoods.map(food => (
                    <FoodItem
                      key={food.id}
                      item={food}
                      onClick={() => {
                        setSelectedFood(food)
                      }}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="nh-card text-center py-8">
                  <p className="nh-text opacity-60">
                    You have not created any private foods yet.
                  </p>
                </div>
              )}
            </div>
          )}

            {/* Meal Planner Tab */}
            {activeTab === 'mealPlanner' && (
              <div className="space-y-6">
                <MealPlanner 
                  profileLayout={true}
                  dietaryPreference={mealPlannerDietaryPreference}
                  setDietaryPreference={setMealPlannerDietaryPreference}
                  planDuration={mealPlannerDuration}
                  setPlanDuration={setMealPlannerDuration}
                  onSaveRef={mealPlannerSaveRef}
                  onLogRef={mealPlannerLogRef}
                />
              </div>
            )}

          </div>
          {/* Right column - Stats & Info */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20 flex flex-col gap-4">
              {/* Profile Info / Meal Planner Sidebar */}
              {activeTab === 'mealPlanner' ? (
                <MealPlannerSidebar
                  dietaryPreference={mealPlannerDietaryPreference}
                  setDietaryPreference={setMealPlannerDietaryPreference}
                  planDuration={mealPlannerDuration}
                  setPlanDuration={setMealPlannerDuration}
                  onSave={() => {
                    if (mealPlannerSaveRef.current) {
                      mealPlannerSaveRef.current()
                    }
                  }}
                  onLogToNutrition={async () => {
                    if (mealPlannerLogRef.current) {
                      setIsLoggingMeals(true)
                      try {
                        await mealPlannerLogRef.current()
                      } finally {
                        setIsLoggingMeals(false)
                      }
                    }
                  }}
                  isLogging={isLoggingMeals}
                />
              ) : (
                <div className="nh-card rounded-lg shadow-md">
                  <h3 className="nh-subtitle mb-3 text-sm">Profile Tips</h3>
                  <ul className="nh-text text-xs space-y-2">
                    <li>• Keep your allergen list updated</li>
                    <li>• Upload certificates for verification</li>
                    <li>• Review your liked content</li>
                    <li>• Report inappropriate behavior</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <PrivateFoodDetail 
            food={selectedFood}
            open={!!selectedFood}
            onClose={() => setSelectedFood(null)}
            onChanged={() => loadPrivateFoods()}
        />
      </div>
    </div>
  )
}

export default Profile
