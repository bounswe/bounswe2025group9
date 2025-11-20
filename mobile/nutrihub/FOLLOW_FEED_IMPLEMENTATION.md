# Follow & Feed Feature Implementation

This document describes the implementation of the follow and feed features in the NutriHub mobile app.

## Overview

The follow and feed features allow users to:
- Follow/unfollow other users
- View their followers and following lists
- See a personalized feed of posts from users they follow and posts they've liked

## Backend Integration

The backend endpoints are already implemented and accessible at:
- `POST /users/follow/` - Toggle follow/unfollow
- `GET /users/followers/<username>/` - Get followers list
- `GET /users/following/<username>/` - Get following list
- `GET /users/feed/` - Get personalized feed

## Files Modified/Created

### 1. API Services

#### `mobile/nutrihub/src/services/api/user.service.ts`
Added three new methods:
- `toggleFollow(username)` - Follow or unfollow a user (toggle operation)
- `getFollowers(username)` - Get list of followers for a user
- `getFollowing(username)` - Get list of users that a user is following

#### `mobile/nutrihub/src/services/api/forum.service.ts`
Added one new method:
- `getFeed()` - Get personalized feed of posts from followed users and liked posts

### 2. Type Definitions

#### `mobile/nutrihub/src/types/types.ts`
Updated `User` interface to include:
- `followers_count?: number` - Number of followers
- `following_count?: number` - Number of users following
- `is_following?: boolean` - Whether current user is following this user

#### `mobile/nutrihub/src/navigation/types.ts`
Updated `ForumStackParamList` to include new routes:
- `Feed: undefined` - Personalized feed screen
- `FollowersList: { username: string }` - Followers list screen
- `FollowingList: { username: string }` - Following list screen

### 3. New Screens

#### `mobile/nutrihub/src/screens/forum/FeedScreen.tsx`
A new screen that displays a personalized feed of posts:
- Shows posts from users the current user follows
- Shows posts the current user has liked
- Includes pull-to-refresh functionality
- Empty state when no feed content is available
- Error handling with retry functionality

#### `mobile/nutrihub/src/screens/user/FollowersListScreen.tsx`
A new screen that displays a list of followers:
- Shows all users following a specific user
- Tappable user items that navigate to their profiles
- Displays profile images, display names, and usernames
- Empty state when no followers exist

#### `mobile/nutrihub/src/screens/user/FollowingListScreen.tsx`
A new screen that displays a list of users being followed:
- Shows all users that a specific user is following
- Same UI/UX as FollowersListScreen
- Empty state when not following anyone

### 4. Updated Screens

#### `mobile/nutrihub/src/screens/user/UserProfileScreen.tsx`
Enhanced with follow functionality:
- Added follow/unfollow button (only visible when viewing other users' profiles)
- Added followers count and following count statistics (tappable)
- Clicking on followers/following counts navigates to respective lists
- Follow button shows loading state during API calls
- Follow state persists and updates followers count in real-time

#### `mobile/nutrihub/src/screens/forum/ForumScreen.tsx`
Added feed access:
- Added RSS icon button in header to navigate to feed screen
- Maintains existing forum functionality

### 5. Navigation

#### `mobile/nutrihub/src/navigation/MainTabNavigator.tsx`
Updated ForumStackNavigator to include new routes:
- Added imports for FeedScreen, FollowersListScreen, FollowingListScreen
- Registered all three screens in the ForumStack.Navigator

## User Flow

### Following a User
1. User navigates to another user's profile
2. User sees "Follow" button below the user's profile information
3. User taps "Follow" button
4. Button shows loading indicator
5. API call is made to toggle follow status
6. Button updates to show "Following" state
7. Followers count increments by 1
8. Success message is displayed

### Unfollowing a User
1. User is on a profile they're following (button shows "Following")
2. User taps "Following" button
3. API call is made to toggle follow status
4. Button updates to show "Follow" state
5. Followers count decrements by 1
6. Success message is displayed

### Viewing Followers/Following
1. User taps on "Followers" or "Following" count on any profile
2. Navigates to respective list screen
3. List displays all relevant users with profile images
4. User can tap on any user to view their profile
5. Navigation stack allows going back to previous screen

### Accessing Feed
1. User taps RSS icon in Forum screen header
2. Navigates to Feed screen
3. Feed displays posts from:
   - Users the current user follows
   - Posts the current user has liked
4. Posts are sorted by creation date (newest first)
5. User can:
   - Tap posts to view details
   - Like/unlike posts
   - Tap author names to view profiles
   - Pull to refresh the feed
6. If feed is empty, shows helpful message with "Explore Forum" button

## UI/UX Features

### Follow Button States
- **Not Following**: Primary color background, "Follow" text with plus icon
- **Following**: Surface color background with border, "Following" text with check icon
- **Loading**: Shows activity indicator

### Followers/Following Display
- Displayed prominently between bio and profession tags
- Side-by-side layout with divider
- Tappable to view full lists
- Counts update in real-time after follow/unfollow actions

### Feed Screen
- Clean, modern design matching app theme
- Back button for navigation
- Refresh button in header
- Pull-to-refresh support
- Empty state with helpful message
- Error state with retry option
- Loading state while fetching

### List Screens (Followers/Following)
- User avatar or placeholder icon
- Display name and username
- Chevron icon indicating tappability
- Empty states with appropriate messages
- Loading and error states

## Theme Support

All new screens and components fully support:
- Dark mode
- Light mode
- Theme colors from ThemeContext
- Consistent spacing and border radius from constants

## Error Handling

Comprehensive error handling includes:
- Network error messages
- API error messages
- Loading states
- Retry functionality
- Graceful degradation when features are unavailable

## Testing Recommendations

To test the implementation:

1. **Follow/Unfollow**:
   - Navigate to another user's profile
   - Test follow button (should see "Following" state)
   - Test unfollow button (should return to "Follow" state)
   - Verify follower counts update correctly

2. **Followers/Following Lists**:
   - Tap on followers count on various profiles
   - Verify list loads correctly
   - Tap on users in the list to navigate to their profiles
   - Test with users who have no followers/following

3. **Feed**:
   - Tap RSS icon in Forum screen
   - Verify feed loads posts from followed users
   - Verify feed includes liked posts
   - Test pull-to-refresh
   - Test empty state (unfollow all users and unlike all posts)
   - Test like/unlike from feed
   - Test navigation to post details

4. **Edge Cases**:
   - Test with no internet connection
   - Test with invalid usernames
   - Test rapid follow/unfollow clicks
   - Test navigation back/forward through the stack

## Future Enhancements

Potential improvements for future iterations:
- Add follow suggestions based on interests
- Implement notification system for new followers
- Add mutual followers indication
- Implement follow requests for private accounts
- Add statistics on feed engagement
- Implement infinite scroll for large follower/following lists
- Add search functionality in followers/following lists
- Show follower/following activity feed

## Dependencies

No new external dependencies were added. The implementation uses existing packages:
- React Navigation (already in use)
- React Native core components
- Expo vector icons (already in use)
- AsyncStorage (already in use)

## Compatibility

This implementation is compatible with:
- The existing backend API
- Current app architecture
- Existing theme system
- Current navigation structure
- All existing features

## Notes

- The backend returns paginated results for followers/following/feed, but current implementation loads all results at once. For production with large user bases, implement pagination.
- Follow/unfollow is a toggle operation (not separate endpoints).
- The feed combines both followed users' posts and liked posts in a single unified feed.
- Follow state is fetched from the backend but can be optimistically updated on the frontend.
- All screens properly handle the case where a user views their own profile (no follow button shown).

