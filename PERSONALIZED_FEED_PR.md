# Pull Request: Personalized Feed Feature

## ⚠️ IMPORTANT: Dependency Warning
**This PR depends on PR #651 (Follow System). Please merge PR #651 before merging this PR.**

**Note:** Comprehensive selenium tests will be added after PR #651 is merged to properly test scenarios involving the follow feature.

---

## 📋 Overview
This PR implements a personalized feed feature that displays posts from followed users and liked posts in a unified, user-friendly interface. The feed replaces the home page and provides visual indicators and filtering options to help users understand and control their feed content.

---

## 🎯 Features Implemented

### 1. Personalized Feed Page
- **Route**: `/` (home page)
- Displays posts from users the authenticated user follows
- Displays posts the user has liked
- Posts sorted by newest first with pagination (10 posts per page)
- Infinite scroll for seamless browsing experience
- Automatic refresh when navigating to the page

### 2. Visual Indicators
Posts are tagged with clear visual badges:
- **"You liked this"** (pink badge with heart icon) - Posts the user has liked (including their own posts if liked)
- **"From followed user"** (blue badge with user icon) - Posts from followed users

**Note:** User's own posts only appear in the feed if they've liked them, in which case they show the "You liked this" badge.

### 3. Filter Options
Users can filter the feed content:
- **"All Posts"** (default) - Shows both posts from followed users and liked posts
- **"Following Only"** - Shows only posts from users you follow (excludes liked posts)

Filter toggle appears below the feed title with clear visual indication of the active filter.

### 4. Real-time Updates
- Cross-tab synchronization for like actions
- Automatic feed refresh when navigating to the page
- Manual refresh button for on-demand updates
- Optimistic UI updates for instant feedback

### 5. Local Storage Integration
- Syncs liked posts with backend on page load
- Maintains liked state across sessions
- Handles multi-user scenarios in shared environments

### 6. Empty State Handling
- Friendly message when feed is empty
- Quick link to explore the forum
- Login prompt for unauthenticated users

---

## 🔧 Technical Changes

### Frontend Files Modified

#### 1. `frontend/src/App.tsx`
- Updated home route (`/`) to render `PersonalizedFeed` component
- Removed old home page component

#### 2. `frontend/src/pages/PersonalizedFeed.tsx` (NEW)
**Main Features:**
- Personalized feed component with infinite scroll
- Like/unlike functionality with optimistic updates
- Badge system for post categorization (liked vs followed)
- Filter toggle for "All Posts" vs "Following Only"
- Local storage sync for liked posts
- Cross-tab communication via custom events
- Automatic refresh on navigation
- Responsive layout with sidebar information

**Key Functions:**
- `fetchFeed()` - Fetches personalized feed from backend
- `syncLikedPostsFromBackend()` - Syncs liked posts with backend
- `handleLikeToggle()` - Handles like/unlike with optimistic UI
- `getPostBadge()` - Returns appropriate badge for each post
- Filter state management with `showFollowingOnly`

#### 3. `frontend/src/lib/apiClient.ts`
- Added `getPersonalizedFeed()` method
- Integrated with backend `/forum/feed/` endpoint
- Supports pagination parameters

#### 4. `frontend/src/lib/likeNotifications.ts` (NEW)
- Custom event system for cross-tab like synchronization
- Broadcasts like/unlike actions across browser tabs
- Subscribes to like changes for real-time updates

---

## 🎨 UI/UX Improvements

### Layout
- Three-column responsive layout
- Left sidebar: Feed information and legend
- Center: Main feed content with filter toggle
- Right sidebar: Quick action links

### Filter Toggle
- Two-button toggle for "All Posts" and "Following Only"
- Active filter highlighted with blue background and white text
- Inactive filters have gray background
- Smooth transitions between states

### Interactions
- Smooth infinite scroll
- Loading states for initial load and pagination
- Refresh button with loading indicator
- Optimistic UI updates for likes
- Filter toggle with instant feedback

### Visual Design
- Color-coded badges for different post types:
  - Pink badge for liked posts
  - Blue badge for posts from followed users
- Consistent with existing NutriHub design system
- Accessible color contrasts
- Clear iconography using Phosphor icons

---

## 📱 Responsive Design
- Mobile-friendly single-column layout
- Tablet-optimized two-column layout
- Desktop three-column layout
- Touch-friendly buttons and interactions
- Filter toggle adapts to screen size

---

## 🧪 Testing

### Manual Testing Checklist
1. **Feed Display**
   - [ ] Verify posts from followed users appear
   - [ ] Verify liked posts appear
   - [ ] Verify correct badges for each post type
   - [ ] Verify user's own posts only appear if liked

2. **Filter Functionality**
   - [ ] "All Posts" shows both followed and liked posts
   - [ ] "Following Only" shows only posts from followed users
   - [ ] Filter toggle is clearly visible in both light and dark modes
   - [ ] Active filter is highlighted correctly

3. **Infinite Scroll**
   - [ ] Scroll to bottom and verify more posts load
   - [ ] Verify loading indicator appears
   - [ ] Verify "end of feed" message when no more posts

4. **Like Functionality**
   - [ ] Like a post and verify badge updates
   - [ ] Unlike a post and verify badge updates
   - [ ] Verify like count updates correctly
   - [ ] Verify liked posts appear in feed

5. **Cross-tab Sync**
   - [ ] Open feed in two tabs
   - [ ] Like a post in one tab
   - [ ] Verify the other tab updates automatically

6. **Refresh Functionality**
   - [ ] Click refresh button
   - [ ] Navigate away and back
   - [ ] Verify feed updates with latest posts

7. **Empty States**
   - [ ] Test with no followed users or liked posts
   - [ ] Verify empty state message and CTA

### Automated Testing
**Note:** Comprehensive selenium tests will be added after PR #651 (Follow System) is merged. This will allow proper testing of:
- Following users and seeing their posts in the feed
- Unfollowing users and posts disappearing from feed
- Filter functionality with actual followed users
- Integration between follow system and personalized feed

---

## 🔄 Migration Notes
- No database migrations required
- No breaking changes to existing features
- Feed replaces home page - users will see the new feed on next visit
- Existing liked posts will be synced from backend on first load

---

## 📦 Dependencies
- **Requires PR #651 (Follow System) to be merged first**
- Uses existing backend `/forum/feed/` endpoint
- Compatible with current authentication system
- Integrates with existing like functionality

---

## 🚀 Deployment Notes
1. Ensure PR #651 is merged and deployed
2. Verify backend feed endpoint is accessible
3. Deploy frontend changes
4. Clear browser cache if needed for route changes
5. Monitor for any issues with feed loading or filtering

---

## 📸 Screenshots
(Add screenshots of the personalized feed showing:)
- Feed with "All Posts" filter active
- Feed with "Following Only" filter active
- Different badge types (liked vs followed)
- Empty state
- Mobile responsive view

---

## 🔮 Future Enhancements
- Additional filter options (by tags, by date range)
- Sort options (newest, most liked, most commented)
- Search within feed
- Post recommendations based on interests
- Notification badges for new posts in feed
- Save filter preference to user settings
- Export/share feed functionality

---

## ✅ Checklist
- [x] Code follows project style guidelines
- [x] Responsive design implemented
- [x] Error handling implemented
- [x] Loading states implemented
- [x] Empty states implemented
- [x] Cross-tab synchronization working
- [x] Integration with existing API endpoints
- [x] Filter functionality working correctly
- [x] Visual badges displaying correctly
- [x] No console errors or warnings
- [x] Dependency on PR #651 documented
- [ ] Selenium tests (to be added after PR #651 merge)

---

## 🐛 Known Issues
None at this time.

---

## 💡 Implementation Notes

### Why User's Own Posts Don't Appear by Default
User's own posts only appear in the feed if they've liked them. This design decision was made because:
1. Users don't need to follow themselves to see their own content
2. The feed is meant to show content from others you're interested in
3. If users want to see their own posts, they can visit their profile
4. If users like their own posts, they'll appear with the "You liked this" badge

### Filter Logic
- **All Posts**: Shows the complete personalized feed (followed + liked)
- **Following Only**: Filters out liked posts, showing only posts from followed users
- This allows users to focus on content from people they follow without the noise of all liked posts

### Performance Considerations
- Infinite scroll loads 10 posts at a time to balance performance and UX
- Local storage caching reduces API calls for liked posts
- Optimistic UI updates provide instant feedback
- Cross-tab sync uses custom events instead of polling

---

**Last Updated:** November 22, 2025  
**Author:** Development Team  
**Status:** ⏳ Waiting for PR #651 to be merged  
**Related PRs:** #651 (Follow System - Required)
