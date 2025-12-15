import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ForumPostCard from '../components/ForumPostCard'
import { User, Certificate, ArrowLeft, UserPlus, UserMinus, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { apiClient, ForumPost, UserResponse } from '../lib/apiClient'
import { notifyLikeChange } from '../lib/likeNotifications'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

interface ProfessionTag {
  id?: number
  name: string
  verified: boolean
  certificateUrl?: string
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()

  const [userProfile, setUserProfile] = useState<UserResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'tags'>('posts')
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([])
  const [likedPostsMap, setLikedPostsMap] = useState<{[key: number]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [followSuccess, setFollowSuccess] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(5)
  const [totalPostsCount, setTotalPostsCount] = useState(0)
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    if (username) {
      loadUserProfile()
      // Reset to first page when username changes
      setCurrentPage(1)
    }
  }, [username])
  
  // Fetch posts when page changes
  useEffect(() => {
    if (userProfile && activeTab === 'posts') {
      fetchUserPosts(currentPage)
    }
  }, [currentPage, userProfile, activeTab])

  const loadUserProfile = async () => {
    if (!username) return

    setIsLoading(true)
    setError('')

    try {
      // Fetch user profile
      const profile = await apiClient.getOtherUserProfile(username)
      setUserProfile(profile)

      // Load profession tags
      if (profile.tags && profile.tags.length > 0) {
        setProfessionTags(profile.tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          verified: t.verified || false,
          certificateUrl: t.certificate_url
        })))
      }

      // Set total posts count (will be updated when we fetch first page)
      // For now, fetch first page to get total count
      const initialPostsResponse = await apiClient.getForumPosts({ 
        author: profile.id,
        page: 1,
        page_size: postsPerPage
      })
      setTotalPostsCount(initialPostsResponse.count || 0)
      
      // Load first page of user's posts
      const posts = initialPostsResponse.results || []
      setUserPosts(posts)

      // Initialize liked posts map from the posts' liked property
      const likedMap: {[key: number]: boolean} = {}
      posts.forEach(post => {
        likedMap[post.id] = post.liked || false
      })
      setLikedPostsMap(likedMap)

      // Load followers and following counts
      try {
        const [followersData, followingData] = await Promise.all([
          apiClient.getFollowers(username),
          apiClient.getFollowing(username)
        ])
        
        console.log('[UserProfile] Followers data:', followersData)
        console.log('[UserProfile] Current user:', currentUser?.username)
        
        // The API returns an array directly, not an object with followers property
        const followers = Array.isArray(followersData) ? followersData : (followersData.followers || [])
        const following = Array.isArray(followingData) ? followingData : (followingData.following || [])
        
        setFollowersCount(followers.length)
        setFollowingCount(following.length)

        // Check if current user is following this user
        if (currentUser && followers.length > 0) {
          const isCurrentUserFollowing = followers.some(
            (follower: any) => follower.username === currentUser.username
          )
          console.log('[UserProfile] Is following:', isCurrentUserFollowing)
          setIsFollowing(isCurrentUserFollowing)
        }
      } catch (err) {
        console.error('Error loading follow data:', err)
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      setError(t('profile.failedToLoadUserProfile'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeToggle = async (postId: number) => {
    try {
      const response = await apiClient.toggleLikePost(postId)
      const isLiked = response.liked

      // Calculate the new like count
      const post = userPosts.find(p => p.id === postId)
      const newLikeCount = response.like_count !== undefined
        ? response.like_count
        : (post ? (isLiked ? post.likes + 1 : post.likes - 1) : 0)

      // Update the liked posts map
      setLikedPostsMap(prev => ({
        ...prev,
        [postId]: isLiked
      }))

      // Update the post's like count
      setUserPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked: isLiked,
              likes: newLikeCount
            }
          }
          return post
        })
      )

      // Notify other tabs about the like change
      notifyLikeChange(postId, isLiked, newLikeCount, 'post')
    } catch (err: any) {
      console.error('Error toggling like:', err)
    }
  }

  const handleFollowToggle = async () => {
    if (!username || !currentUser) return

    setFollowLoading(true)
    setFollowSuccess(null)
    console.log('[UserProfile] Toggling follow for:', username, 'Current state:', isFollowing)
    
    try {
      const response = await apiClient.toggleFollowUser(username)
      console.log('[UserProfile] Follow response:', response)
      
      // The backend returns a message, not a following boolean
      // We need to determine the new state based on the message or toggle the current state
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      
      // Update followers count and show success message
      if (newFollowingState) {
        setFollowersCount(prev => prev + 1)
        setFollowSuccess(t('profile.youAreNowFollowing', { username }))
        console.log('[UserProfile] Now following', username)
      } else {
        setFollowersCount(prev => Math.max(0, prev - 1))
        setFollowSuccess(t('profile.youUnfollowed', { username }))
        console.log('[UserProfile] Unfollowed', username)
      }
      
      // Set flag to refresh personalized feed (for both follow and unfollow)
      localStorage.setItem('nutriHub_feedNeedsRefresh', 'true')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFollowSuccess(null)
      }, 3000)
    } catch (err) {
      console.error('[UserProfile] Error toggling follow:', err)
      alert(t('profile.failedToUpdateFollowStatus'))
    } finally {
      setFollowLoading(false)
    }
  }

  const handleBackClick = () => {
    navigate(-1)
  }
  
  // Fetch user posts with pagination
  const fetchUserPosts = async (page: number) => {
    if (!userProfile) return
    
    setLoadingPosts(true)
    try {
      const postsResponse = await apiClient.getForumPosts({ 
        author: userProfile.id,
        page: page,
        page_size: postsPerPage,
        ordering: '-created_at'
      })
      
      const posts = postsResponse.results || []
      setUserPosts(posts)
      setTotalPostsCount(postsResponse.count || 0)
      
      // Update liked posts map
      const likedMap: {[key: number]: boolean} = {}
      posts.forEach(post => {
        likedMap[post.id] = post.liked || false
      })
      setLikedPostsMap(prev => ({ ...prev, ...likedMap }))
    } catch (err) {
      console.error('Error fetching user posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Calculate total pages
  const totalPages = Math.ceil(totalPostsCount / postsPerPage)

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="nh-container">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column - Empty */}
            <div className="w-full md:w-1/5"></div>

            {/* Middle column - Profile Skeleton */}
            <div className="w-full md:w-3/5">
              {/* Profile Card Skeleton */}
              <div className="nh-card mb-8 rounded-lg shadow-md animate-pulse">
                {/* Back button and Title skeleton */}
                <div className="flex items-center gap-4 mb-4 pt-4 px-4">
                  <div 
                    className="h-10 w-10 rounded"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div 
                    className="h-8 flex-grow rounded"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                </div>
                
                {/* Profile Picture and Info skeleton */}
                <div className="flex flex-col items-center mb-6 px-4">
                  <div 
                    className="h-24 w-24 rounded-full mb-4"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div 
                    className="h-6 w-48 rounded mb-2"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div 
                    className="h-4 w-32 rounded mb-4"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div 
                    className="h-10 w-full max-w-xs rounded"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                </div>
                
                {/* Stats skeleton */}
                <div className="grid grid-cols-4 gap-4 mb-6 px-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="h-8 w-12 rounded mx-auto mb-2"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      ></div>
                      <div 
                        className="h-4 w-16 rounded mx-auto"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      ></div>
                    </div>
                  ))}
                </div>
                
                {/* Tabs skeleton */}
                <div className="flex flex-col gap-2 px-4 pb-4">
                  <div 
                    className="h-12 w-full rounded"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div 
                    className="h-12 w-full rounded"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div className="nh-card rounded-lg shadow-md animate-pulse">
                <div className="px-4 pt-4 pb-4">
                  <div 
                    className="h-6 w-48 rounded mb-4"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  ></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div 
                        key={index}
                        className="h-32 w-full rounded"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Empty */}
            <div className="w-full md:w-1/5"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="w-full py-12">
        <div className="nh-container">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column - Empty */}
            <div className="w-full md:w-1/5"></div>

            {/* Middle column - Error */}
            <div className="w-full md:w-3/5">
              <div className="nh-card text-center rounded-lg shadow-md">
                <div className="nh-text mb-4 px-4 pt-4" style={{ color: 'var(--color-error)' }}>
                  {error || t('profile.userNotFound')}
                </div>
                <div className="pb-4 px-4">
                  <button
                    onClick={handleBackClick}
                    className="nh-button nh-button-primary flex items-center gap-2 mx-auto"
                  >
                    <ArrowLeft size={20} weight="bold" />
                    {t('profile.goBack')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right column - Empty */}
            <div className="w-full md:w-1/5"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        {/* Apply three-column layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - Empty */}
          <div className="w-full md:w-1/5"></div>

          {/* Middle column - Profile Details */}
          <div className="w-full md:w-3/5">
            {/* Profile Card - nh-card for the profile content itself */}
            <div className="nh-card mb-8 rounded-lg shadow-md">
              {/* Combined Back button and Title container INSIDE the card */}
              <div className="flex items-center gap-4 mb-4 pt-4 px-4">
                <button 
                  onClick={handleBackClick}
                  className="nh-button-square nh-button-primary flex items-center justify-center p-2"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
              
                <h1 className="nh-title-custom flex-grow">@{userProfile.username}</h1>
              </div>
              
              {/* Profile Picture and Info */}
              <div className="flex flex-col items-center mb-6 px-4">
                <div className="mb-4 relative">
                  {userProfile.profile_image ? (
                    <img
                      src={userProfile.profile_image}
                      alt={userProfile.username}
                      className="w-40 h-40 rounded-full object-cover"
                      style={{ aspectRatio: '1/1' }}
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full flex items-center justify-center" style={{
                      backgroundColor: 'var(--dietary-option-bg)'
                    }}>
                      <User size={80} className="text-primary" weight="fill" />
                    </div>
                  )}
                </div>
                
                <div className="text-center mb-4">
                  <h2 className="nh-subtitle mb-2">
                    {userProfile.name} {userProfile.surname}
                  </h2>
                  <p className="nh-text">@{userProfile.username}</p>
                </div>

                {/* Follow Button (only show if not viewing own profile) */}
                {currentUser && currentUser.username !== userProfile.username && (
                  <div className="w-full max-w-xs space-y-2">
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                        followLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'nh-button nh-button-primary'
                      }`}
                      style={{
                        display: 'flex',
                        ...(followLoading ? { pointerEvents: 'none' } : {})
                      }}
                    >
                      {followLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          <span>{isFollowing ? t('profile.unfollowing') : t('profile.followingAction')}</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinus size={18} weight="fill" />
                          <span>{t('profile.following')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} weight="fill" />
                          <span>{t('profile.follow')}</span>
                        </>
                      )}
                    </button>
                    
                    {/* Success Message */}
                    {followSuccess && (
                      <div className="px-3 py-2 rounded-lg text-sm text-center animate-fade-in" style={{
                        backgroundColor: 'var(--color-success)',
                        color: 'white'
                      }}>
                        {followSuccess}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6 px-4 pt-4 border-t border-[var(--forum-search-border)]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{followersCount}</div>
                  <div className="nh-text text-sm">{t('profile.followers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{followingCount}</div>
                  <div className="nh-text text-sm">{t('profile.following')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalPostsCount}</div>
                  <div className="nh-text text-sm">{t('profile.posts')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{professionTags.length}</div>
                  <div className="nh-text text-sm">{t('profile.tags')}</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-row gap-2 px-4 pb-4">
                <button
                  onClick={() => {
                    setActiveTab('posts')
                    setCurrentPage(1) // Reset to first page when switching to posts
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex-1"
                  style={{
                    backgroundColor: activeTab === 'posts'
                      ? 'var(--forum-default-active-bg)'
                      : 'var(--forum-default-bg)',
                    color: activeTab === 'posts'
                      ? 'var(--forum-default-active-text)'
                      : 'var(--forum-default-text)',
                  }}
                >
                  <User size={18} weight="fill" />
                  <span>{t('profile.posts')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('tags')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex-1"
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
                  <span>{t('profile.tags')}</span>
                </button>
              </div>
            </div>
            
            {/* Content Section */}
            {activeTab === 'posts' && (
              <div>
                <h2 className="nh-subtitle mb-4">{t('profile.postsBy', { username: userProfile.username })}</h2>
                {loadingPosts ? (
                  <div className="space-y-4">
                    {[...Array(postsPerPage)].map((_, index) => (
                      <div key={index} className="nh-card rounded-lg shadow-md animate-pulse">
                        <div className="p-4">
                          <div 
                            className="h-6 w-3/4 rounded mb-2"
                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                          ></div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <div 
                              className="h-6 w-20 rounded-md"
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                            ></div>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div 
                              className="h-4 w-full rounded"
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                            ></div>
                            <div 
                              className="h-4 w-5/6 rounded"
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div 
                              className="h-4 w-32 rounded"
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                            ></div>
                            <div 
                              className="h-8 w-20 rounded"
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="nh-card text-center py-12 rounded-lg shadow-md">
                    <p className="nh-text">{t('profile.noPostsYet')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {userPosts.map((post) => (
                        <ForumPostCard
                          key={post.id}
                          post={post}
                          isLiked={likedPostsMap[post.id] || false}
                          onLikeToggle={handleLikeToggle}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalPostsCount > 0 && totalPages > 1 && (
                      <div className="flex justify-center items-center mt-6 gap-2">
                        <button 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${currentPage === 1 ? 'text-[var(--color-gray-400)] dark:text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'}`}
                        >
                          <CaretLeft size={20} weight="bold" />
                        </button>
                        
                        {totalPages <= 5 ? (
                          // Show all pages if 5 or fewer
                          [...Array(totalPages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handlePageChange(index + 1)}
                              className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                currentPage === index + 1 
                                ? 'bg-primary text-white'
                                : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
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
                              className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                currentPage === 1 
                                ? 'bg-primary text-white' 
                                : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                              }`}
                            >
                              1
                            </button>
                            
                            {/* Ellipsis for many pages */}
                            {currentPage > 3 && <span className="mx-1 text-[var(--forum-default-text)] dark:text-gray-400">...</span>}
                            
                            {/* Pages around current page */}
                            {Array.from(
                              { length: Math.min(3, totalPages - 2) },
                              (_, i) => {
                                let pageNum;
                                if (currentPage <= 2) {
                                  pageNum = i + 2; // Show 2, 3, 4
                                } else if (currentPage >= totalPages - 1) {
                                  pageNum = totalPages - Math.min(3, totalPages - 2) + i; // Ensure it shows correct last few pages
                                } else {
                                  pageNum = currentPage - 1 + i; // Show around current
                                }
                                
                                if (pageNum <= 1 || pageNum >= totalPages) return null;
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                      currentPage === pageNum 
                                      ? 'bg-primary text-white' 
                                      : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }
                            )}
                            
                            {/* Ellipsis for many pages */}
                            {currentPage < totalPages - 2 && <span className="mx-1 text-[var(--forum-default-text)] dark:text-gray-400">...</span>}
                            
                            {/* Last page */}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className={`w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${ 
                                currentPage === totalPages 
                                ? 'bg-primary text-white' 
                                : 'text-[var(--forum-default-text)] dark:text-gray-400 hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'
                              }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow hover:shadow-md ${currentPage === totalPages ? 'text-[var(--color-gray-400)] dark:text-gray-500 cursor-not-allowed' : 'text-primary hover:bg-[var(--forum-default-hover-bg)] dark:hover:bg-gray-800'}`}
                        >
                          <CaretRight size={20} weight="bold" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'tags' && (
              <div>
                <h2 className="nh-subtitle mb-4">{t('profile.professionTags')}</h2>
                {professionTags.length === 0 ? (
                  <div className="nh-card text-center py-12 rounded-lg shadow-md">
                    <p className="nh-text">{t('profile.noProfessionTags')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {professionTags.map((tag, index) => (
                      <div
                        key={tag.id || index}
                        className="nh-card flex items-center gap-3 rounded-lg shadow-sm"
                      >
                        <Certificate
                          size={24}
                          className={tag.verified ? 'text-primary' : 'opacity-50'}
                          weight={tag.verified ? 'fill' : 'regular'}
                        />
                        <span className="nh-text font-medium flex-grow">{tag.name}</span>
                        {tag.verified && (
                          <span className="text-xs px-2 py-1 rounded" style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'white'
                          }}>
                            {t('profile.verified')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* End of Middle Column */}

          {/* Right column - Empty */}
          <div className="w-full md:w-1/5"></div>
        </div>
        {/* End of three-column layout */}
      </div>
    </div>
  )
}

export default UserProfile
