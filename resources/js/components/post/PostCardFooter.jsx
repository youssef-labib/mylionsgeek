import axios from 'axios';
import { useEffect, useState } from 'react';
import { subscribeToChannel } from '../../lib/ablyManager';
import LikesModal from './LikesModal';

const PostCardFooter = ({ user, post, takeToUserProfile, PostModal = true, onCommentPress, variant = 'default' }) => {
    const isFacebook = variant === 'facebook';
    const [likesCountMap, setLikesCountMap] = useState({});
    const [commentsCountMap, setCommentsCountMap] = useState({});
    const [likedPostIds, setLikedPostIds] = useState([]);
    const [likesOpenFor, setLikesOpenFor] = useState(null);

    // Initialize counts and liked state on mount
    useEffect(() => {
        setLikesCountMap((prev) => ({ ...prev, [post.id]: post.likes_count }));
        setCommentsCountMap((prev) => ({ ...prev, [post.id]: post.comments_count }));

        if (post.is_liked_by_current_user) {
            setLikedPostIds((prev) => [...new Set([...prev, post.id])]);
        }
    }, [post.id, post.likes_count, post.comments_count, post.is_liked_by_current_user]);

    useEffect(() => {
        if (!post?.id) return;

        let mounted = true;
        let unsubscribe = null;

        const setup = async () => {
            // Only use Ably real-time updates, no polling
            unsubscribe = await subscribeToChannel('feed:global', 'post-stats-updated', (data) => {
                if (!mounted) return;
                if (!data || Number(data.post_id) !== Number(post.id)) return;

                if (typeof data.likes_count === 'number') {
                    setLikesCountMap((prev) => ({ ...prev, [post.id]: data.likes_count }));
                }
                if (typeof data.comments_count === 'number') {
                    setCommentsCountMap((prev) => ({ ...prev, [post.id]: data.comments_count }));
                }
            });
        };

        setup();

        return () => {
            mounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [post.id]);

    const toggleLike = async (postId) => {
        try {
            const response = await axios.post(`/posts/likes/${postId}`);
            const { liked, likes_count } = response.data;

            // Update likedPostIds based on backend response
            setLikedPostIds((prev) => (liked ? [...new Set([...prev, postId])] : prev.filter((id) => id !== postId)));

            setLikesCountMap((prev) => ({
                ...prev,
                [postId]: likes_count,
            }));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleCommentAdded = (postId) => {
        setCommentsCountMap((prev) => ({
            ...prev,
            [postId]: (prev[postId] || 0) + 1,
        }));
    };

    const handleCommentRemoved = (postId) => {
        setCommentsCountMap((prev) => ({
            ...prev,
            [postId]: Math.max((prev[postId] || 1) - 1, 0),
        }));
    };

    const isLiked = likedPostIds.includes(post?.id);
    const likeCount = likesCountMap[post?.id] ?? 0;
    const commentCount = commentsCountMap[post?.id] ?? 0;

    return (
        <>
            {/* Counts */}
            <div
                className={
                    isFacebook
                        ? 'flex items-center justify-between border-b border-border/60 px-4 py-2 text-[13px] text-muted-foreground dark:border-white/10 dark:text-light/60'
                        : `flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-dark_gray/70 ${!PostModal && 'dark:bg-dark'}`
                }
            >
                <div
                    className={`cursor-pointer hover:underline ${isFacebook ? '' : 'text-xs text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setLikesOpenFor(post?.id)}
                >
                    {likeCount} {isFacebook ? 'likes' : 'Likes'}
                </div>
                <div
                    onClick={() => onCommentPress?.()}
                    className="cursor-pointer text-xs text-gray-600 hover:underline dark:text-gray-400"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCommentPress?.();
                        }
                    }}
                >
                    {commentCount} {isFacebook ? 'comments' : 'Comments'}
                </div>
            </div>

            {/* Buttons */}
            <div
                className={
                    isFacebook
                        ? 'flex items-stretch '
                        : `flex items-center justify-around rounded-b-lg px-2 py-2 shadow-sm ${!PostModal ? 'bg-light dark:bg-dark' : ''}`
                }
            >
                {/* Like Button */}
                <button
                    type="button"
                    onClick={() => toggleLike(post?.id)}
                    className={
                        isFacebook
                            ? `flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 text-[15px] font-semibold transition-colors hover:bg-muted/50 dark:hover:bg-white/5 ${
                                  isLiked ? 'text-alpha' : 'text-beta dark:text-light'
                              }`
                            : `flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-colors duration-200 ${
                                  isLiked ? 'text-alpha' : 'text-beta hover:text-alpha dark:text-light'
                              }`
                    }
                >
                    <svg
                        className={`h-5 w-5 ${isLiked ? 'text-alpha' : 'text-beta dark:text-light'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                    </svg>
                    <span className={isFacebook ? 'font-semibold' : 'text-sm font-semibold'}>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                {/* Comment Button */}
                <button
                    type="button"
                    className={
                        isFacebook
                            ? 'flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 text-[15px] font-semibold text-beta transition-colors hover:bg-muted/50 dark:text-light dark:hover:bg-white/5'
                            : 'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-beta transition-colors duration-200 hover:bg-dark_gray/10 hover:text-beta dark:text-light dark:hover:bg-light/10'
                    }
                    onClick={() => onCommentPress?.()}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <span className={isFacebook ? 'font-semibold' : 'text-sm font-semibold'}>Comment</span>
                </button>
            </div>

            {/* Likes modal */}
            <LikesModal postId={likesOpenFor} open={!!likesOpenFor} onClose={() => setLikesOpenFor(null)} takeToUserProfile={takeToUserProfile} />
        </>
    );
};

export default PostCardFooter;
