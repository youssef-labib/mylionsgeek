import { usePage } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { useEffect, useRef, useState } from 'react';
import { subscribeToChannel } from '../../../lib/ablyManager';

export function usePostCommentsSection({
    postId,
    enabled,
    embedded,
    onCommentAdded,
    onCommentRemoved,
}) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newCommentImage, setNewCommentImage] = useState(null);
    const [newCommentImagePreview, setNewCommentImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openUpdatedComment, setOpenUpdatedComment] = useState(null);
    const [editedComment, setEditedComment] = useState('');
    const [editedCommentImage, setEditedCommentImage] = useState(null);
    const [editedCommentImagePreview, setEditedCommentImagePreview] = useState(null);
    const [editedRemoveImage, setEditedRemoveImage] = useState(false);
    const [compressingEditedImage, setCompressingEditedImage] = useState(false);
    const [deletedCommentId, setDeletedCommentId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [openImageUrl, setOpenImageUrl] = useState(null);
    const [expandedCommentIds, setExpandedCommentIds] = useState([]);
    const commentsEndRef = useRef(null);
    const { auth } = usePage().props;

    useEffect(() => {
        if (embedded || !enabled) {
            return;
        }
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [embedded, enabled]);

    const toggleCommentLike = async (commentId) => {
        try {
            const res = await axios.post(`/posts/comments/${commentId}/like`);
            const { likes_count, liked } = res?.data || {};
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? {
                              ...c,
                              likes_count: typeof likes_count === 'number' ? likes_count : c.likes_count,
                              liked: typeof liked === 'boolean' ? liked : c.liked,
                          }
                        : c,
                ),
            );
        } catch (error) {
            console.error('Failed to toggle comment like:', error);
        }
    };

    useEffect(() => {
        if (enabled && postId) {
            setLoading(true);
            axios
                .get(`/posts/comments/${postId}`)
                .then((res) => {
                    setComments(res.data.comments || []);
                    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
                })
                .catch((err) => console.error('Failed to fetch comments:', err))
                .finally(() => setLoading(false));
        } else {
            setComments([]);
            setNewComment('');
            setNewCommentImage(null);
            setNewCommentImagePreview(null);
            setOpenImageUrl(null);
            setExpandedCommentIds([]);
            setOpenUpdatedComment(null);
            setEditedComment('');
            setEditedCommentImage(null);
            setEditedCommentImagePreview(null);
            setEditedRemoveImage(false);
            setLoading(false);
        }
    }, [enabled, postId]);

    useEffect(() => {
        if (!enabled || !postId) return;

        let mounted = true;
        let unsubscribeLike = null;
        let unsubscribeCreated = null;
        let unsubscribeUpdated = null;
        let unsubscribeDeleted = null;
        let interval = null;

        const setup = async () => {
            const channelName = `feed:post:${postId}`;

            unsubscribeLike = await subscribeToChannel(channelName, 'comment-like-updated', (data) => {
                if (!mounted || !data) return;
                const commentId = Number(data.comment_id);
                if (!commentId) return;

                setComments((prev) =>
                    prev.map((c) =>
                        c.id === commentId
                            ? {
                                  ...c,
                                  likes_count: typeof data.likes_count === 'number' ? data.likes_count : c.likes_count,
                              }
                            : c,
                    ),
                );
            });

            unsubscribeCreated = await subscribeToChannel(channelName, 'comment-created', (data) => {
                if (!mounted || !data) return;
                setComments((prev) => {
                    const exists = prev.some((c) => Number(c.id) === Number(data.id));
                    if (exists) return prev;
                    return [...prev, data];
                });
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
            });

            unsubscribeUpdated = await subscribeToChannel(channelName, 'comment-updated', (data) => {
                if (!mounted || !data) return;
                const id = Number(data.id);
                if (!id) return;
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === id
                            ? {
                                  ...c,
                                  comment: typeof data.comment === 'string' ? data.comment : c.comment,
                                  comment_image: typeof data.comment_image !== 'undefined' ? data.comment_image : c.comment_image,
                              }
                            : c,
                    ),
                );
            });

            unsubscribeDeleted = await subscribeToChannel(channelName, 'comment-deleted', (data) => {
                if (!mounted || !data) return;
                const id = Number(data.comment_id);
                if (!id) return;
                setComments((prev) => prev.filter((c) => c.id !== id));
            });

            const anySubscribed = !!(unsubscribeLike || unsubscribeCreated || unsubscribeUpdated || unsubscribeDeleted);
            if (!anySubscribed) {
                interval = window.setInterval(async () => {
                    try {
                        const res = await axios.get(`/posts/comments/${postId}/stats`);
                        if (!mounted) return;
                        const stats = res?.data?.stats || {};

                        setComments((prev) =>
                            prev.map((c) => {
                                const s = stats?.[String(c.id)];
                                if (!s) return c;
                                return {
                                    ...c,
                                    likes_count: typeof s.likes_count === 'number' ? s.likes_count : c.likes_count,
                                    liked: typeof s.liked === 'boolean' ? s.liked : c.liked,
                                };
                            }),
                        );
                    } catch {
                        // ignore polling errors
                    }
                }, 5000);
            }
        };

        setup();

        return () => {
            mounted = false;
            if (typeof unsubscribeLike === 'function') unsubscribeLike();
            if (typeof unsubscribeCreated === 'function') unsubscribeCreated();
            if (typeof unsubscribeUpdated === 'function') unsubscribeUpdated();
            if (typeof unsubscribeDeleted === 'function') unsubscribeDeleted();
            if (interval) window.clearInterval(interval);
        };
    }, [enabled, postId]);

    useEffect(() => {
        if (!newCommentImage) {
            setNewCommentImagePreview(null);
            return;
        }

        const url = URL.createObjectURL(newCommentImage);
        setNewCommentImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [newCommentImage]);

    const clearNewCommentImage = () => {
        setNewCommentImage(null);
        setNewCommentImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && !newCommentImage) return;
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('comment', newComment.trim() || '');
            if (newCommentImage) {
                formData.append('image', newCommentImage);
            }

            const res = await axios.post(`/posts/comments/${postId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setComments((prev) => [...prev, res.data]);
            setNewComment('');
            setNewCommentImage(null);
            setNewCommentImagePreview(null);

            if (typeof onCommentAdded === 'function') {
                onCommentAdded(postId);
            }

            setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`/posts/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c.id !== commentId));

            if (typeof onCommentRemoved === 'function') {
                onCommentRemoved(postId);
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleUpdatedComment = async (commentId) => {
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('comment', editedComment);

            if (editedRemoveImage) {
                formData.append('remove_image', '1');
            }
            if (editedCommentImage) {
                formData.append('image', editedCommentImage);
            }

            const res = await axios.post(`/posts/comments/${commentId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updated = res?.data;

            setComments((prevComments) =>
                prevComments.map((comment) =>
                    comment.id === commentId
                        ? {
                              ...comment,
                              comment: updated?.comment ?? editedComment,
                              comment_image: updated?.comment_image ?? comment.comment_image,
                              likes_count: typeof updated?.likes_count === 'number' ? updated.likes_count : comment.likes_count,
                              liked: typeof updated?.liked === 'boolean' ? updated.liked : comment.liked,
                          }
                        : comment,
                ),
            );

            setOpenUpdatedComment(null);
            setEditedComment('');
            setEditedCommentImage(null);
            setEditedCommentImagePreview(null);
            setEditedRemoveImage(false);
        } catch (error) {
            console.error('failed to update : ', error);
        }
    };

    const removeEditedPreview = () => {
        setEditedRemoveImage(true);
        setEditedCommentImage(null);
        setEditedCommentImagePreview(null);
    };

    const handleEditedFileInputChange = async (e) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            setEditedCommentImage(null);
            return;
        }

        setCompressingEditedImage(true);
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1500,
                useWebWorker: true,
            });
            setEditedCommentImage(compressed);
            setEditedCommentImagePreview(URL.createObjectURL(compressed));
            setEditedRemoveImage(false);
        } catch {
            setEditedCommentImage(file);
            setEditedCommentImagePreview(URL.createObjectURL(file));
            setEditedRemoveImage(false);
        } finally {
            setCompressingEditedImage(false);
        }
    };

    const startEdit = (c) => {
        setOpenUpdatedComment(c.id);
        setEditedComment(c.comment);
        setEditedRemoveImage(false);
        setEditedCommentImage(null);
        setEditedCommentImagePreview(c.comment_image ? `/storage/img/comments/${c.comment_image}` : null);
    };

    const requestDelete = (c) => {
        setDeletedCommentId(c.id);
        setOpenDelete(true);
    };

    const toggleExpandComment = (commentId) => {
        setExpandedCommentIds((prev) => {
            const has = prev.includes(commentId);
            if (has) return prev.filter((id) => id !== commentId);
            return [...prev, commentId];
        });
    };

    return {
        auth,
        comments,
        loading,
        newComment,
        setNewComment,
        newCommentImage,
        newCommentImagePreview,
        clearNewCommentImage,
        handleSubmit,
        submitting,
        openDelete,
        setOpenDelete,
        deletedCommentId,
        handleDeleteComment,
        openUpdatedComment,
        editedComment,
        setEditedComment,
        editedCommentImagePreview,
        editedRemoveImage,
        compressingEditedImage,
        handleEditedFileInputChange,
        removeEditedPreview,
        handleUpdatedComment,
        expandedCommentIds,
        toggleExpandComment,
        openImageUrl,
        setOpenImageUrl,
        toggleCommentLike,
        commentsEndRef,
        startEdit,
        requestDelete,
    };
}
