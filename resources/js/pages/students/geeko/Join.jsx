import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Play, Users } from 'lucide-react';

export default function JoinGeeko() {
    const { data, setData, post, processing, errors } = useForm({
        session_code: '',
        nickname: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/geeko/join');
    };

    const handleCodeChange = (e) => {
        const value = e.target.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8);
        setData('session_code', value);
    };

    return (
        <AppLayout>
            <Head title="Join Geeko Game" />

            <div className="flex min-h-screen items-center justify-center bg-light p-6 dark:bg-dark">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <div className="mb-6 text-8xl">🎯</div>
                        <h1 className="mb-4 text-4xl font-extrabold text-dark dark:text-light">Join Geeko Game</h1>
                        <p className="text-lg text-dark/70 dark:text-light/70">Enter the game PIN provided by your instructor</p>
                    </div>

                    {/* Join Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="rounded-2xl border border-alpha/20 bg-light p-8 shadow-lg dark:bg-dark">
                            {/* Game PIN */}
                            <div className="mb-6">
                                <label className="mb-4 block text-center text-lg font-bold text-dark dark:text-light">Game PIN</label>
                                <input
                                    type="text"
                                    value={data.session_code}
                                    onChange={handleCodeChange}
                                    className="w-full rounded-xl border-2 border-alpha/30 bg-light px-6 py-4 text-center text-3xl font-bold tracking-wider text-dark placeholder-dark/40 focus:border-alpha focus:ring-4 focus:ring-alpha/20 dark:bg-dark dark:text-light dark:placeholder-light/40"
                                    placeholder="XXXXXXXX"
                                    maxLength={8}
                                    required
                                />
                                {errors.session_code && <p className="mt-3 text-center font-semibold text-error">{errors.session_code}</p>}
                                <p className="mt-3 text-center text-sm text-dark/60 dark:text-light/60">Enter the 8-character game PIN</p>
                            </div>

                            {/* Nickname (Optional) */}
                            <div className="mb-8">
                                <label className="mb-4 block text-center text-lg font-bold text-dark dark:text-light">Display Name (Optional)</label>
                                <input
                                    type="text"
                                    value={data.nickname}
                                    onChange={(e) => setData('nickname', e.target.value)}
                                    className="w-full rounded-xl border border-alpha/30 bg-light px-6 py-3 text-center text-xl text-dark focus:border-alpha focus:ring-2 focus:ring-alpha/20 dark:bg-dark dark:text-light"
                                    placeholder="Your display name"
                                    maxLength={50}
                                />
                                <p className="mt-2 text-center text-sm text-dark/60 dark:text-light/60">Leave empty to use your real name</p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing || data.session_code.length !== 8}
                                className="flex w-full items-center justify-center space-x-3 rounded-xl bg-alpha px-6 py-4 text-xl font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-alpha/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {processing ? (
                                    <>
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-dark border-t-transparent"></div>
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={24} />
                                        <span>Join Game</span>
                                        <ArrowRight size={24} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Help Section */}
                    <div className="mt-12 text-center">
                        <div className="rounded-2xl border border-alpha/20 bg-alpha/10 p-6">
                            <h3 className="mb-4 flex items-center justify-center space-x-2 text-lg font-bold text-dark dark:text-light">
                                <Users size={20} />
                                <span>How to Join</span>
                            </h3>
                            <div className="space-y-3 text-sm text-dark/70 dark:text-light/70">
                                <div className="flex items-start space-x-3">
                                    <span className="text-lg font-bold text-alpha">1</span>
                                    <span>Get the 8-character game PIN from your instructor</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="text-lg font-bold text-alpha">2</span>
                                    <span>Enter the PIN in the field above</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="text-lg font-bold text-alpha">3</span>
                                    <span>Optionally choose a display name</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="text-lg font-bold text-alpha">4</span>
                                    <span>Click "Join Game" and wait for the game to start!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-dark/50 dark:text-light/50">🔒 You can only join games from trainings you're enrolled in</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
