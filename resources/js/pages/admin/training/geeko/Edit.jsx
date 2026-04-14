import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useState } from 'react';

export default function EditGeeko({ formation, geeko }) {
    const [previewImage, setPreviewImage] = useState(geeko.cover_image ? `/storage/${geeko.cover_image}` : null);

    const { data, setData, put, processing, errors } = useForm({
        title: geeko.title || '',
        description: geeko.description || '',
        time_limit: geeko.time_limit || 20,
        show_correct_answers: geeko.show_correct_answers ?? true,
        cover_image: null,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('cover_image', file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/training/${formation.id}/geeko/${geeko.id}`);
    };

    const goBack = () => {
        router.visit(`/training/${formation.id}/geeko/${geeko.id}`);
    };

    return (
        <AppLayout>
            <Head title={`Edit ${geeko.title} - ${formation.name}`} />

            <div className="min-h-screen bg-light p-6 dark:bg-dark">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={goBack} className="mb-4 flex items-center space-x-2 font-semibold text-alpha hover:text-alpha/80">
                        <ArrowLeft size={20} />
                        <span>Back to {geeko.title}</span>
                    </button>

                    <h1 className="text-4xl font-extrabold text-dark dark:text-light">Edit Geeko</h1>
                    <p className="mt-2 text-dark/70 dark:text-light/70">Update your Geeko game settings</p>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 dark:bg-dark">
                            <h2 className="mb-6 text-xl font-bold text-dark dark:text-light">Basic Information</h2>

                            {/* Title */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-semibold text-dark dark:text-light">Title *</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full rounded-lg border border-alpha/30 bg-light px-4 py-3 text-dark focus:border-alpha focus:ring-2 focus:ring-alpha/20 dark:bg-dark dark:text-light"
                                    placeholder="Enter a catchy title for your Geeko game"
                                    required
                                />
                                {errors.title && <p className="mt-1 text-sm text-error">{errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-semibold text-dark dark:text-light">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-alpha/30 bg-light px-4 py-3 text-dark focus:border-alpha focus:ring-2 focus:ring-alpha/20 dark:bg-dark dark:text-light"
                                    placeholder="Describe what this game is about (optional)"
                                />
                                {errors.description && <p className="mt-1 text-sm text-error">{errors.description}</p>}
                            </div>

                            {/* Cover Image */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-semibold text-dark dark:text-light">Cover Image</label>
                                <div className="rounded-lg border-2 border-dashed border-alpha/30 p-6 text-center transition-colors hover:border-alpha/50">
                                    {previewImage ? (
                                        <div className="relative">
                                            <img src={previewImage} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewImage(null);
                                                    setData('cover_image', null);
                                                }}
                                                className="absolute top-2 right-2 rounded-full bg-error p-1 text-light hover:bg-error/80"
                                            >
                                                <X size={16} />
                                            </button>
                                            <div className="absolute right-2 bottom-2 left-2">
                                                <label className="cursor-pointer rounded-lg bg-dark/70 px-3 py-1 text-sm text-light transition-colors hover:bg-dark/80">
                                                    Change Image
                                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="mx-auto mb-4 h-12 w-12 text-alpha/60" />
                                            <label className="cursor-pointer">
                                                <span className="font-semibold text-alpha">Click to upload</span>
                                                <span className="text-dark/70 dark:text-light/70"> or drag and drop</span>
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </label>
                                            <p className="mt-2 text-xs text-dark/60 dark:text-light/60">PNG, JPG, GIF up to 2MB</p>
                                        </div>
                                    )}
                                </div>
                                {errors.cover_image && <p className="mt-1 text-sm text-error">{errors.cover_image}</p>}
                            </div>
                        </div>

                        {/* Game Settings */}
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 dark:bg-dark">
                            <h2 className="mb-6 text-xl font-bold text-dark dark:text-light">Game Settings</h2>

                            {/* Time Limit */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-semibold text-dark dark:text-light">
                                    Time Limit per Question (seconds) *
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={data.time_limit}
                                    onChange={(e) => setData('time_limit', parseInt(e.target.value))}
                                    className="w-full rounded-lg border border-alpha/30 bg-light px-4 py-3 text-dark focus:border-alpha focus:ring-2 focus:ring-alpha/20 dark:bg-dark dark:text-light"
                                    required
                                />
                                <p className="mt-1 text-xs text-dark/60 dark:text-light/60">
                                    Students will have this many seconds to answer each question
                                </p>
                                {errors.time_limit && <p className="mt-1 text-sm text-error">{errors.time_limit}</p>}
                            </div>

                            {/* Show Correct Answers */}
                            <div className="mb-4">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={data.show_correct_answers}
                                        onChange={(e) => setData('show_correct_answers', e.target.checked)}
                                        className="h-5 w-5 rounded border-alpha/30 text-alpha focus:ring-alpha/20"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-dark dark:text-light">
                                            Show correct answers after each question
                                        </span>
                                        <p className="text-xs text-dark/60 dark:text-light/60">
                                            Students will see the correct answer after submitting their response
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-between pt-6">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center space-x-2 rounded-lg border border-alpha/30 px-6 py-3 transition-colors hover:bg-alpha/10"
                            >
                                <X size={16} />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center space-x-2 rounded-lg bg-alpha px-6 py-3 font-semibold text-black transition-colors hover:bg-alpha/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save size={16} />
                                <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Current Status */}
                <div className="mt-8 max-w-2xl">
                    <div className="rounded-2xl border border-alpha/20 bg-alpha/10 p-6">
                        <h3 className="mb-4 text-lg font-bold text-dark dark:text-light">Current Status</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="text-center">
                                <div className="mb-2 text-2xl">{geeko.status === 'ready' ? '✅' : '📝'}</div>
                                <div className="text-sm font-semibold text-dark dark:text-light">
                                    {geeko.status === 'ready' ? 'Ready to Play' : 'Draft Mode'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="mb-2 text-2xl">📝</div>
                                <div className="text-sm font-semibold text-dark dark:text-light">{geeko.questions?.length || 0} Questions</div>
                            </div>
                            <div className="text-center">
                                <div className="mb-2 text-2xl">🎮</div>
                                <div className="text-sm font-semibold text-dark dark:text-light">{geeko.sessions?.length || 0} Sessions Played</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                {geeko.status === 'ready' && (
                    <div className="mt-6 max-w-2xl">
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-lg text-yellow-500">⚠️</div>
                                <div>
                                    <h4 className="mb-1 font-semibold text-yellow-800">Note about editing ready games</h4>
                                    <p className="text-sm text-yellow-700">
                                        This Geeko is currently marked as "Ready" and can be played by students. Changes you make here will apply to
                                        future game sessions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
