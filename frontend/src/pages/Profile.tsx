import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Heart, BookOpen, Certificate, Warning, Plus, X } from '@phosphor-icons/react'
import { apiClient, ForumPost, Recipe } from '../lib/apiClient'
import ForumPostCard from '../components/ForumPostCard'
import { subscribeLikeChanges, notifyLikeChange } from '../lib/likeNotifications'

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
  const navigate = useNavigate()
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'allergens' | 'posts' | 'recipes' | 'tags' | 'report'>('overview')
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenData[]>([])
  const [customAllergen, setCustomAllergen] = useState('')
  const [likedPosts, setLikedPosts] = useState<ForumPost[]>([])
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [likedPostsMap, setLikedPostsMap] = useState<{[key: number]: boolean}>({})
  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([])
  const [selectedProfession, setSelectedProfession] = useState('')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Report user states
  const [reportUserId, setReportUserId] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [user])
  
  // Set up cross-tab like listener
  useEffect(() => {
    const unsubscribe = subscribeLikeChanges((event) => {
      console.log('[Profile] Received like change notification from another tab:', event)
      
      // Refetch liked posts and recipes when a like event occurs
      if (event.type === 'post') {
        loadLikedPosts()
      } else if (event.type === 'recipe') {
        loadLikedRecipes()
      }
    })
    
    return unsubscribe
  }, [])

  const loadUserData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
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
      
      // Load profile picture if available
      if (user.profile_image) {
        setProfilePicture(user.profile_image)
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
      const response = await apiClient.getLikedPosts()
      const posts = response.results || []
      setLikedPosts(posts)
      
      // Build a map of liked posts for easy lookup
      const likedMap: {[key: number]: boolean} = {}
      posts.forEach(post => {
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
      // Instead of fetching recipes separately, we'll filter liked posts for recipe posts
      // This allows us to use the same ForumPostCard component
      const response = await apiClient.getLikedPosts()
      const posts = response.results || []
      
      // Filter for posts with Recipe tag (tag id 2)
      const recipePosts = posts.filter(post => 
        post.tags.some(tag => tag.name === 'Recipe')
      )
      
      // Convert to Recipe format for backward compatibility if needed
      // For now, we'll store as posts since we're using ForumPostCard
      setLikedRecipes(recipePosts as any)
    } catch (error) {
      console.error('Error loading liked recipes:', error)
      setLikedRecipes([])
    }
  }
  
  // Handle like toggle for posts
  const handleLikeToggle = async (postId: number) => {
    try {
      console.log(`[Profile] Toggling like for post ID: ${postId}`)
      
      const currentLiked = likedPostsMap[postId] || false
      const newLiked = !currentLiked
      
      // Optimistically update the UI
      setLikedPostsMap(prev => ({ ...prev, [postId]: newLiked }))
      
      // Update the liked posts list
      if (!newLiked) {
        // Remove from liked posts if unliking
        setLikedPosts(prev => prev.filter(post => post.id !== postId))
      }
      
      // Call the API
      await apiClient.toggleLikePost(postId)
      
      // Notify other tabs
      notifyLikeChange(postId, newLiked, 'post')
      
      // Refetch to ensure consistency
      await loadLikedPosts()
    } catch (error) {
      console.error('[Profile] Error toggling post like:', error)
      // Revert on error
      await loadLikedPosts()
    }
  }

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
      await apiClient.updateAllergens(selectedAllergens.map(a => a.name))
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

  const uploadCertificate = async (tagName: string) => {
    if (!certificateFile) {
      showError('Please select a certificate file')
      return
    }
    
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('certificate', certificateFile)
      formData.append('tag_name', tagName)
      
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
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setProfilePictureFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePicture(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('profile_image', profilePictureFile)

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
                  onClick={() => setActiveTab('overview')}
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
                  <span className="flex-grow text-center">Overview</span>
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
                  <span className="flex-grow text-center">Allergens</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('posts')}
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
                  <span className="flex-grow text-center">Liked Posts</span>
                </button>

                <button
                  onClick={() => setActiveTab('recipes')}
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
                  <span className="flex-grow text-center">Liked Recipes</span>
                </button>
                
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-sm cursor-not-allowed opacity-50"
                  style={{
                    backgroundColor: 'var(--forum-default-bg)',
                    color: 'var(--forum-default-text)',
                  }}
                >
                  <Certificate size={18} weight="fill" />
                  <span className="flex-grow text-center">Profession Tags</span>
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
                  <span className="flex-grow text-center">Report User</span>
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
                
                {/* Profile Picture */}
                <div className="nh-card">
                  <h3 className="nh-subtitle mb-4">Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{
                        backgroundColor: 'var(--dietary-option-bg)'
                      }}>
                        <User size={48} className="text-primary" weight="fill" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      <label
                        htmlFor="profile-picture-input"
                        className="nh-button nh-button-outline cursor-pointer inline-block text-center"
                        style={{
                          color: 'var(--dietary-option-text)'
                        }}
                      >
                        Choose Picture
                      </label>
                      {profilePictureFile && (
                        <button
                          onClick={uploadProfilePicture}
                          className="nh-button nh-button-primary"
                          disabled={isLoading}
                        >
                          Upload
                        </button>
                      )}
                      {profilePicture && (
                        <button
                          onClick={removeProfilePicture}
                          className="nh-button nh-button-danger"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm nh-text mt-2">
                    Supported formats: JPEG, PNG. Maximum size: 5MB.
                  </p>
                </div>

                {/* Account Information */}
                <div className="nh-card">
                  <h3 className="nh-subtitle mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Username</label>
                      <p className="nh-text text-sm">{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Full Name</label>
                      <p className="nh-text text-sm">{user?.name} {user?.surname}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Email</label>
                      <p className="nh-text text-sm">{user?.email}</p>
                    </div>
                    {user?.address && (
                      <div>
                        <label className="text-xs font-bold" style={{ color: 'var(--color-light)' }}>Address</label>
                        <p className="nh-text text-sm">{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>
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
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            isSelected
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
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
                    {likedRecipes.map((recipe: any) => (
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
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              tag.verified
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
                            {certificateFile && (
                              <button
                                onClick={() => uploadCertificate(tag.name)}
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Report Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
          </div>

          {/* Right column - Stats & Info */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20 flex flex-col gap-4">
              {/* Profile Info */}
              <div className="nh-card rounded-lg shadow-md">
                <h3 className="nh-subtitle mb-3 text-sm">Profile Tips</h3>
                <ul className="nh-text text-xs space-y-2">
                  <li>• Keep your allergen list updated</li>
                  <li>• Upload certificates for verification</li>
                  <li>• Review your liked content</li>
                  <li>• Report inappropriate behavior</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
