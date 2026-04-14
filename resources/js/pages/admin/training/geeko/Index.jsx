import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Clock, Edit3, Play, Plus, Settings, Trash2, Trophy, Users } from 'lucide-react';
import { useState } from 'react';

export default function GeekoIndex({ formation, geekos }) {
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleCreateGeeko = () => {
        router.visit(`/training/${formation.id}/geeko/create`);
    };

    const handleEditGeeko = (geekoId) => {
        router.visit(`/training/${formation.id}/geeko/${geekoId}/edit`);
    };

    const handleViewGeeko = (geekoId) => {
        router.visit(`/training/${formation.id}/geeko/${geekoId}`);
    };

    const handleDeleteGeeko = (geekoId) => {
        router.delete(`/training/${formation.id}/geeko/${geekoId}`, {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const handleStartSession = (geekoId) => {
        router.post(`/training/${formation.id}/geeko/${geekoId}/session/create`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-500';
            case 'ready':
                return 'bg-alpha';
            case 'published':
                return 'bg-good';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'draft':
                return 'Draft';
            case 'ready':
                return 'Ready';
            case 'published':
                return 'Published';
            default:
                return status;
        }
    };

    return (
        <AppLayout>
            <Head title={`Geeko - ${formation.name}`} />

            <div className="min-h-screen bg-light p-6 dark:bg-dark">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="mb-2 flex items-center space-x-3">
                            <button
                                onClick={() => router.visit(`/trainings/${formation.id}`)}
                                className="font-semibold text-alpha hover:text-alpha/80"
                            >
                                ← {formation.name}
                            </button>
                        </div>
                        <h1 className="text-4xl font-extrabold text-dark dark:text-light">Geeko Games</h1>
                        <p className="mt-2 text-dark/70 dark:text-light/70">Create and manage interactive quiz games for your students</p>
                    </div>
                    <button
                        onClick={handleCreateGeeko}
                        className="flex items-center space-x-2 rounded-xl bg-alpha px-6 py-3 font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-alpha/90"
                    >
                        <Plus size={20} />
                        <span>Create New Geeko</span>
                    </button>
                </div>

                {/* Stats Cards */}
                {geekos.length > 0 && (
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 text-center dark:bg-dark">
                            <div className="mb-2 text-3xl font-bold text-alpha">{geekos.length}</div>
                            <div className="font-semibold text-dark/70 dark:text-light/70">Total Geekos</div>
                        </div>
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 text-center dark:bg-dark">
                            <div className="mb-2 text-3xl font-bold text-good">{geekos.filter((g) => g.status === 'ready').length}</div>
                            <div className="font-semibold text-dark/70 dark:text-light/70">Ready to Play</div>
                        </div>
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 text-center dark:bg-dark">
                            <div className="mb-2 text-3xl font-bold text-blue-500">
                                {geekos.reduce((total, g) => total + (g.questions?.length || 0), 0)}
                            </div>
                            <div className="font-semibold text-dark/70 dark:text-light/70">Total Questions</div>
                        </div>
                        <div className="rounded-2xl border border-alpha/20 bg-light p-6 text-center dark:bg-dark">
                            <div className="mb-2 text-3xl font-bold text-purple-500">
                                {geekos.reduce((total, g) => total + (g.sessions?.length || 0), 0)}
                            </div>
                            <div className="font-semibold text-dark/70 dark:text-light/70">Total Sessions</div>
                        </div>
                    </div>
                )}

                {/* Geekos Grid */}
                {geekos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {geekos.map((geeko) => (
                            <div
                                key={geeko.id}
                                className="rounded-2xl border border-alpha/20 bg-light p-6 transition-all duration-300 hover:border-alpha/40 hover:shadow-lg dark:bg-dark"
                            >
                                {/* Status Badge */}
                                <div className="mb-4 flex items-start justify-between">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold text-light ${getStatusColor(geeko.status)}`}>
                                        {getStatusText(geeko.status)}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditGeeko(geeko.id)}
                                            className="rounded-lg border border-alpha/30 p-2 transition-colors hover:bg-alpha/10"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(geeko.id)}
                                            className="rounded-lg border border-error/30 p-2 text-error transition-colors hover:bg-error/10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Cover Image */}
                                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-alpha/20 to-alpha/40">
                                    {geeko.cover_image ? (
                                        <img
                                            src={`/storage/${geeko.cover_image}`}
                                            alt={geeko.title}
                                            className="h-full w-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="text-2xl font-bold text-alpha">QUIZ</div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <h3 className="line-clamp-2 text-xl font-bold text-dark dark:text-light">{geeko.title}</h3>

                                    {geeko.description && <p className="line-clamp-2 text-sm text-dark/70 dark:text-light/70">{geeko.description}</p>}

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center space-x-2 text-dark/70 dark:text-light/70">
                                            <Users size={14} />
                                            <span>{geeko.questions?.length || 0} Questions</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-dark/70 dark:text-light/70">
                                            <Clock size={14} />
                                            <span>{geeko.time_limit}s per Q</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-dark/70 dark:text-light/70">
                                            <Play size={14} />
                                            <span>{geeko.sessions?.length || 0} Sessions</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-dark/70 dark:text-light/70">
                                            <Trophy size={14} />
                                            <span>By {geeko.creator?.name}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-2 pt-3">
                                        <button
                                            onClick={() => handleViewGeeko(geeko.id)}
                                            className="flex flex-1 items-center justify-center space-x-2 rounded-lg border border-alpha/30 px-4 py-2 text-dark transition-colors hover:bg-alpha/10 dark:text-light"
                                        >
                                            <Settings size={16} />
                                            <span>Manage</span>
                                        </button>

                                        {geeko.status === 'ready' && (
                                            <button
                                                onClick={() => handleStartSession(geeko.id)}
                                                className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-alpha px-4 py-2 font-semibold text-black transition-colors hover:bg-alpha/90"
                                            >
                                                <Play size={16} />
                                                <span>Start Game</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-alpha/20">
                            <span className="text-4xl font-bold text-alpha">QUIZ</span>
                        </div>
                        <h3 className="mb-4 text-2xl font-bold text-dark dark:text-light">No Geeko Games Yet</h3>
                        <p className="mx-auto mb-8 max-w-md text-dark/70 dark:text-light/70">
                            Create your first interactive quiz game to engage your students with fun learning experiences.
                        </p>
                        <button
                            onClick={handleCreateGeeko}
                            className="inline-flex items-center space-x-2 rounded-xl bg-alpha px-8 py-4 font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-alpha/90"
                        >
                            <Plus size={20} />
                            <span>Create Your First Geeko</span>
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
                        <div className="mx-4 w-full max-w-md rounded-2xl border border-alpha/20 bg-light p-6 dark:bg-dark">
                            <h3 className="mb-4 text-xl font-bold text-dark dark:text-light">Delete Geeko Game</h3>
                            <p className="mb-6 text-dark/70 dark:text-light/70">
                                Are you sure you want to delete this Geeko? This action cannot be undone and will remove all associated questions and
                                session data.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 rounded-lg border border-alpha/30 px-4 py-2 transition-colors hover:bg-alpha/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteGeeko(confirmDelete)}
                                    className="flex-1 rounded-lg bg-error px-4 py-2 text-light transition-colors hover:bg-error/90"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
