import { timeAgo } from '../../lib/utils';
import DeleteModal from '../DeleteModal';
import CommentImageLightbox from './comments/CommentImageLightbox';
import { getListScrollBaseClass, getListWrapperClass, getSectionShellClass } from './comments/commentSectionClassNames';
import PostCommentComposer from './comments/PostCommentComposer';
import PostCommentsHeader from './comments/PostCommentsHeader';
import PostCommentsThread from './comments/PostCommentsThread';
import { usePostCommentsSection } from './comments/usePostCommentsSection';

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
    const listScrollClass = getListScrollBaseClass(isFacebookEmbed, embedded);
    const listWrapperClassName = getListWrapperClass(isFacebookEmbed, embedded, listScrollClass);

    const {
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
    } = usePostCommentsSection({
        postId,
        enabled,
        embedded,
        onCommentAdded,
        onCommentRemoved,
    });

    if (!enabled || !postId) {
        return null;
    }

    return (
        <>
            <CommentImageLightbox openImageUrl={openImageUrl} onClose={() => setOpenImageUrl(null)} />

            <div id="post-comments-section" className={getSectionShellClass(isFacebookEmbed, embedded)}>
                <PostCommentsHeader isFacebookEmbed={isFacebookEmbed} embedded={embedded} />

                <PostCommentComposer
                    isFacebookEmbed={isFacebookEmbed}
                    embedded={embedded}
                    authUser={auth.user}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    newCommentImage={newCommentImage}
                    newCommentImagePreview={newCommentImagePreview}
                    clearNewCommentImage={clearNewCommentImage}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />

                <PostCommentsThread
                    listWrapperClassName={listWrapperClassName}
                    loading={loading}
                    comments={comments}
                    commentsEndRef={commentsEndRef}
                    isFacebookEmbed={isFacebookEmbed}
                    currentUserId={auth.user.id}
                    takeToUserProfile={takeToUserProfile}
                    timeAgo={timeAgo}
                    openUpdatedCommentId={openUpdatedComment}
                    onStartEdit={startEdit}
                    onRequestDelete={requestDelete}
                    onSaveEdit={handleUpdatedComment}
                    editedComment={editedComment}
                    setEditedComment={setEditedComment}
                    editedCommentImagePreview={editedCommentImagePreview}
                    editedRemoveImage={editedRemoveImage}
                    compressingEditedImage={compressingEditedImage}
                    onEditedFileInputChange={handleEditedFileInputChange}
                    onRemoveEditedPreview={removeEditedPreview}
                    onMarkRemoveExistingImage={removeEditedPreview}
                    expandedCommentIds={expandedCommentIds}
                    onToggleExpandComment={toggleExpandComment}
                    onOpenCommentImage={setOpenImageUrl}
                    onToggleLike={toggleCommentLike}
                />
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
