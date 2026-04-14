import { Calendar } from 'lucide-react';

const BoardHeader = ({ fetchLeaderboardData, isRefreshing, fetchPreviousWeekPodium }) => {
    return (
        <>
            {/* Header Section */}
            <div className="mb-12 text-center">
                <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row">
                    <div className="flex gap-4">
                        {/* <div className="p-4 bg-gradient-to-br from-yellow-400 via-alpha to-alpha rounded-2xl shadow-2xl">
                            <Trophy className="w-10 h-10 text-dark" />
                        </div> */}
                        {/* <div className="text-left">
                            <h1 className="text-3xl font-bold text-alpha mb-2">
                                Wakatime Leaderboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-l">Track coding activity and compete with peers</p>
                        </div> */}
                    </div>

                    {/* <div className="flex items-center gap-4">
                        <button
                            onClick={fetchLeaderboardData}
                            disabled={isRefreshing}
                            className="flex items-center gap-3 px-6 py-3 bg-alpha text-black rounded-xl hover:bg-alpha/80 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 font-semibold"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div> */}

                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={fetchPreviousWeekPodium}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-alpha)] bg-[var(--color-alpha)] px-4 py-2 text-black transition-colors hover:bg-transparent hover:text-[var(--color-alpha)]"
                        >
                            <Calendar className="h-4 w-4" />
                            Previous week podium
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BoardHeader;
