import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ForumPostCard from '../components/ForumPostCard'
import { User, Certificate, ArrowLeft } from '@phosphor-icons/react'
import { apiClient, ForumPost, UserResponse } from '../lib/apiClient'
import { notifyLikeChange } from '../lib/likeNotifications'

interface ProfessionTag {
  id?: number
  name: string
  verified: boolean
  certificateUrl?: string
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const [userProfile, setUserProfile] = useState<UserResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'tags'>('posts')
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [professionTags, setProfessionTags] = useState<ProfessionTag[]>([])
  const [likedPostsMap, setLikedPostsMap] = useState<{[key: number]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (username) {
      loadUserProfile()
    }
  }, [username])

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

      // Load user's posts
      const postsResponse = await apiClient.getForumPosts({ author: profile.id })
      const posts = postsResponse.results || []
      setUserPosts(posts)

      // Initialize liked posts map from the posts' liked property
      const likedMap: {[key: number]: boolean} = {}
      posts.forEach(post => {
        likedMap[post.id] = post.liked || false
      })
      setLikedPostsMap(likedMap)
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      setError('Failed to load user profile. User may not exist.')
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

  const handleBackClick = () => {
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="nh-container flex items-center justify-center">
          <div className="nh-text">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="w-full py-12">
        <div className="nh-container">
          <div className="nh-card text-center">
            <div className="nh-text mb-4" style={{ color: 'var(--color-error)' }}>
              {error || 'User not found'}
            </div>
            <button
              onClick={handleBackClick}
              className="nh-button nh-button-primary"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="mb-4 flex items-center gap-2 nh-button nh-button-outline"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - User Info */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20">
              <div className="nh-card">
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{
                    backgroundColor: 'var(--dietary-option-bg)'
                  }}>
                    {userProfile.profile_image ? (
                      <img
                        src={userProfile.profile_image}
                        alt={userProfile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-primary" weight="fill" />
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center">
                  <h1 className="nh-subtitle mb-2">
                    {userProfile.name} {userProfile.surname}
                  </h1>
                  <p className="nh-text mb-1">@{userProfile.username}</p>
                  {userProfile.email && (
                    <p className="nh-text text-sm opacity-70">{userProfile.email}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-6 pt-4 flex gap-4 text-center" style={{
                  borderTop: '1px solid var(--forum-search-border)'
                }}>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-primary">{userPosts.length}</div>
                    <div className="nh-text text-sm">Posts</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-primary">{professionTags.length}</div>
                    <div className="nh-text text-sm">Tags</div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mt-6 flex flex-col gap-2">
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
                    <User size={18} weight="fill" />
                    <span className="flex-grow text-center">Posts</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tags')}
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
                    <span className="flex-grow text-center">Profession Tags</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle column - Content */}
          <div className="w-full md:w-3/5">
            {activeTab === 'posts' && (
              <div>
                <h2 className="nh-subtitle mb-4">Posts by @{userProfile.username}</h2>
                {userPosts.length === 0 ? (
                  <div className="nh-card text-center py-12">
                    <p className="nh-text">No posts yet</p>
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {activeTab === 'tags' && (
              <div>
                <h2 className="nh-subtitle mb-4">Profession Tags</h2>
                {professionTags.length === 0 ? (
                  <div className="nh-card text-center py-12">
                    <p className="nh-text">No profession tags</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {professionTags.map((tag, index) => (
                      <div
                        key={tag.id || index}
                        className="nh-card flex items-center gap-3"
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
                            Verified
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column - Empty */}
          <div className="w-full md:w-1/5"></div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
