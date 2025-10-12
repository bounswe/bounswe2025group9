import { ForumPost } from './apiClient';

// define the structure for a cached item, including fetch time
interface CachedPostEntry {
    post: ForumPost;
    fetchedAt: number;
}

// use a Map for the cache for efficient lookups
const postDetailCache = new Map<number, CachedPostEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

// local storage key for liked posts, to keep cache in sync
const LIKED_POSTS_STORAGE_KEY = 'nutriHub_likedPosts';

// helper to get current user's liked posts from localstorage
const getUserLikedPosts = (username: string): {[postId: number]: boolean} => {
    const storedLikedPosts = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    if (storedLikedPosts) {
        try {
            const parsedData = JSON.parse(storedLikedPosts);
            return parsedData[username] || {};
        } catch (error) {
            console.error('Error parsing liked posts from localStorage for cache:', error);
            return {};
        }
    }
    return {};
};

// function to get a post from cache
export const getPostFromCache = (postId: number, username: string): ForumPost | null => {
    const cachedEntry = postDetailCache.get(postId);
    if (cachedEntry) {
        const now = Date.now();
        if (now - cachedEntry.fetchedAt < CACHE_DURATION_MS) {
            // cache hit and is valid
            // ensure liked status is up-to-date with localStorage
            const userLikedPosts = getUserLikedPosts(username);
            const likedFromStorage = userLikedPosts[postId];

            if (likedFromStorage !== undefined && cachedEntry.post.liked !== likedFromStorage) {
                console.log(`[PostCache] Syncing liked status for post ${postId} from localStorage (${likedFromStorage}) to cache.`);
                const updatedPost = {
                    ...cachedEntry.post,
                    liked: likedFromStorage,
                    // adjust likes count if necessary, assuming cache was the source of truth before this check
                    // this part is tricky, as the actual like count comes from the server.
                    // for now, we only update the 'liked' flag from local storage.
                    // The main components (Forum.tsx, PostDetail.tsx) will handle like count updates via API calls.
                };
                // update the cache with the synced post
                postDetailCache.set(postId, { ...cachedEntry, post: updatedPost });
                return updatedPost;
            }
            return cachedEntry.post;
        } else {
            // cache expired
            postDetailCache.delete(postId);
            console.log(`[PostCache] Post ${postId} expired from cache.`);
            return null;
        }
    }
    // cache miss
    return null;
};

// function to set/update a post in cache
export const setPostInCache = (post: ForumPost, username: string): void => {
    // ensure liked status is accurate before caching
    const userLikedPosts = getUserLikedPosts(username);
    const likedFromStorage = userLikedPosts[post.id];

    const postToCache = { ...post };
    if (likedFromStorage !== undefined) {
        postToCache.liked = likedFromStorage;
    }

    postDetailCache.set(post.id, { post: postToCache, fetchedAt: Date.now() });
    console.log(`[PostCache] Post ${post.id} set/updated in cache.`);
};

// function to update only the like status of a post in cache
export const updatePostLikeStatusInCache = (postId: number, liked: boolean, newLikesCount: number | undefined, _username: string): void => {
    const cachedEntry = postDetailCache.get(postId);
    if (cachedEntry) {
        const updatedPost = {
            ...cachedEntry.post,
            liked: liked,
            likes: newLikesCount !== undefined ? newLikesCount : cachedEntry.post.likes,
        };
        postDetailCache.set(postId, { ...cachedEntry, post: updatedPost, fetchedAt: Date.now() }); // refresh fetch time
        console.log(`[PostCache] Updated like status for post ${postId} in cache. Liked: ${liked}, Likes: ${updatedPost.likes}`);
    } else {
        // if post is not in cache, we can't update it.
        // it will be added when fetched next time.
        // alternatively, we could fetch it here if necessary, but that might be too aggressive.
        console.log(`[PostCache] Post ${postId} not found in cache to update like status.`);
    }
};

// function to update multiple posts in cache, e.g., from forum list
export const setMultiplePostsInCache = (posts: ForumPost[], username: string): void => {
    const userLikedPosts = getUserLikedPosts(username);
    posts.forEach(post => {
        const postToCache = { ...post };
        const likedFromStorage = userLikedPosts[post.id];
        if (likedFromStorage !== undefined) {
            postToCache.liked = likedFromStorage;
        }
        // only add/update if not present or to refresh (though setPostInCache already does this)
        // this avoids overwriting a more detailed post from PostDetail with a summary from Forum list if structures differ significantly
        // however, with ForumPost as the standard, this should be fine.
        postDetailCache.set(post.id, { post: postToCache, fetchedAt: Date.now() });
    });
    console.log(`[PostCache] Batch updated/added ${posts.length} posts in cache.`);
};

// function to clear the entire cache
export const clearPostCache = (): void => {
    postDetailCache.clear();
    console.log('[PostCache] Cleared all posts from cache.');
};

// function to remove a single post from cache
export const removePostFromCache = (postId: number): void => {
    if (postDetailCache.has(postId)) {
        postDetailCache.delete(postId);
        console.log(`[PostCache] Removed post ${postId} from cache.`);
    }
};

// potentially, a function to get all cached posts (e.g. for debugging or rehydrating Forum.tsx's allPosts)
export const getAllPostsFromCache = (): ForumPost[] => {
    const posts: ForumPost[] = [];
    const now = Date.now();
    for (const [id, entry] of postDetailCache.entries()) {
        if (now - entry.fetchedAt < CACHE_DURATION_MS) {
            posts.push(entry.post);
        } else {
            postDetailCache.delete(id); // remove expired
        }
    }
    return posts;
}; 