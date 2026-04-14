import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { SkipForward, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function QuestionResults({ session, question, answers = [], formationId, geekoId }) {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await fetch(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/live-data`);
                const data = await res.json();
                if (active) setLeaderboard(data.leaderboard || []);
            } catch {}
        };
        load();
        const id = setInterval(load, 2000);
        return () => {
            active = false;
            clearInterval(id);
        };
    }, [formationId, geekoId, session.id]);

    const handleNext = () => {
        router.post(`/training/${formationId}/geeko/${geekoId}/session/${session.id}/next-question`);
    };

    const top = leaderboard.slice(0, 10);

    return (
        <AppLayout>
            <Head title="Round Results" />
            <div className="min-h-screen p-6">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-extrabold text-dark dark:text-light">Round Results</h1>
                        <button onClick={handleNext} className="inline-flex items-center gap-2 rounded-lg bg-alpha px-4 py-2 font-semibold text-black">
                            <span>Next</span>
                            <SkipForward size={16} />
                        </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Question and options only (no ranks here) */}
                        <div className="rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl md:col-span-2 dark:bg-dark/50">
                            <h2 className="mb-4 text-lg font-bold text-dark dark:text-light">Question</h2>
                            <div className="mb-2 font-semibold text-dark dark:text-light">{question.question}</div>
                            <div className="mb-4 text-xs tracking-wider text-dark/60 uppercase dark:text-light/60">
                                {question.type.replace('_', ' ')}
                            </div>

                            {/* Options list */}
                            {Array.isArray(question.options) ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {question.options.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-white/20 bg-white/40 px-4 py-3 text-dark dark:bg-dark/40 dark:text-light"
                                        >
                                            <span className="mr-2 font-semibold">{String.fromCharCode(65 + idx)}.</span> {opt}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-dark/60 dark:text-light/60">No options</div>
                            )}

                            {/* Answers summary */}
                            <div className="mt-6">
                                <div className="flex items-center gap-2 text-sm text-dark/60 dark:text-light/60">
                                    <Users size={16} /> {answers.length} answers
                                </div>
                                <div className="mt-3 max-h-[260px] space-y-2 overflow-auto pr-2">
                                    {answers.map((a, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-lg border border-white/20 bg-white/40 p-3 dark:bg-dark/40"
                                        >
                                            <div className="text-sm text-dark dark:text-light">{a.user?.name}</div>
                                            <div className={`text-sm font-bold ${a.is_correct ? 'text-good' : 'text-error'}`}>
                                                {a.is_correct ? '+' : ''}
                                                {a.points_earned} pts
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
