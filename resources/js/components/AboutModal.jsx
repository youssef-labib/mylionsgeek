import InputError from '@/components/input-error';
import { router, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { helpers } from './utils/helpers';

export default function AboutModal({ onOpen, onOpenChange, user }) {
    const { stopScrolling } = helpers();
    const [error, setError] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        about: user?.about || '',
    });
    const [charCount, setCharCount] = useState(data.about.length);

    useEffect(() => {
        stopScrolling(onOpen);
        return () => stopScrolling(false);
    }, [onOpen]);

    // Update form data when user changes
    useEffect(() => {
        setData('about', user?.about || '');
        setCharCount(user?.about?.length || 0);
    }, [user?.about]);

    //! update about
    const updateAbout = () => {
        try {
            router.post(`/students/about/${user?.id}`, data, {
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (error) => {
                    //console.log('About update errors:', errors);
                    setError(error);
                    console.log(error);
                },
            });
        } catch (error) {
            //console.log(error);
        }
    };
    const maxChars = 500;

    const handleAboutChange = (e) => {
        const text = e.target.value;
        setData('about', text);
        setCharCount(text.length);
    };

    return (
        <>
            <div
                onClick={() => onOpenChange(false)}
                className="fixed inset-0 z-30 h-full bg-black/50 backdrop-blur-md transition-all duration-300 dark:bg-black/70"
            ></div>
            <div className="fixed inset-0 top-1/2 z-50 mx-auto flex h-fit w-[70%] -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-light dark:bg-beta">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-300 bg-light px-6 py-4 dark:border-dark_gray dark:bg-beta">
                    <h2 className="text-xl font-semibold text-beta dark:text-light">Edit about</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer text-gray-600 transition hover:text-beta dark:text-gray-400 dark:hover:text-light"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-light px-6 py-6 dark:bg-beta">
                    {/* Helper Text */}
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        You can write about your years of experience, industry, or skills. People also talk about their achievements or previous job
                        experiences.
                    </p>

                    {/* About Textarea */}
                    <div className="mb-2">
                        <textarea
                            value={data.about}
                            onChange={handleAboutChange}
                            className={`w-full resize-none rounded-md border p-3 text-sm outline-none ${
                                errors.about
                                    ? 'border-error focus:border-error focus:ring-error'
                                    : 'border-gray-300 focus:border-alpha focus:ring-alpha dark:border-dark_gray'
                            } bg-white text-beta dark:bg-dark dark:text-light`}
                            rows="10"
                            placeholder="Write about yourself..."
                        />
                        <InputError message={error?.about} className="mt-1" />
                    </div>

                    {/* Character Count */}
                    <div className="mb-4 text-right text-sm text-gray-600 dark:text-gray-400">
                        {charCount}/{maxChars}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-300 bg-light px-6 py-4 dark:border-dark_gray dark:bg-beta">
                    {/* <button
                        className="px-6 py-2 bg-alpha text-black rounded-lg hover:bg-alpha/90 transition font-medium disabled"
                        >
                        Save
                        </button> */}
                    <button
                        onClick={updateAbout}
                        type="submit"
                        disabled={processing}
                        className={`cursor-pointer rounded-lg px-6 py-2 font-semibold transition ${
                            processing ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-alpha text-black hover:opacity-90'
                        } `}
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );
}
