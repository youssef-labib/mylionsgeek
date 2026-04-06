import PostCommentItem from './PostCommentItem';

export default function PostCommentsThread({
    listWrapperClassName,
    loading,
    comments,
    commentsEndRef,
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
    onEditedFileInputChange,
    onRemoveEditedPreview,
    onMarkRemoveExistingImage,
    expandedCommentIds,
    onToggleExpandComment,
    onOpenCommentImage,
    onToggleLike,
}) {
    return (
        <div className={listWrapperClassName}>
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
                    <PostCommentItem
                        key={c.id}
                        c={c}
                        isFacebookEmbed={isFacebookEmbed}
                        currentUserId={currentUserId}
                        takeToUserProfile={takeToUserProfile}
                        timeAgo={timeAgo}
                        openUpdatedCommentId={openUpdatedCommentId}
                        onStartEdit={onStartEdit}
                        onRequestDelete={onRequestDelete}
                        onSaveEdit={onSaveEdit}
                        editedComment={editedComment}
                        setEditedComment={setEditedComment}
                        editedCommentImagePreview={editedCommentImagePreview}
                        editedRemoveImage={editedRemoveImage}
                        compressingEditedImage={compressingEditedImage}
                        onEditedFileInputChange={onEditedFileInputChange}
                        onRemoveEditedPreview={onRemoveEditedPreview}
                        onMarkRemoveExistingImage={onMarkRemoveExistingImage}
                        expandedCommentIds={expandedCommentIds}
                        onToggleExpandComment={onToggleExpandComment}
                        onOpenCommentImage={onOpenCommentImage}
                        onToggleLike={onToggleLike}
                    />
                ))
            )}
            <div ref={commentsEndRef} />
        </div>
    );
}
