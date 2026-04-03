import { Avatar } from '@/components/ui/avatar';
import { Link } from '@inertiajs/react';
import { CheckIcon, Paperclip, Pencil, ThumbsUp, Trash } from 'lucide-react';

export default function PostCommentItem({
    c,
    isFacebookEmbed,
    currentUserId,
    takeToUserProfile,
    timeAgo,
    openUpdatedCommentId,
    onStartEdit,
    onRequestDelete,
    onSaveEdit,
    editedComment,
    setEditedComment,
    editedCommentImagePreview,
    editedRemoveImage,
    compressingEditedImage,
    onRemoveEditedPreview,
    onMarkRemoveExistingImage,
    expandedCommentIds,
    onToggleExpandComment,
    onOpenCommentImage,
    onToggleLike,
}) {
    const isOwner = currentUserId === c.user_id;
    const isEditing = openUpdatedCommentId === c.id;

    const text = c.comment || '';
    const limit = 150;
    const isLong = text.length > limit;
    const isExpanded = expandedCommentIds.includes(c.id);
    const displayText = isLong && !isExpanded ? `${text.slice(0, limit)}...` : text;

    return (
        <div
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
                    {isOwner && (
                        <>
                            {!isEditing && (
                                <div className="hidden items-start gap-3 pt-1 group-hover:flex">
                                    <button type="button" onClick={() => onStartEdit(c)} className="cursor-pointer text-alpha">
                                        <Pencil size={15} />
                                    </button>
                                    <button type="button" onClick={() => onRequestDelete(c)} className="cursor-pointer text-error">
                                        <Trash size={15} />
                                    </button>
                                </div>
                            )}

                            {isEditing && (
                                <button type="button" onClick={() => onSaveEdit(c.id)} className="cursor-pointer text-alpha">
                                    <CheckIcon size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {isEditing ? (
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
                                    onClick={onRemoveEditedPreview}
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
                                    onChange={onEditedFileInputChange}
                                />
                            </label>

                            {c.comment_image && !editedRemoveImage && (
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-error hover:underline"
                                    onClick={onMarkRemoveExistingImage}
                                >
                                    Remove image
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-full">
                            <p className="w-full text-sm leading-snug break-words whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">
                                {displayText}
                            </p>
                            {isLong && (
                                <button
                                    type="button"
                                    className="mt-1 text-xs font-semibold text-alpha hover:underline"
                                    onClick={() => onToggleExpandComment(c.id)}
                                >
                                    {isExpanded ? 'See less' : 'See more'}
                                </button>
                            )}
                        </div>
                        {c.comment_image && (
                            <div className="mt-2">
                                <button
                                    type="button"
                                    className="block"
                                    onClick={() => onOpenCommentImage(`/storage/img/comments/${c.comment_image}`)}
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
                                onClick={() => onToggleLike(c.id)}
                                className={
                                    `inline-flex items-center gap-2 text-xs font-semibold ` +
                                    (c.liked ? 'text-alpha' : 'text-neutral-500 dark:text-neutral-300')
                                }
                            >
                                <ThumbsUp size={14} />
                                Like
                            </button>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{Number(c.likes_count || 0)}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
