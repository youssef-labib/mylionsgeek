export default function CommentImageLightbox({ openImageUrl, onClose }) {
    if (!openImageUrl) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={onClose}
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
                        onClose();
                    }}
                    aria-label="Close image"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
