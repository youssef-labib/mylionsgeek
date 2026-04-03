import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { timeAgo } from '../../lib/utils';
import { helpers } from '../utils/helpers';
import PostCardFooter from './PostCardFooter';
import PostCardHeader from './PostCardHeader';
import PostCardMainContent from './PostCardMainContent';

const PostCard = ({ user, posts, openModalPostId = null, onConsumedHashModal }) => {
    const { auth } = usePage().props;
    const { addOrRemoveFollow } = helpers();
    const [postList, setPostList] = useState(posts ?? []);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [openCommentsForPostId, setOpenCommentsForPostId] = useState(null);

    const clearCommentOpenIntent = useCallback(() => {
        setOpenCommentsForPostId(null);
    }, []);

    useEffect(() => {
        setPostList(posts ?? []);
    }, [posts]);

    const handlePostRemoved = useCallback((postId) => {
        if (!postId) {
            return null;
        }

        let snapshot = null;

        setPostList((prev) => {
            snapshot = prev;
            return prev.filter((post) => post.id !== postId);
        });

        return () => {
            if (!snapshot) {
                return;
            }

            setPostList((current) => {
                if (current.some((post) => post.id === postId)) {
                    return current;
                }

                return snapshot;
            });
        };
    }, []);

    const takeToUserProfile = (post) => {
        return '/students/' + post?.user_id;
    };

    const handleDeletePost = useCallback(
        (postId) => {
            if (!postId) {
                return Promise.resolve(false);
            }

            if (deletingPostId === postId) {
                return Promise.resolve(false);
            }

            const rollback = handlePostRemoved(postId);
            setDeletingPostId(postId);

            return new Promise((resolve, reject) => {
                try {
                    router.delete(`/posts/post/${postId}`, {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            resolve(true);
                        },
                        onError: (errors) => {
                            rollback?.();
                            reject(errors || new Error('Unable to delete post.'));
                        },
                        onFinish: () => {
                            setDeletingPostId((current) => (current === postId ? null : current));
                        },
                    });
                } catch (error) {
                    rollback?.();
                    setDeletingPostId((current) => (current === postId ? null : current));
                    reject(error);
                }
            });
        },
        [deletingPostId, handlePostRemoved],
    );

    return (
        <>
            {postList?.map((p, index) => {
                const isDeleting = deletingPostId === p.id;
                return (
                    <div key={p.id ?? index} className="relative mb-4 overflow-hidden rounded-lg bg-white shadow dark:bg-dark_gray">
                        {isDeleting && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-semibold text-dark dark:bg-dark/70 dark:text-light">
                                Deleting...
                            </div>
                        )}
                        {/* Post Header */}
                        <PostCardHeader
                            post={p}
                            user={auth.user}
                            takeUserProfile={takeToUserProfile}
                            timeAgo={timeAgo}
                            onDeletePost={handleDeletePost}
                            isDeleting={isDeleting}
                        />

                        {/* Post Content */}
                        <PostCardMainContent
                            post={p}
                            user={auth.user}
                            addOrRemoveFollow={addOrRemoveFollow}
                            timeAgo={timeAgo}
                            takeToUserProfile={takeToUserProfile}
                            openModalPostId={openModalPostId}
                            onConsumedHashModal={onConsumedHashModal}
                            openModalForComments={openCommentsForPostId === p.id}
                            onConsumedCommentOpen={clearCommentOpenIntent}
                        />

                        {/* post footer */}
                        <PostCardFooter
                            post={p}
                            user={auth.user}
                            takeToUserProfile={takeToUserProfile}
                            onCommentPress={() => setOpenCommentsForPostId(p.id)}
                        />
                    </div>
                );
            })}
        </>
    );
};

export default PostCard;
