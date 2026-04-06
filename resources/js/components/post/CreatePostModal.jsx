import InputError from '@/components/input-error';
import { Avatar } from '@/components/ui/avatar';
import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { helpers, MAX_POST_IMAGES } from '../utils/helpers';
import PostMediaGrid from './composer/PostMediaGrid';
import PostMediaPicker from './composer/PostMediaPicker';
import PostModalShell from './composer/PostModalShell';
import PostTextarea from './composer/PostTextarea';

const CreatePostModal = ({ onOpenChange, user }) => {
    const { stopScrolling, buildImageEntries, revokePreviewUrls, createImageRemovalHandler } = helpers();
    const [selectedImages, setSelectedImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');
    const imagesRef = useRef([]);

    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionResults, setMentionResults] = useState([]);
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionPosition, setMentionPosition] = useState({ top: 0 });
    const mentionTimeoutRef = useRef(null);

    const form = useForm({
        description: '',
        images: [],
    });

    useEffect(() => {
        imagesRef.current = selectedImages;
    }, [selectedImages]);

    useEffect(() => {
        stopScrolling(true);
        return () => {
            stopScrolling(false);
            revokePreviewUrls(imagesRef.current);
        };
    }, []);

    const handleImagePreviews = async (event) => {
        const files = event.target.files;
        if (!files?.length || form.processing) return;
        setIsUploading(true);
        setLimitMessage('');

        try {
            const { entries, rejected } = await buildImageEntries(files, selectedImages.length);
            setSelectedImages((prev) => [...prev, ...entries]);
            if (rejected > 0) {
                setLimitMessage(`You can upload up to ${MAX_POST_IMAGES} images per post.`);
            }
        } catch (error) {
            console.error('Failed to process images', error);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const removeImage = useMemo(
        () =>
            createImageRemovalHandler({
                revokePreviewUrls,
                updateNewImages: setSelectedImages,
            }),
        [createImageRemovalHandler, revokePreviewUrls],
    );

    const resetForm = () => {
        revokePreviewUrls(imagesRef.current);
        setSelectedImages([]);
        setLimitMessage('');
        form.reset();
        form.clearErrors();
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (!canSubmit || form.processing || isUploading) return;

        form.transform((data) => ({
            ...data,
            images: selectedImages.map(({ file }) => file),
        }));

        form.post('/posts/store/post', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                onOpenChange(false);
            },
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    };

    const hasImages = selectedImages.length > 0;
    const canSubmit = !!form.data.description.trim() || hasImages;

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        form.setData('description', value);

        // Detect current word for @mention
        const selectionStart = e.target.selectionStart ?? value.length;
        const textUntilCursor = value.slice(0, selectionStart);
        const match = textUntilCursor.match(/@([A-Za-z0-9_]*)$/u);

        if (match) {
            const query = match[1] || '';
            setMentionQuery(query);
            setShowMentionList(true);

            // Approximate vertical position under the current line
            const linesUntilCursor = textUntilCursor.split('\n').length;
            const lineHeightPx = 22; // match textarea visual line height
            const verticalPaddingPx = 16; // textarea p-4 ≈ 16px
            const top = verticalPaddingPx + linesUntilCursor * lineHeightPx;
            setMentionPosition({ top });
        } else {
            setMentionQuery('');
            setShowMentionList(false);
            setMentionResults([]);
        }
    };

    // Fetch users for mention suggestions (students)
    useEffect(() => {
        if (!showMentionList) return;

        if (mentionTimeoutRef.current) {
            clearTimeout(mentionTimeoutRef.current);
        }

        if (!mentionQuery.trim()) {
            setMentionResults([]);
            return;
        }

        mentionTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(mentionQuery)}&type=students`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    setMentionResults([]);
                    return;
                }

                const data = await response.json();
                const users = Array.isArray(data?.results) ? data.results : [];
                setMentionResults(users);
            } catch (error) {
                console.error('Failed to search users for mentions:', error);
                setMentionResults([]);
            }
        }, 250);

        return () => {
            if (mentionTimeoutRef.current) {
                clearTimeout(mentionTimeoutRef.current);
            }
        };
    }, [mentionQuery, showMentionList]);

    const handleSelectMention = (user) => {
        const textarea = document.getElementById('create-post-textarea');
        const current = form.data.description || '';

        if (!textarea) {
            const sanitizedName = (user?.name || '').replace(/\s+/g, '');
            form.setData('description', `${current} @${sanitizedName} `);
        } else {
            const selectionStart = textarea.selectionStart ?? current.length;
            const selectionEnd = textarea.selectionEnd ?? current.length;
            const before = current.slice(0, selectionStart);
            const after = current.slice(selectionEnd);

            const match = before.match(/@([A-Za-z0-9_]*)$/u);
            const sanitizedName = (user?.name || '').replace(/\s+/g, '');
            const mentionText = `@${sanitizedName} `;

            let newBefore = before;
            if (match) {
                newBefore = before.slice(0, match.index) + mentionText;
            } else {
                newBefore = before + mentionText;
            }

            const nextValue = newBefore + after;
            form.setData('description', nextValue);

            // Restore cursor position after inserted mention
            requestAnimationFrame(() => {
                textarea.focus();
                const newCursorPos = newBefore.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            });
        }

        setShowMentionList(false);
        setMentionQuery('');
        setMentionResults([]);
    };

    return (
        <PostModalShell
            user={user}
            title="Create post"
            onClose={handleClose}
            showLoader={form.processing}
            loaderMessage="Publishing post..."
            footer={
                <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <PostMediaPicker id="create-post-media" onChange={handleImagePreviews} disabled={form.processing} />
                        <p className="text-xs text-[var(--color-dark_gray)] dark:text-[var(--color-light)]/60">
                            {selectedImages.length}/{MAX_POST_IMAGES} images selected
                        </p>
                    </div>
                    <button
                        disabled={!canSubmit || form.processing || isUploading}
                        onClick={handleSubmit}
                        className={`rounded-xl px-8 py-3 font-bold shadow-md transition-all duration-200 ${
                            canSubmit
                                ? 'bg-[var(--color-alpha)] text-[var(--color-beta)] hover:scale-105 active:scale-95'
                                : 'cursor-not-allowed bg-[var(--color-dark_gray)]/30 text-[var(--color-dark_gray)] opacity-60 dark:bg-[var(--color-light)]/10 dark:text-[var(--color-light)]/40'
                        }`}
                    >
                        {form.processing ? 'Posting...' : 'Post'}
                    </button>
                </div>
            }
        >
            <div className="relative">
                <PostTextarea
                    id="create-post-textarea"
                    value={form.data.description}
                    onChange={handleDescriptionChange}
                    placeholder="What do you want to talk about?"
                    disabled={form.processing}
                />
                {showMentionList && mentionResults.length > 0 && (
                    <div
                        className="absolute left-0 z-20 max-h-64 w-full overflow-auto rounded-xl border border-sidebar-border bg-light p-2 shadow-lg dark:bg-dark"
                        style={{ top: mentionPosition.top }}
                    >
                        {mentionResults.map((u) => {
                            const key = u.id ?? u.email ?? u.name;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleSelectMention(u)}
                                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-sm hover:bg-dark/5 dark:hover:bg-light/10"
                                >
                                    <Avatar
                                        name={u.name || ''}
                                        image={u.image || undefined}
                                        lastActivity={u.last_online || null}
                                        className="h-8 w-8"
                                        onlineCircleClass="w-2.5 h-2.5"
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate font-medium text-[var(--color-beta)] dark:text-[var(--color-light)]">
                                            {u.name}
                                        </span>
                                        {u.email && (
                                            <span className="truncate text-xs text-[var(--color-dark_gray)] dark:text-[var(--color-light)]/70">
                                                {u.email}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <InputError message={form.errors.description} />
            <PostMediaGrid images={selectedImages} onRemove={removeImage} isLoading={isUploading} />
            <InputError message={limitMessage || form.errors.images} />
        </PostModalShell>
    );
};

export default CreatePostModal;
