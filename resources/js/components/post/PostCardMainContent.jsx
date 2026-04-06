import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { helpers } from '../utils/helpers';
import PostModal from './PostModal';

const PostCardMainContent = ({
    post,
    user,
    addOrRemoveFollow,
    timeAgo,
    takeToUserProfile,
    openModalPostId,
    onConsumedHashModal,
    openModalForComments,
    onConsumedCommentOpen,
}) => {
    const [openPostModal, setOpenPostModal] = useState(false);
    const [scrollToCommentsAfterOpen, setScrollToCommentsAfterOpen] = useState(false);
    const { resolvePostImageUrl } = helpers();
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const toggleDescription = (id) => {
        setExpandedDescriptions((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const hasMore = post?.description?.length > 120;
    const isExpanded = expandedDescriptions[post?.id];
    const displayText = hasMore && !isExpanded ? post.description.slice(0, 200) + '...' : post.description;

    useEffect(() => {
        if (openModalPostId != null && post?.id === openModalPostId) {
            setOpenPostModal(true);
        }
    }, [openModalPostId, post?.id]);

    useEffect(() => {
        if (openModalForComments && post?.id) {
            setOpenPostModal(true);
            setScrollToCommentsAfterOpen(true);
            onConsumedCommentOpen?.();
        }
    }, [openModalForComments, post?.id, onConsumedCommentOpen]);

    const handlePostModalOpenChange = (open) => {
        setOpenPostModal(open);
        if (!open) {
            setScrollToCommentsAfterOpen(false);
            if (openModalPostId != null && post?.id === openModalPostId) {
                onConsumedHashModal?.();
            }
        }
    };

    const renderDescriptionWithMentions = (text) => {
        if (!text) return null;

        const mentionUserIds = post?.mention_user_ids ?? {};

        const mentionRegex = /(@[A-Za-z0-9_]+)/g;
        const parts = text.split(mentionRegex);

        return parts.map((part, index) => {
            if (!part) {
                return null;
            }

            if (part.startsWith('@') && part.length > 1) {
                // Stored text is @SanitizedName; server sends token (lowercase) -> user id for /students/{id}
                const tokenKey = part.slice(1).toLowerCase();
                const resolvedId = mentionUserIds[tokenKey];

                if (resolvedId != null) {
                    return (
                        <Link
                            key={`${part}-${index}`}
                            href={`/students/${resolvedId}`}
                            className="text-alpha hover:underline"
                        >
                            {part}
                        </Link>
                    );
                }

                return (
                    <span key={`${part}-${index}`} className="text-alpha">
                        {part}
                    </span>
                );
            }

            return (
                <span key={index}>
                    {part}
                </span>
            );
        });
    };
    return (
        <>
            <div className="mt-3 px-4">
                {post?.description && (
                    <>
                        <p className="w-full overflow-hidden text-sm break-words whitespace-pre-wrap text-gray-800 dark:text-light">
                            {renderDescriptionWithMentions(displayText)}
                        </p>
                        {hasMore && (
                            <button
                                onClick={() => toggleDescription(post?.id)}
                                className="mt-1 text-sm text-dark/50 hover:underline dark:text-light/50"
                            >
                                {isExpanded ? 'See less' : 'See more'}
                            </button>
                        )}
                    </>
                )}
            </div>
            {post?.images?.length > 0 && (
                <div
                    onClick={() => setOpenPostModal(true)}
                    className={`relative mt-3 aspect-video w-full cursor-pointer gap-3 px-1 ${post.images.length == 2 ? 'flex' : 'flex flex-col'}`}
                >
                    {/* Top big image */}
                    <img
                        src={resolvePostImageUrl(post?.images[0]) ?? ''}
                        alt=""
                        className={`rounded-lg object-cover ${post.images.length <= 2 ? (post.images.length == 2 ? 'h-full w-1/2' : 'h-full w-full') : 'h-[70%] w-full'}`}
                    />

                    {/* Bottom small images */}
                    {post?.images.length > 1 && (
                        <div className={`flex gap-3 ${post.images.length == 2 ? 'h-full w-1/2' : 'h-[30%] w-full'}`}>
                            {post?.images.slice(1, 5).map((img, i) => (
                                <div
                                    key={i}
                                    className={`relative h-full ${post.images.length - 1 < 4 ? `w-1/${post?.images.slice(1, 5).length}` : `w-1/4`}`}
                                >
                                    <img src={resolvePostImageUrl(img) ?? ''} alt="" className="h-full w-full rounded-lg object-cover" />

                                    {/* If more than 5 images → show +X overlay */}
                                    {i === 3 && post?.images.length > 5 && (
                                        <div
                                            onClick={() => setOpenPostModal(true)}
                                            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-xl text-white"
                                        >
                                            +{post?.images.length - 5}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {openPostModal && (
                <PostModal
                    isOpen={openPostModal}
                    onOpenChange={handlePostModalOpenChange}
                    post={post}
                    displayText={displayText}
                    hasMore={hasMore}
                    isExpanded={isExpanded}
                    toggleDescription={toggleDescription}
                    timeAgo={timeAgo}
                    user={user}
                    addOrRemovFollow={addOrRemoveFollow}
                    takeToUserProfile={takeToUserProfile}
                    scrollToCommentsOnOpen={scrollToCommentsAfterOpen}
                    onScrollToCommentsConsumed={() => setScrollToCommentsAfterOpen(false)}
                />
            )}
        </>
    );
};

export default PostCardMainContent;
