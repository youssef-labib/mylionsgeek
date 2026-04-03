import { Avatar } from '@/components/ui/avatar';
import { getComposerFormClass } from './commentSectionClassNames';

export default function PostCommentComposer({
    isFacebookEmbed,
    embedded,
    authUser,
    newComment,
    setNewComment,
    newCommentImage,
    newCommentImagePreview,
    clearNewCommentImage,
    onSubmit,
    submitting,
    compressingImage,
}) {
    return (
        <form onSubmit={onSubmit} className={getComposerFormClass(isFacebookEmbed, embedded)}>
            <Avatar
                className={isFacebookEmbed ? 'h-8 w-8 flex-shrink-0' : 'h-11 w-11 flex-shrink-0'}
                image={authUser.image}
                name={authUser.name}
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
                            onClick={clearNewCommentImage}
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
    );
}
