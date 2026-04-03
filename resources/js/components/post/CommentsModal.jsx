import PostCommentsSection from './PostCommentsSection';

/**
 * Standalone comments sheet (overlay). Prefer embedding {@link PostCommentsSection} in PostModal for the feed.
 */
export default function CommentsModal({ open, onClose, postId, onCommentAdded, onCommentRemoved, takeToUserProfile }) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close comments"
            />
            <div
                className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl p-1"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 rounded-full p-1 text-2xl font-black text-alpha opacity-80 transition hover:opacity-100"
                    aria-label="Close comments"
                >
                    ×
                </button>
                <PostCommentsSection
                    postId={postId}
                    enabled={open}
                    embedded={false}
                    onCommentAdded={onCommentAdded}
                    onCommentRemoved={onCommentRemoved}
                    takeToUserProfile={takeToUserProfile}
                />
            </div>
        </div>
    );
}
