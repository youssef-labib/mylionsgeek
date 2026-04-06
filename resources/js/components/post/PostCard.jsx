import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { timeAgo } from '../../lib/utils';
import { helpers } from '../utils/helpers';
import PostCardItem from './PostCardItem';

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
            {postList?.map((p, index) => (
                <PostCardItem
                    key={p.id ?? index}
                    post={p}
                    authUser={auth.user}
                    user={user}
                    isDeleting={deletingPostId === p.id}
                    takeToUserProfile={takeToUserProfile}
                    timeAgo={timeAgo}
                    onDeletePost={handleDeletePost}
                    addOrRemoveFollow={addOrRemoveFollow}
                    openModalPostId={openModalPostId}
                    onConsumedHashModal={onConsumedHashModal}
                    openModalForComments={openCommentsForPostId === p.id}
                    onConsumedCommentOpen={clearCommentOpenIntent}
                    onCommentPress={() => setOpenCommentsForPostId(p.id)}
                />
            ))}
        </>
    );
};

export default PostCard;
