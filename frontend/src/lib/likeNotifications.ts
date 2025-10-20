// Cross-tab like notification system using localStorage
// Note: localStorage storage events are fired across tabs, unlike sessionStorage

const LIKE_EVENT_KEY = 'nutriHub_likeEvent';

export interface LikeEvent {
    postId: number;
    isLiked: boolean;
    timestamp: number;
    type: 'post' | 'recipe';
}

/**
 * Notify other tabs that a like event occurred
 */
export const notifyLikeChange = (postId: number, isLiked: boolean, type: 'post' | 'recipe' = 'post') => {
    const event: LikeEvent = {
        postId,
        isLiked,
        timestamp: Date.now(),
        type
    };
    
    // Store in localStorage to trigger storage event in other tabs
    localStorage.setItem(LIKE_EVENT_KEY, JSON.stringify(event));
    
    // Clear immediately so the same event can be triggered again
    setTimeout(() => {
        localStorage.removeItem(LIKE_EVENT_KEY);
    }, 100);
};

/**
 * Listen for like changes from other tabs
 */
export const subscribeLikeChanges = (callback: (event: LikeEvent) => void) => {
    const handleStorageChange = (e: StorageEvent) => {
        // Only respond to localStorage changes for our like event key
        if (e.key === LIKE_EVENT_KEY && e.newValue) {
            try {
                const event: LikeEvent = JSON.parse(e.newValue);
                callback(event);
            } catch (error) {
                console.error('Error parsing like event:', error);
            }
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
};

