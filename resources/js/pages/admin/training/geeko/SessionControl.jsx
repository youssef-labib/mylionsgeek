import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Check, Play, RefreshCw, Share2, SkipForward, StopCircle, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SessionControl({ session, formationId, geekoId }) {
    const [liveData, setLiveData] = useState({
        participants_count: session.participants?.length || 0,
        participants: session.participants || [],
        session_status: session.status,
        current_question: null,
    });
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [copiedPin, setCopiedPin] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [frozenLeaderboard, setFrozenLeaderboard] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [questionEnded, setQuestionEnded] = useState(false);
    const [showEndAlerts, setShowEndAlerts] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showPodium, setShowPodium] = useState(false);
    const [podium, setPodium] = useState([]);
    const [revealThird, setRevealThird] = useState(false);
    const [revealSecond, setRevealSecond] = useState(false);
    const [revealFirst, setRevealFirst] = useState(false);
    const lastQuestionIdRef = useRef(null);
    const [animatedScores, setAnimatedScores] = useState({});

    // Small inline odometer-style digit component
    const DigitOdometer = ({ value }) => {
        const digits = String(value ?? 0).split('');
        return (
            <div className="flex items-center gap-0.5">
                {digits.map((d, i) => (
                    <div key={i} className="h-6 w-4 overflow-hidden rounded-sm bg-alpha/10">
                        <div
                            className="text-center font-extrabold text-alpha tabular-nums transition-transform duration-500 ease-out will-change-transform"
                            style={{ transform: `translateY(-${Number(d) * 24}px)` }}
                        >
                            {Array.from({ length: 10 }).map((_, n) => (
                                <div key={n} className="h-6 leading-6">
                                    {n}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Poll for live updates
    useEffect(() => {
        if (!autoRefresh) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/live-data`);
                const data = await response.json();
                const inProgress = (data.session?.status || session.status) === 'in_progress';
                setLiveData({
                    participants_count: data.participants_count,
                    participants: data.session?.participants || [],
                    session_status: data.session?.status || session.status,
                    current_question: data.current_question || null,
                    should_end_question: data.should_end_question || false,
                    option_counts: data.option_counts || [],
                    current_answer_count: data.current_answer_count || 0,
                    progress: data.progress || liveData.progress,
                });

                // Reset end alerts and leaderboard toggle when question changes
                const currentQuestionId = data.current_question ? data.current_question.id : null;
                if (currentQuestionId !== lastQuestionIdRef.current) {
                    lastQuestionIdRef.current = currentQuestionId;
                    setShowEndAlerts(false);
                    setShowLeaderboard(false);
                }

                // Timer calculation: derive time left using server timestamps
                if (inProgress && data.current_question && (data.session?.current_question_started_at || data.current_question_started_at)) {
                    const startedAt = new Date(data.session?.current_question_started_at || data.current_question_started_at);
                    const limit = data.current_question.time_limit ?? data.session?.geeko?.time_limit;
                    if (limit != null) {
                        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
                        let remaining = Math.max(0, limit - elapsed);
                        // If server indicates all answered, force timer to 0 immediately
                        if (data.should_end_question) {
                            remaining = 0;
                        }
                        setTimeLeft(remaining);
                        const allAnswered = (data.current_answer_count || 0) >= (data.participants_count || 0) && (data.participants_count || 0) > 0;
                        const ended = remaining === 0 || !!data.should_end_question || allAnswered;
                        setQuestionEnded(ended);
                        if (ended) {
                            if (!showEndAlerts) setShowEndAlerts(true);
                        }
                    } else {
                        setTimeLeft(null);
                        const allAnswered = (data.current_answer_count || 0) >= (data.participants_count || 0) && (data.participants_count || 0) > 0;
                        const ended = !!data.should_end_question || allAnswered;
                        setQuestionEnded(ended);
                        if (ended) {
                            if (!showEndAlerts) setShowEndAlerts(true);
                        }
                    }
                } else {
                    setTimeLeft(null);
                    setQuestionEnded(false);
                }
            } catch (error) {
                console.error('Failed to fetch live data:', error);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [autoRefresh, formationId, geekoId, session.id]);

    const handleStartGame = () => {
        runCountdownThen(5, () => {
            router.post(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/start`);
        });
    };

    const handleNextQuestion = () => {
        runCountdownThen(5, () => {
            router.post(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/next-question`);
        });
    };

    const handleCancelGame = () => {
        if (confirm('Stop and cancel this game?')) {
            router.post(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/cancel`);
        }
    };

    const copyGamePin = async () => {
        try {
            await navigator.clipboard.writeText(session.session_code);
            setCopiedPin(true);
            setTimeout(() => setCopiedPin(false), 1500);
        } catch (e) {}
    };

    const copyGameLink = async () => {
        try {
            const link = `${window.location.origin}/geeko/${session.session_code}`;
            await navigator.clipboard.writeText(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 1500);
        } catch (e) {}
    };

    const refreshLeaderboardOnce = async () => {
        try {
            const response = await fetch(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/live-data`);
            const data = await response.json();
            if (Array.isArray(data.leaderboard)) {
                setFrozenLeaderboard(data.leaderboard);
            }
        } catch (e) {}
    };

    // Countdown helper to show overlay and execute action after N seconds
    const runCountdownThen = (seconds, action) => {
        // If last question, skip countdown
        const total = liveData?.progress?.total || session.geeko?.questions?.length || 0;
        const current = liveData?.progress?.current || session.current_question_index + 1;
        if (current >= total) {
            action?.();
            return;
        }
        setShowCountdown(true);
        setCountdown(seconds);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setShowCountdown(false);
                    action?.();
                }
                return prev - 1;
            });
        }, 1000);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'waiting':
                return 'Waiting to Start';
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    return (
        <AppLayout>
            <Head title={`Control Panel - ${session.geeko.title}`} />

            <div className="min-h-screen bg-gray-50/50 dark:bg-dark/30">
                {liveData.session_status !== 'in_progress' && (
                    <div className="border-b border-alpha/5 bg-white/80 backdrop-blur-sm dark:bg-dark/80">
                        <div className="mx-auto max-w-6xl px-4">
                            <div className="flex h-14 items-center justify-between">
                                <button
                                    onClick={() => router.visit(`/training/${formationId}/geeko/${geekoId}`)}
                                    className="flex items-center space-x-1 text-sm text-dark/50 transition-colors hover:text-alpha dark:text-light/50"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Back</span>
                                </button>

                                <div className="flex items-center space-x-3 text-xs text-dark/60 dark:text-light/60">
                                    <span
                                        className={`rounded-md px-2 py-1 ${
                                            session.status === 'waiting'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : session.status === 'in_progress'
                                                  ? 'bg-green-100 text-green-700'
                                                  : session.status === 'completed'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {getStatusText(session.status)}
                                    </span>
                                    <button
                                        onClick={() => setAutoRefresh(!autoRefresh)}
                                        className={`rounded-md p-2 ${autoRefresh ? 'bg-good text-light' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        title={autoRefresh ? 'Auto-refresh enabled' : 'Enable auto-refresh'}
                                    >
                                        <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="pb-3">
                                <h1 className="text-lg font-medium text-dark dark:text-light">{session.geeko.title}</h1>
                                <div className="text-xs text-dark/50 dark:text-light/50">{liveData.participants_count} participants</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mx-auto max-w-6xl px-4 py-6">
                    {/* PIN + Share (hide when game in progress) */}
                    {liveData.session_status !== 'in_progress' && (
                        <div className="mb-6 rounded-xl border border-alpha/10 bg-white p-5 dark:bg-dark">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={copyGamePin}
                                        className="cursor-pointer text-3xl font-extrabold tracking-widest text-alpha select-none"
                                    >
                                        {session.session_code}
                                    </button>
                                    {copiedPin && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
                                            <Check size={12} /> Copied
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={copyGamePin}
                                        className="inline-flex items-center gap-1 rounded-md bg-alpha px-3 py-2 text-xs font-semibold text-black hover:bg-alpha/90"
                                    >
                                        <Share2 size={12} />
                                        <span>Copy PIN</span>
                                    </button>
                                    <button
                                        onClick={copyGameLink}
                                        className="inline-flex items-center gap-1 rounded-md border border-alpha/30 px-3 py-2 text-xs font-semibold text-dark hover:bg-alpha/10 dark:text-light"
                                    >
                                        <Share2 size={12} />
                                        <span>Copy Link</span>
                                    </button>
                                    {copiedLink && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
                                            <Check size={12} /> Copied
                                        </span>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                        {session.status === 'waiting' && (
                                            <button
                                                onClick={handleStartGame}
                                                className="inline-flex items-center gap-2 rounded-lg bg-good px-5 py-2 font-semibold text-light hover:bg-good/90"
                                            >
                                                <Play size={16} />
                                                <span>Start</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* In-progress control: Stop only */}
                    {liveData.session_status === 'in_progress' && (
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={handleCancelGame}
                                className="inline-flex items-center gap-2 rounded-lg border border-error/30 px-5 py-2 font-semibold text-error hover:bg-error/10"
                            >
                                <StopCircle size={16} />
                                <span>Stop</span>
                            </button>
                        </div>
                    )}

                    {/* Current Question (TV view) */}
                    {liveData.session_status === 'in_progress' && liveData.current_question && !showLeaderboard && !showPodium && (
                        <div className="mb-6 rounded-xl border border-alpha/10 bg-white p-8 dark:bg-dark">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm text-dark/60 dark:text-light/60">Question</div>
                                <div className="flex items-center gap-2">
                                    {timeLeft !== null && !questionEnded && (
                                        <div
                                            className={`rounded-md px-3 py-1 text-sm font-semibold ${timeLeft <= 5 ? 'bg-error/10 text-error' : 'bg-alpha/10 text-alpha'}`}
                                        >
                                            {timeLeft}s
                                        </div>
                                    )}
                                    <div className="rounded-md bg-alpha/10 px-2 py-1 text-xs font-semibold text-alpha">
                                        {liveData.current_answer_count}/{liveData.participants_count}
                                    </div>
                                </div>
                            </div>
                            {questionEnded && (
                                <div className="mb-4 flex items-center gap-2 text-sm">
                                    <span className="rounded-md bg-good/10 px-2 py-1 font-semibold text-good">Done</span>
                                    {liveData?.progress?.current >= liveData?.progress?.total ? (
                                        <button
                                            onClick={async () => {
                                                // Show podium after last question
                                                setShowPodium(true);
                                                setShowLeaderboard(false);
                                                try {
                                                    const data = await fetch(
                                                        `/training/${formationId}/geeko/${geekoId}/session/${session.id}/live-data`,
                                                    ).then((r) => r.json());
                                                    let lb = Array.isArray(data.leaderboard) ? data.leaderboard.slice() : [];
                                                    lb.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
                                                    const top3 = lb.slice(0, 3);
                                                    setPodium(top3);
                                                    // Reveal with suspense: 3rd, then 2nd, then 1st
                                                    setRevealThird(false);
                                                    setRevealSecond(false);
                                                    setRevealFirst(false);
                                                    setTimeout(() => setRevealThird(true), 300);
                                                    setTimeout(() => setRevealSecond(true), 1100);
                                                    setTimeout(() => setRevealFirst(true), 1900);
                                                } catch (e) {}
                                            }}
                                            className="rounded-md border border-alpha/30 px-2 py-1 hover:bg-alpha/10"
                                        >
                                            Show podium
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                setShowLeaderboard(true);
                                                // wait 2s then refresh and animate scores (odometer-style digits) only for changed scores
                                                const prevScores = {};
                                                frozenLeaderboard.forEach((p) => {
                                                    prevScores[p.id] = p.total_score || 0;
                                                });
                                                setTimeout(async () => {
                                                    try {
                                                        const data = await fetch(
                                                            `/training/${formationId}/geeko/${geekoId}/session/${session.id}/live-data`,
                                                        ).then((r) => r.json());
                                                        if (Array.isArray(data.leaderboard)) {
                                                            const targets = {};
                                                            data.leaderboard.forEach((p) => {
                                                                targets[p.id] = p.total_score || 0;
                                                            });
                                                            // Seed display with previous scores
                                                            setAnimatedScores(prevScores);
                                                            setFrozenLeaderboard(data.leaderboard);
                                                            const duration = 1000;
                                                            const start = performance.now();
                                                            const animate = (t) => {
                                                                const progress = Math.min(1, (t - start) / duration);
                                                                const next = {};
                                                                Object.keys(targets).forEach((id) => {
                                                                    const from = prevScores[id] ?? 0;
                                                                    const to = targets[id];
                                                                    // Only animate if score changed; otherwise keep constant
                                                                    next[id] = to !== from ? Math.round(from + (to - from) * progress) : to;
                                                                });
                                                                setAnimatedScores(next);
                                                                if (progress < 1) requestAnimationFrame(animate);
                                                            };
                                                            requestAnimationFrame(animate);
                                                        }
                                                    } catch (e) {}
                                                }, 2000);
                                            }}
                                            className="rounded-md border border-alpha/30 px-2 py-1 hover:bg-alpha/10"
                                        >
                                            Show leaderboard
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="mb-6 text-4xl leading-tight font-extrabold text-dark md:text-5xl dark:text-light">
                                {liveData.current_question.question}
                            </div>
                            {Array.isArray(liveData.current_question.options) && !showLeaderboard && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {liveData.current_question.options.map((opt, idx) => {
                                        // 🎨 Harmonized color palette — no alpha, visually balanced
                                        const palette = ['bg-alpha/2.5 border-amber-300/60'];
                                        const baseColor = palette[idx % palette.length];

                                        const correctAnswers = liveData.current_question.correct_answers;
                                        const isCorrect =
                                            Array.isArray(correctAnswers) &&
                                            (correctAnswers.includes(idx) || correctAnswers.includes(opt) || correctAnswers.includes(String(opt)));

                                        // ✅ Visual logic:
                                        // - Before end → soft colored background
                                        // - After end → highlight correct, fade wrong
                                        const endedClass = questionEnded
                                            ? isCorrect
                                                ? 'bg-alpha border-alpha text-black ring-2 ring-alpha' // ✅ full alpha highlight, black text for contrast
                                                : 'opacity-50'
                                            : '';

                                        const count = Array.isArray(liveData.option_counts) ? liveData.option_counts[idx] || 0 : 0;
                                        const showCount = questionEnded;

                                        return (
                                            <div
                                                key={idx}
                                                className={`rounded-2xl border p-5 text-lg font-semibold text-dark transition-all duration-300 md:text-xl dark:text-light ${questionEnded ? endedClass : baseColor}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`mr-2 font-bold ${isCorrect && questionEnded ? 'text-black' : 'text-alpha'}`}
                                                        >
                                                            {String.fromCharCode(65 + idx)}.
                                                        </span>
                                                        <span className={`${isCorrect && questionEnded ? 'text-black' : ''}`}>
                                                            {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                                                        </span>
                                                    </div>
                                                    {showCount && (
                                                        <span
                                                            className={`text-sm font-bold ${
                                                                isCorrect && questionEnded ? 'text-black' : 'text-dark/60 dark:text-light/60'
                                                            }`}
                                                        >
                                                            {count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {questionEnded && !showLeaderboard && (
                                <div className="mt-4 text-sm text-dark/60 dark:text-light/60">
                                    <span className="font-semibold">Correct answer: </span>
                                    {Array.isArray(liveData.current_question.correct_answers)
                                        ? liveData.current_question.correct_answers.join(', ')
                                        : String(liveData.current_question.correct_answers ?? '')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Participants / Leaderboard Panel */}
                    {liveData.session_status !== 'in_progress' ? (
                        <div className="rounded-xl border border-alpha/10 bg-white p-5 dark:bg-dark">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-base font-semibold text-dark dark:text-light">
                                    <Users size={16} className="text-alpha" /> Participants
                                    <span className="text-xs text-dark/50 dark:text-light/50">({liveData.participants_count})</span>
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-dark/50 dark:text-light/50">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                                    <span>Live</span>
                                </div>
                            </div>

                            {liveData.participants && liveData.participants.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {liveData.participants.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 rounded-xl bg-alpha/5 p-3 transition-colors hover:bg-alpha/10"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-alpha font-bold text-black">
                                                {(p.nickname || p.user?.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-dark dark:text-light">
                                                    {p.nickname || p.user?.name}
                                                </div>
                                                <div className="text-[11px] text-dark/50 dark:text-light/50">ready</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Users className="mx-auto mb-2 text-alpha/40" size={28} />
                                    <p className="text-sm text-dark/60 dark:text-light/60">No participants yet. Share the PIN!</p>
                                </div>
                            )}
                        </div>
                    ) : showPodium ? (
                        <div className="rounded-xl border border-alpha/10 bg-white p-8 dark:bg-dark">
                            <h3 className="mb-6 text-lg font-bold text-dark dark:text-light">Podium</h3>
                            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                {/* 3rd */}
                                <div
                                    className={`transform transition-all duration-700 ${revealThird ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                                >
                                    {podium[2] && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow dark:border-amber-800 dark:bg-amber-900/20">
                                            <div className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-300">3rd</div>
                                            <div className="text-lg font-bold text-dark dark:text-light">
                                                {podium[2].nickname || podium[2].user?.name}
                                            </div>
                                            <div className="mt-2 text-xl font-extrabold text-alpha">{podium[2].total_score}</div>
                                        </div>
                                    )}
                                </div>
                                {/* 1st */}
                                <div
                                    className={`transform transition-all delay-200 duration-700 ${revealFirst ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                                >
                                    {podium[0] && (
                                        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-8 text-center shadow-lg dark:border-yellow-700 dark:bg-yellow-900/20">
                                            <div className="mb-2 text-sm font-semibold text-yellow-700 dark:text-yellow-300">1st</div>
                                            <div className="text-xl font-extrabold text-dark dark:text-light">
                                                {podium[0].nickname || podium[0].user?.name}
                                            </div>
                                            <div className="mt-2 text-2xl font-black text-alpha">{podium[0].total_score}</div>
                                        </div>
                                    )}
                                </div>
                                {/* 2nd */}
                                <div
                                    className={`transform transition-all delay-100 duration-700 ${revealSecond ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                                >
                                    {podium[1] && (
                                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center shadow dark:border-gray-700 dark:bg-gray-900/20">
                                            <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">2nd</div>
                                            <div className="text-lg font-bold text-dark dark:text-light">
                                                {podium[1].nickname || podium[1].user?.name}
                                            </div>
                                            <div className="mt-2 text-xl font-extrabold text-alpha">{podium[1].total_score}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => router.visit(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/results`)}
                                    className="rounded-md border border-alpha/30 px-3 py-2 text-sm hover:bg-alpha/10"
                                >
                                    View analytics
                                </button>
                            </div>
                        </div>
                    ) : showLeaderboard ? (
                        <div className="rounded-xl border border-alpha/10 bg-white p-5 dark:bg-dark">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-dark dark:text-light">Leaderboard</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={refreshLeaderboardOnce}
                                        className={`rounded-md border border-alpha/30 px-3 py-1.5 text-xs hover:bg-alpha/10`}
                                    >
                                        Refresh
                                    </button>
                                    {questionEnded && (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="inline-flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs text-light hover:bg-blue-600"
                                        >
                                            <SkipForward size={12} /> Next
                                        </button>
                                    )}
                                </div>
                            </div>
                            {questionEnded && frozenLeaderboard && frozenLeaderboard.length > 0 ? (
                                <div className="space-y-2">
                                    {frozenLeaderboard.slice(0, 10).map((p, idx) => (
                                        <div
                                            key={p.id || idx}
                                            className="flex items-center justify-between rounded-lg border border-alpha/10 bg-white/70 p-3 transition-all duration-500 dark:bg-dark/60"
                                            style={{ transform: 'translateY(0)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${idx === 0 ? 'bg-yellow-300 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-500 text-amber-900' : 'bg-alpha/20 text-alpha'}`}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div className="text-sm font-semibold text-dark dark:text-light">{p.nickname || p.user?.name}</div>
                                            </div>
                                            <div className="text-base font-extrabold text-alpha tabular-nums">
                                                <DigitOdometer value={animatedScores[p.id] ?? p.total_score} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-sm text-dark/60 dark:text-light/60">
                                    Leaderboard will appear when time is up
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Countdown Overlay */}
                {showCountdown && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-dark/70 backdrop-blur-sm"></div>
                        <div className="relative z-10 select-none">
                            <div className="text-8xl font-extrabold text-light drop-shadow-xl md:text-9xl">{Math.max(countdown, 1)}</div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
