import { Avatar } from '@/components/ui/avatar';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { CheckIcon, Paperclip, Pencil, ThumbsUp, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { subscribeToChannel } from '../../lib/ablyManager';
import { timeAgo } from '../../lib/utils';
import DeleteModal from '../DeleteModal';

function PostCommentsSection({
    postId,
    enabled,
    embedded = false,
    variant = 'default',
    onCommentAdded,
    onCommentRemoved,
    takeToUserProfile,
}) {
    const isFacebookEmbed = embedded && variant === 'facebook';
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newCommentImage, setNewCommentImage] = useState(null);
    const [newCommentImagePreview, setNewCommentImagePreview] = useState(null);
    const [compressingImage, setCompressingImage] = useState(false);
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
            // Reset when closed
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

    // ✅ Handle new comment submission
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

            // Add new comment locally
            setComments((prev) => [...prev, res.data]);
            setNewComment('');
            setNewCommentImage(null);
            setNewCommentImagePreview(null);

            // Notify parent (PostCard) to increment count
            if (typeof onCommentAdded === 'function') {
                onCommentAdded(postId);
            }

            // Scroll to the new comment
            setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
        } catch (error) {
            console.error('Failed to add comment:', error);
            // //alert("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Handle comment deletion
    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`/posts/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c.id !== commentId));

            // Notify parent to decrement count
            if (typeof onCommentRemoved === 'function') {
                onCommentRemoved(postId);
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
            //alert("Failed to delete comment");
        }
    };

    //Handle comment update (optional)
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
            //alert('success')
        } catch (error) {
            console.error('failed to update : ', error);
            //alert('failed to update comment')
        }
    };

    if (!enabled || !postId) {
        return null;
    }

    const listScrollClass = isFacebookEmbed
        ? 'space-y-2 py-1'
        : embedded
          ? 'space-y-4 py-2'
          : 'scrollbar-thin scrollbar-thumb-alpha/30 dark:scrollbar-thumb-alpha/20 scrollbar-track-transparent flex-1 space-y-4 overflow-y-auto py-4';

    return (
        <>
            {openImageUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    onClick={() => setOpenImageUrl(null)}
                    role="button"
                    tabIndex={-1}
                >
                    <div className="absolute inset-0 bg-black/80" />
                    <div className="relative max-h-[90vh] max-w-[95vw]">
                        <img
                            src={openImageUrl}
                            alt="Comment"
                            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            type="button"
                            className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenImageUrl(null);
                            }}
                            aria-label="Close image"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div
                id="post-comments-section"
                className={
                    isFacebookEmbed
                        ? 'border-t border-border/50 px-3 pt-3 sm:px-4 dark:border-white/10'
                        : embedded
                          ? 'border-t border-beta/10 px-3 pt-4 sm:px-4 dark:border-light/10'
                          : 'relative mx-auto flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-alpha/30 bg-white px-3 shadow-2xl dark:border-alpha/20 dark:bg-[#1b1d20] sm:px-4'
                }
            >
                <div
                    className={
                        isFacebookEmbed
                            ? 'mb-2'
                            : embedded
                              ? 'mb-3 border-b border-beta/10 pb-2 dark:border-light/10'
                              : 'border-b border-alpha/30 bg-gradient-to-r from-alpha/10 to-alpha/20 pt-6 pb-3 dark:border-alpha/30'
                    }
                >
                    <h2
                        className={
                            isFacebookEmbed
                                ? 'text-xs font-semibold tracking-wide text-muted-foreground uppercase dark:text-light/50'
                                : embedded
                                  ? 'text-sm font-semibold text-beta dark:text-light'
                                  : 'text-lg font-bold tracking-wide text-alpha uppercase sm:text-base'
                        }
                    >
                        Comments
                    </h2>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className={
                        isFacebookEmbed
                            ? 'mb-3 flex items-end gap-2 border-b border-border/50 pb-3 dark:border-white/10'
                            : embedded
                              ? 'mb-3 flex items-end gap-3 border-b border-beta/10 bg-light/80 pb-3 dark:border-light/10 dark:bg-dark/30'
                              : 'flex items-end gap-3 border-b border-alpha/20 bg-neutral-100/60 py-4 dark:bg-[#1b1d20]'
                    }
                >
                    <Avatar
                        className={isFacebookEmbed ? 'h-8 w-8 flex-shrink-0' : 'h-11 w-11 flex-shrink-0'}
                        image={auth.user.image}
                        name={auth.name}
                        width="w-11"
                        height="h-11"
                        onlineCircleClass="hidden"
                    />

                    <div className="flex flex-1 flex-col gap-2">
                        {newCommentImagePreview && (
                            <div className="relative">
                                <img
                                    src={newCommentImagePreview}
                                    alt="Selected"
                                    className="max-h-48 w-full rounded-xl border border-alpha/20 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewCommentImage(null);
                                        setNewCommentImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                                    aria-label="Remove image"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    autoFocus={!embedded}
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={submitting}
                                    maxLength={2000}
                                    className={
                                        isFacebookEmbed
                                            ? 'w-full rounded-full border border-border/60 bg-muted/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-alpha/50 focus:ring-1 focus:ring-alpha focus:outline-none dark:border-white/15 dark:bg-white/10 dark:text-light dark:placeholder:text-light/45'
                                            : 'w-full rounded-lg border border-alpha/40 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder-gray-400 shadow-sm transition focus:border-alpha/40 focus:ring-2 focus:ring-alpha focus:outline-0 dark:bg-dark dark:text-neutral-100 dark:placeholder-gray-500'
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || compressingImage || (!newComment.trim() && !newCommentImage)}
                                className="rounded-lg bg-alpha px-5 py-2.5 font-semibold text-black shadow-md transition-all duration-200 hover:bg-yellow-300 hover:shadow-lg focus:ring-2 focus:ring-alpha/50 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    </div>
                                ) : compressingImage ? (
                                    <div className="flex items-center justify-center">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    </div>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <div
                    className={
                        isFacebookEmbed
                            ? `${listScrollClass} max-h-[min(50vh,420px)] overflow-y-auto sm:max-h-[min(55vh,480px)]`
                            : embedded
                              ? `${listScrollClass} max-h-[min(50vh,420px)] overflow-y-auto`
                              : `${listScrollClass} min-h-0`
                    }
                >
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-alpha/30 border-t-alpha" />
                                    <p className="text-sm text-alpha">Loading comments...</p>
                                </div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-alpha/10">
                                    <svg className="h-7 w-7 text-alpha/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-gray-500 italic dark:text-gray-400">No comments yet.</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Be the first to start the discussion!</p>
                            </div>
                        ) : (
                            comments.map((c) => (
                                <div
                                    key={c.id}
                                    className={
                                        isFacebookEmbed
                                            ? 'group flex gap-2 rounded-lg bg-muted/40 px-2 py-1.5 animate-in fade-in dark:bg-white/[0.06]'
                                            : 'group flex gap-3 rounded-2xl border border-alpha/20 bg-neutral-50 px-4 py-2 animate-in fade-in slide-in-from-left-2 dark:bg-dark'
                                    }
                                >
                                    <Link href={takeToUserProfile(c)}>
                                        <Avatar
                                            className="h-11 w-11 flex-shrink-0"
                                            image={c.user_image}
                                            name={c.user_name}
                                            width="w-11"
                                            height="h-11"
                                            lastActivity={c.user_lastActivity || null}
                                            onlineCircleClass="hidden"
                                        />
                                    </Link>

                                    <div
                                        className={
                                            isFacebookEmbed
                                                ? 'w-[70%] flex-1 px-2 py-0.5'
                                                : 'w-[70%] flex-1 px-3 py-2.5 shadow-sm transition duration-200 hover:shadow-md'
                                        }
                                    >
                                        <div className="mb-1 flex justify-between">
                                            <div className="flex flex-col pb-2">
                                                <Link
                                                    href={takeToUserProfile(c)}
                                                    className={
                                                        isFacebookEmbed
                                                            ? 'truncate text-[13px] font-semibold text-beta hover:underline dark:text-light'
                                                            : 'truncate text-sm font-bold text-white dark:text-yellow-300'
                                                    }
                                                >
                                                    {c.user_name || 'User'}
                                                </Link>
                                                <span className="text-[0.7rem] text-gray-500 dark:text-gray-400">{timeAgo(c.created_at)}</span>
                                            </div>
                                            {auth.user.id === c.user_id && (
                                                <>
                                                    {openUpdatedComment !== c.id && (
                                                        <>
                                                            <div className="hidden items-start gap-3 pt-1 group-hover:flex">
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenUpdatedComment(c.id);
                                                                        setEditedComment(c.comment);
                                                                        setEditedRemoveImage(false);
                                                                        setEditedCommentImage(null);
                                                                        setEditedCommentImagePreview(
                                                                            c.comment_image ? `/storage/img/comments/${c.comment_image}` : null,
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer text-alpha"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setDeletedCommentId(c.id);
                                                                        setOpenDelete(true);
                                                                    }}
                                                                    className="cursor-pointer text-error"
                                                                >
                                                                    <Trash size={15} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {openUpdatedComment === c.id && (
                                                        <button
                                                            onClick={() => {
                                                                handleUpdatedComment(c.id, editedComment); // optional
                                                            }}
                                                            className="cursor-pointer text-alpha"
                                                        >
                                                            <CheckIcon size={20} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* ✅ Edit only the selected comment */}
                                        {openUpdatedComment === c.id ? (
                                            <div className="w-full space-y-2">
                                                <textarea
                                                    className="min-h-[80px] w-full resize-none rounded-lg border border-alpha/20 bg-white p-2 text-sm leading-snug break-words whitespace-pre-wrap text-neutral-800 outline-2 dark:bg-dark/50 dark:text-neutral-100"
                                                    value={editedComment}
                                                    onChange={(e) => setEditedComment(e.target.value)}
                                                    autoFocus
                                                />

                                                {editedCommentImagePreview && !editedRemoveImage && (
                                                    <div className="relative">
                                                        <img
                                                            src={editedCommentImagePreview}
                                                            alt="Selected"
                                                            className="max-h-48 w-full rounded-xl border border-alpha/20 object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditedRemoveImage(true);
                                                                setEditedCommentImage(null);
                                                                setEditedCommentImagePreview(null);
                                                            }}
                                                            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                                                            aria-label="Remove image"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer rounded-lg border border-alpha/30 bg-white px-3 py-2 text-sm select-none dark:bg-dark">
                                                        <span className="inline-flex items-center gap-2">
                                                            <Paperclip size={16} />
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                                            className="hidden"
                                                            disabled={compressingEditedImage}
                                                            onChange={async (e) => {
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
                                                            }}
                                                        />
                                                    </label>

                                                    {c.comment_image && !editedRemoveImage && (
                                                        <button
                                                            type="button"
                                                            className="text-xs font-semibold text-error hover:underline"
                                                            onClick={() => {
                                                                setEditedRemoveImage(true);
                                                                setEditedCommentImage(null);
                                                                setEditedCommentImagePreview(null);
                                                            }}
                                                        >
                                                            Remove image
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {(() => {
                                                    const text = c.comment || '';
                                                    const limit = 150;
                                                    const isLong = text.length > limit;
                                                    const isExpanded = expandedCommentIds.includes(c.id);
                                                    const displayText = isLong && !isExpanded ? `${text.slice(0, limit)}...` : text;

                                                    return (
                                                        <div className="w-full">
                                                            <p className="w-full text-sm leading-snug break-words whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">
                                                                {displayText}
                                                            </p>
                                                            {isLong && (
                                                                <button
                                                                    type="button"
                                                                    className="mt-1 text-xs font-semibold text-alpha hover:underline"
                                                                    onClick={() => {
                                                                        setExpandedCommentIds((prev) => {
                                                                            const has = prev.includes(c.id);
                                                                            if (has) return prev.filter((id) => id !== c.id);
                                                                            return [...prev, c.id];
                                                                        });
                                                                    }}
                                                                >
                                                                    {isExpanded ? 'See less' : 'See more'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                {c.comment_image && (
                                                    <div className="mt-2">
                                                        <button
                                                            type="button"
                                                            className="block"
                                                            onClick={() => setOpenImageUrl(`/storage/img/comments/${c.comment_image}`)}
                                                        >
                                                            <img
                                                                src={`/storage/img/comments/${c.comment_image}`}
                                                                alt="Comment"
                                                                className="max-h-64 w-full cursor-zoom-in rounded-2xl border border-alpha/20 object-cover sm:max-w-[320px]"
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCommentLike(c.id)}
                                                        className={
                                                            `inline-flex items-center gap-2 text-xs font-semibold ` +
                                                            (c.liked ? 'text-alpha' : 'text-neutral-500 dark:text-neutral-300')
                                                        }
                                                    >
                                                        <ThumbsUp size={14} />
                                                        Like
                                                    </button>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {Number(c.likes_count || 0)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>
            </div>

            {openDelete && (
                <DeleteModal
                    open={openDelete}
                    onOpenChange={setOpenDelete}
                    onConfirm={() => handleDeleteComment(deletedCommentId)}
                    description="This action cannot be undone. This will permanently delete this Comment."
                    title="Delete Comment"
                />
            )}
        </>
    );
}

export default PostCommentsSection;
