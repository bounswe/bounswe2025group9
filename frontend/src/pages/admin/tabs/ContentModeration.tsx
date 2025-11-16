import { useState, useEffect } from 'react';
import { Article, Trash, Eye, ChatCircle } from '@phosphor-icons/react';

interface Post {
  id: number;
  title: string;
  body: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
}

interface Comment {
  id: number;
  body: string;
  author: {
    id: number;
    username: string;
  };
  post: {
    id: number;
    title: string;
  };
  createdAt: string;
}

type ContentType = 'posts' | 'comments';

// Mock data for UI-only PR
const MOCK_POSTS: Post[] = [
  {
    id: 101,
    title: 'Healthy Breakfast Ideas',
    body: 'Start your day with oats, fruits, and yogurt for a balanced meal.',
    author: { id: 31, username: 'healthguru' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    likesCount: 24,
    commentsCount: 5,
    tags: ['Dietary tip', 'Breakfast']
  },
  {
    id: 102,
    title: 'High-Protein Lunch Bowl',
    body: 'Quinoa, chicken breast, chickpeas, and greens make a great bowl.',
    author: { id: 32, username: 'fitchef' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    likesCount: 41,
    commentsCount: 12,
    tags: ['Recipe', 'High-Protein']
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 201,
    body: 'I tried this and it was great!',
    author: { id: 41, username: 'ayse' },
    post: { id: 102, title: 'High-Protein Lunch Bowl' },
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString()
  },
  {
    id: 202,
    body: 'Can I replace chicken with tofu?',
    author: { id: 42, username: 'mehmet' },
    post: { id: 102, title: 'High-Protein Lunch Bowl' },
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

const ContentModeration = () => {
  const [contentType, setContentType] = useState<ContentType>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContent();
  }, [contentType]);

  const fetchContent = async () => {
    setLoading(true);
    // Provide mock lists
    setTimeout(() => {
      setPosts(MOCK_POSTS);
      setComments(MOCK_COMMENTS);
      setLoading(false);
    }, 200);
  };

  const handleDeletePost = async (postId: number) => {
    alert('Moderation API is not included in this PR.');
  };

  const handleDeleteComment = async (commentId: number) => {
    alert('Moderation API is not included in this PR.');
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComments = comments.filter(comment =>
    comment.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setContentType('posts')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
          style={{
            backgroundColor: contentType === 'posts'
              ? 'var(--forum-default-active-bg)'
              : 'var(--forum-default-bg)',
            color: contentType === 'posts'
              ? 'var(--forum-default-active-text)'
              : 'var(--forum-default-text)'
          }}
        >
          <Article size={20} />
          Posts
        </button>
        <button
          onClick={() => setContentType('comments')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
          style={{
            backgroundColor: contentType === 'comments'
              ? 'var(--forum-default-active-bg)'
              : 'var(--forum-default-bg)',
            color: contentType === 'comments'
              ? 'var(--forum-default-active-text)'
              : 'var(--forum-default-text)'
          }}
        >
          <ChatCircle size={20} />
          Comments
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder={`Search ${contentType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {contentType === 'posts' ? (
          filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Article size={48} className="mx-auto mb-4 opacity-50" />
              <p>No posts found</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.body}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => window.open(`/forum/post/${post.id}`, '_blank')}
                      className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                      title="View post"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete post"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <span>By: {post.author.username}</span>
                  <span>•</span>
                  <span>{post.likesCount} likes</span>
                  <span>•</span>
                  <span>{post.commentsCount} comments</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          filteredComments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ChatCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No comments found</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      On: <span className="font-medium text-gray-900 dark:text-white">{comment.post.title}</span>
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {comment.body}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-4"
                    title="Delete comment"
                  >
                    <Trash size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <span>By: {comment.author.username}</span>
                  <span>•</span>
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ContentModeration;
