import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { Briefcase, ExternalLink, GithubIcon, InstagramIcon, LinkedinIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { helpers } from './utils/helpers';

const platformIcons = {
    instagram: InstagramIcon,
    linkedin: LinkedinIcon,
    behance: ExternalLink,
    github: GithubIcon,
    portfolio: Briefcase,
};

const platforms = [
    { value: 'instagram', label: 'Instagram', domains: ['instagram.com', 'instagr.am'] },
    { value: 'linkedin', label: 'LinkedIn', domains: ['linkedin.com'] },
    { value: 'portfolio', label: 'Portfolio', domains: [] }, // Portfolio doesn't require specific domains
    { value: 'behance', label: 'Behance', domains: ['behance.net'] },
    { value: 'github', label: 'GitHub', domains: ['github.com'] },
];

const CreateSocialLinkModal = ({ onOpen, onOpenChange, initialLink = null, availiblePlatfroms }) => {
    const { stopScrolling } = helpers();

    const isEdit = Boolean(initialLink?.id);

    const [validationError, setValidationError] = useState('');

    const { data, setData, processing, errors, reset, clearErrors, post, put } = useForm({
        title: initialLink?.title || '',
        url: initialLink?.url || '',
    });

    useEffect(() => {
        stopScrolling(onOpen);
        return () => stopScrolling(false);
    }, [onOpen, stopScrolling]);

    useEffect(() => {
        if (!onOpen) return;

        clearErrors();
        setValidationError('');
        setData({
            title: initialLink?.title || '',
            url: initialLink?.url || '',
        });

        return () => {
            reset();
            clearErrors();
            setValidationError('');
        };
    }, [onOpen, initialLink?.id, initialLink?.title, initialLink?.url, clearErrors, setData, reset]);

    const validateUrl = () => {
        if (!data.title || !data.url) return false;

        const platform = platforms.find((p) => p.value === data.title);
        if (!platform) return false;

        // Portfolio doesn't require domain validation
        if (platform.value === 'portfolio') {
            // Just check if it's a valid URL format
            try {
                new URL(data.url);
                setValidationError('');
                return true;
            } catch {
                setValidationError('Please enter a valid URL');
                return false;
            }
        }

        const urlLower = data.url.toLowerCase();
        const isValidDomain = platform.domains.some((domain) => urlLower.includes(domain));

        if (!isValidDomain) {
            setValidationError(`URL must contain ${platform.domains.join(' or ')}`);
            return false;
        }

        setValidationError('');
        return true;
    };

    const submit = () => {
        if (!validateUrl()) return;

        if (isEdit) {
            put(`/students/social-links/${initialLink.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                    clearErrors();
                    setValidationError('');
                },
            });
            return;
        }

        post('/students/social-links', {
            onSuccess: () => {
                onOpenChange(false);
                reset();
                clearErrors();
                setValidationError('');
            },
        });
    };

    return (
        <>
            <div
                onClick={() => onOpenChange(false)}
                className="fixed inset-0 z-30 h-full bg-black/50 backdrop-blur-md transition-all duration-300 dark:bg-black/70"
            />
            <div className="fixed inset-0 top-1/2 z-50 mx-auto flex h-fit w-[70%] -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-light sm:w-[520px] dark:bg-beta">
                <div className="max-h-[90vh] w-full overflow-y-auto rounded-lg bg-light shadow-2xl dark:bg-dark">
                    <div className="sticky top-0 flex items-center justify-between border-b border-beta/20 bg-light p-4 dark:border-light/10 dark:bg-dark">
                        <h2 className="text-xl font-semibold text-beta dark:text-light">{isEdit ? 'Edit link' : 'Add link'}</h2>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="cursor-pointer text-beta/60 transition-colors hover:text-beta dark:text-light/60 dark:hover:text-light"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 p-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">Platform*</label>
                            <select
                                name="title"
                                value={data.title}
                                onChange={(e) => {
                                    setData('title', e.target.value);
                                    setValidationError('');
                                }}
                                className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            >
                                <option value="">Select a platform</option>
                                {availiblePlatfroms.map((platform) => (
                                    <option key={platform.value} value={platform.value}>
                                        {platform.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.title} className="mt-1" />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-beta dark:text-light">URL*</label>
                            <input
                                type="url"
                                name="url"
                                value={data.url}
                                onChange={(e) => {
                                    setData('url', e.target.value);
                                    setValidationError('');
                                }}
                                placeholder={`https://example.com/username`}
                                className="w-full rounded border border-beta/30 bg-light px-3 py-2 text-beta placeholder:text-beta/50 focus:border-alpha focus:ring-1 focus:ring-alpha focus:outline-none dark:border-light/20 dark:bg-dark_gray dark:text-light dark:placeholder:text-light/50"
                            />
                            <InputError message={errors.url} className="mt-1" />
                            {validationError && <p className="mt-1 text-xs text-error">{validationError}</p>}
                        </div>
                    </div>

                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-beta/20 bg-light p-4 dark:border-light/10 dark:bg-dark">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="cursor-pointer rounded-full border border-beta/30 px-6 py-2 font-medium text-beta transition-colors hover:bg-beta/5 dark:border-light/30 dark:text-light dark:hover:bg-light/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={processing}
                            className="cursor-pointer rounded-full bg-alpha px-6 py-2 font-medium text-black transition-colors hover:bg-alpha/90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-black"
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateSocialLinkModal;
