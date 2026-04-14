import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, CheckCircle, Download, Trophy, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function SessionResults({ session, leaderboard, questionStats, formationId, geekoId }) {
    const [activeTab, setActiveTab] = useState('leaderboard');

    const handleBackToControl = () => {
        router.visit(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/control`);
    };

    const handleBackToGeeko = () => {
        router.visit(`/training/${formationId}/geeko/${geekoId}`);
    };

    const exportResults = () => {
        // TODO: Implement CSV export
        //alert('Export functionality coming soon!');
    };

    const calculateSessionStats = () => {
        const totalQuestions = session.geeko.questions?.length || 0;
        const totalParticipants = leaderboard.length;
        const totalAnswers = leaderboard.reduce((sum, p) => sum + p.correct_answers + p.wrong_answers, 0);
        const totalCorrect = leaderboard.reduce((sum, p) => sum + p.correct_answers, 0);
        const avgScore = totalParticipants > 0 ? leaderboard.reduce((sum, p) => sum + p.total_score, 0) / totalParticipants : 0;
        const avgAccuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

        return {
            totalQuestions,
            totalParticipants,
            avgScore: Math.round(avgScore),
            avgAccuracy: Math.round(avgAccuracy * 10) / 10,
            completionRate:
                totalParticipants > 0
                    ? Math.round((leaderboard.filter((p) => p.correct_answers + p.wrong_answers > 0).length / totalParticipants) * 100)
                    : 0,
        };
    };

    const stats = calculateSessionStats();

    const formatDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const duration = new Date(end) - new Date(start);
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return `#${rank}`;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'text-yellow-500';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-amber-600';
        return 'text-alpha';
    };

    return (
        <AppLayout>
            <Head title={`Results - ${session.geeko.title}`} />

            <div className="min-h-screen bg-light p-6 dark:bg-dark">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center space-x-4">
                        <button onClick={handleBackToControl} className="flex items-center space-x-2 font-semibold text-alpha hover:text-alpha/80">
                            <ArrowLeft size={20} />
                            <span>Control Panel</span>
                        </button>
                        <span className="text-dark/40 dark:text-light/40">|</span>
                        <button onClick={handleBackToGeeko} className="font-semibold text-alpha hover:text-alpha/80">
                            Back to Geeko
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold text-dark dark:text-light">Session Results</h1>
                            <p className="mt-2 text-dark/70 dark:text-light/70">
                                {session.geeko.title} - Completed {session.ended_at ? new Date(session.ended_at).toLocaleDateString() : 'Recently'}
                            </p>
                        </div>

                        <button
                            onClick={exportResults}
                            className="flex items-center space-x-2 rounded-lg border border-alpha/30 px-4 py-2 text-dark transition-colors hover:bg-alpha/10 dark:text-light"
                        >
                            <Download size={16} />
                            <span>Export Results</span>
                        </button>
                    </div>
                </div>

                {/* Session Overview */}
                <div className="mb-8 rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:bg-dark/50">
                    <h2 className="mb-6 text-xl font-bold text-dark dark:text-light">Session Overview</h2>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                        <div className="text-center">
                            <div className="mb-2 text-3xl font-bold text-alpha">{stats.totalParticipants}</div>
                            <div className="text-sm text-dark/70 dark:text-light/70">Participants</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl font-bold text-blue-500">{stats.avgScore}</div>
                            <div className="text-sm text-dark/70 dark:text-light/70">Avg Score</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl font-bold text-good">{stats.avgAccuracy}%</div>
                            <div className="text-sm text-dark/70 dark:text-light/70">Avg Accuracy</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl font-bold text-purple-500">{stats.completionRate}%</div>
                            <div className="text-sm text-dark/70 dark:text-light/70">Completion</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl font-bold text-orange-500">{formatDuration(session.started_at, session.ended_at)}</div>
                            <div className="text-sm text-dark/70 dark:text-light/70">Duration</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-alpha/20">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('leaderboard')}
                                className={`border-b-2 px-2 py-4 text-sm font-semibold transition-colors ${
                                    activeTab === 'leaderboard'
                                        ? 'border-alpha text-alpha'
                                        : 'border-transparent text-dark/70 hover:text-alpha dark:text-light/70'
                                }`}
                            >
                                <Trophy size={16} className="mr-2 inline" />
                                Leaderboard
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`border-b-2 px-2 py-4 text-sm font-semibold transition-colors ${
                                    activeTab === 'questions'
                                        ? 'border-alpha text-alpha'
                                        : 'border-transparent text-dark/70 hover:text-alpha dark:text-light/70'
                                }`}
                            >
                                <BarChart3 size={16} className="mr-2 inline" />
                                Question Analysis
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'leaderboard' && (
                    <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:bg-dark/50">
                        <h3 className="mb-6 text-xl font-bold text-dark dark:text-light">Final Leaderboard</h3>

                        {leaderboard.length > 0 ? (
                            <div className="space-y-4">
                                {leaderboard.map((participant, index) => (
                                    <div
                                        key={participant.id}
                                        className={`rounded-xl border p-6 transition-all ${
                                            index < 3 ? 'border-alpha/40 bg-alpha/5' : 'border-alpha/20 bg-alpha/2'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`text-2xl font-bold ${getRankColor(index + 1)}`}>{getRankBadge(index + 1)}</div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-alpha text-lg font-bold text-black">
                                                        {(participant.nickname || participant.user?.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-dark dark:text-light">
                                                            {participant.nickname || participant.user?.name || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-dark/60 dark:text-light/60">{participant.user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="mb-1 text-2xl font-bold text-alpha">{participant.total_score}</div>
                                                <div className="text-sm text-dark/70 dark:text-light/70">
                                                    {participant.correct_answers}/{participant.correct_answers + participant.wrong_answers} correct
                                                </div>
                                                <div className="text-xs text-dark/60 dark:text-light/60">
                                                    {participant.correct_answers + participant.wrong_answers > 0
                                                        ? Math.round(
                                                              (participant.correct_answers /
                                                                  (participant.correct_answers + participant.wrong_answers)) *
                                                                  100,
                                                          )
                                                        : 0}
                                                    % accuracy
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="mb-2 flex justify-between text-xs text-dark/60 dark:text-light/60">
                                                <span>Question Progress</span>
                                                <span>
                                                    {participant.correct_answers + participant.wrong_answers}/{stats.totalQuestions}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-alpha transition-all"
                                                    style={{
                                                        width: `${((participant.correct_answers + participant.wrong_answers) / stats.totalQuestions) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Users className="mx-auto mb-4 text-alpha/60" size={48} />
                                <p className="text-dark/60 dark:text-light/60">No participants in this session</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="space-y-6">
                        {questionStats.map((stat, index) => (
                            <div
                                key={stat.question.id}
                                className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow backdrop-blur-xl dark:bg-dark/50"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="mb-2 text-lg font-bold text-dark dark:text-light">Question {index + 1}</h3>
                                        <p className="line-clamp-2 text-dark/70 dark:text-light/70">{stat.question.question}</p>
                                    </div>
                                    <div className="ml-6 text-right">
                                        <div className="mb-1 text-2xl font-bold text-alpha">{Math.round(stat.accuracy)}%</div>
                                        <div className="text-sm text-dark/60 dark:text-light/60">Accuracy</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {/* Correct Answers */}
                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center space-x-2">
                                            <CheckCircle className="text-good" size={20} />
                                            <span className="text-lg font-bold text-good">{stat.correct_count}</span>
                                        </div>
                                        <div className="text-sm text-dark/70 dark:text-light/70">Correct</div>
                                    </div>

                                    {/* Wrong Answers */}
                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center space-x-2">
                                            <XCircle className="text-error" size={20} />
                                            <span className="text-lg font-bold text-error">{stat.wrong_count}</span>
                                        </div>
                                        <div className="text-sm text-dark/70 dark:text-light/70">Incorrect</div>
                                    </div>

                                    {/* Total Responses */}
                                    <div className="text-center">
                                        <div className="mb-2 flex items-center justify-center space-x-2">
                                            <Users className="text-blue-500" size={20} />
                                            <span className="text-lg font-bold text-blue-500">{stat.correct_count + stat.wrong_count}</span>
                                        </div>
                                        <div className="text-sm text-dark/70 dark:text-light/70">Total Responses</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-6">
                                    <div className="flex h-4 space-x-1 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="bg-good transition-all"
                                            style={{
                                                width: `${stat.correct_count + stat.wrong_count > 0 ? (stat.correct_count / (stat.correct_count + stat.wrong_count)) * 100 : 0}%`,
                                            }}
                                        ></div>
                                        <div
                                            className="bg-error transition-all"
                                            style={{
                                                width: `${stat.correct_count + stat.wrong_count > 0 ? (stat.wrong_count / (stat.correct_count + stat.wrong_count)) * 100 : 0}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Question Details */}
                                <div className="mt-4 border-t border-alpha/20 pt-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                        <div>
                                            <span className="text-dark/60 dark:text-light/60">Type:</span>
                                            <span className="ml-2 font-semibold text-dark dark:text-light">
                                                {stat.question.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-dark/60 dark:text-light/60">Points:</span>
                                            <span className="ml-2 font-semibold text-dark dark:text-light">{stat.question.points}</span>
                                        </div>
                                        <div>
                                            <span className="text-dark/60 dark:text-light/60">Time Limit:</span>
                                            <span className="ml-2 font-semibold text-dark dark:text-light">
                                                {stat.question.time_limit || session.geeko.time_limit}s
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-dark/60 dark:text-light/60">Difficulty:</span>
                                            <span className="ml-2 font-semibold text-dark dark:text-light">
                                                {stat.accuracy > 80 ? 'Easy' : stat.accuracy > 50 ? 'Medium' : 'Hard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
