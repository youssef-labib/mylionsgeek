import { Dialog, DialogContent } from '@/components/ui/dialog';

const GeekyWheel = ({
    showGeekyWheel,
    setShowGeekyWheel,
    spinWheel,
    wheelRotation,
    isSpinning,
    wheelParticipants,
    showWinnerModal,
    setShowWinnerModal,
    selectedWinner,
    continueSpinning,
    resetWheel,
    removeWinner,
}) => {
    return (
        <div>
            {/* Geeky Wheel Modal */}
            <Dialog open={showGeekyWheel} onOpenChange={setShowGeekyWheel}>
                <DialogContent className="flex max-w-[95vw] items-center border-0 bg-transparent lg:p-8">
                    <div className="mt-6 flex flex-col items-center space-y-6">
                        {/* Wheel Container */}
                        <div className="relative">
                            {/* Pointer - positioned at 9 o'clock (left side) - reversed */}
                            <div className="absolute top-1/2 left-0 z-10 -translate-x-6 -translate-y-1/2 transform">
                                <div className="h-0 w-0 border-t-[20px] border-b-[20px] border-l-[40px] border-t-transparent border-b-transparent border-l-alpha drop-shadow-lg"></div>
                            </div>

                            {/* Wheel */}
                            <div
                                className={`relative h-full w-[400px] cursor-pointer transition-all duration-300 lg:h-[500px] lg:w-[500px] ${!isSpinning ? 'hover:scale-105' : ''} ${isSpinning ? 'cursor-not-allowed' : ''}`}
                                onClick={spinWheel}
                            >
                                <svg
                                    className="h-full w-full drop-shadow-2xl"
                                    style={{
                                        transform: `rotate(${wheelRotation}deg)`,
                                        transition: isSpinning ? 'transform 5s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.3s ease',
                                    }}
                                    viewBox="0 0 200 200"
                                >
                                    {wheelParticipants.map((participant, index) => {
                                        const angle = (360 / wheelParticipants.length) * index;
                                        const nextAngle = (360 / wheelParticipants.length) * (index + 1);
                                        const midAngle = (angle + nextAngle) / 2;

                                        // Alternating colors
                                        const isYellow = index % 2 === 0;
                                        const color = isYellow ? '#ffc801' : '#171717';

                                        // Calculate path for segment
                                        const startAngleRad = (angle * Math.PI) / 180;
                                        const endAngleRad = (nextAngle * Math.PI) / 180;
                                        const largeArcFlag = nextAngle - angle <= 180 ? '0' : '1';

                                        const x1 = 100 + 85 * Math.cos(startAngleRad);
                                        const y1 = 100 + 85 * Math.sin(startAngleRad);
                                        const x2 = 100 + 85 * Math.cos(endAngleRad);
                                        const y2 = 100 + 85 * Math.sin(endAngleRad);

                                        const pathData = [`M 100 100`, `L ${x1} ${y1}`, `A 85 85 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(' ');

                                        // Text position
                                        const textAngleRad = (midAngle * Math.PI) / 180;
                                        const textX = 100 + 55 * Math.cos(textAngleRad);
                                        const textY = 100 + 55 * Math.sin(textAngleRad);

                                        return (
                                            <g key={participant.id}>
                                                <path
                                                    d={pathData}
                                                    fill={color}
                                                    stroke="#fff"
                                                    strokeWidth="1"
                                                    className="transition-all duration-200"
                                                />
                                                <text
                                                    x={textX}
                                                    y={textY}
                                                    fill={isYellow ? '#000000' : '#ffffff'}
                                                    fontSize="6"
                                                    // fontWeight=""
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                                                >
                                                    {participant.name}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Center circle */}
                                    <circle cx="100" cy="100" r="18" fill="#171717" stroke="#ffc801" strokeWidth="3" />
                                    <circle cx="100" cy="100" r="8" fill="#ffc801" />
                                </svg>
                            </div>
                        </div>

                        {/* Participants Count */}
                        <div className="mt-6 text-center">
                            <p className="text-lg font-semibold text-dark dark:text-light">
                                Participants remaining: <span className="text-2xl font-bold text-alpha">{wheelParticipants.length}</span>
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Winner Modal */}
            <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
                <DialogContent className="max-w-md border border-alpha/20 bg-light dark:bg-dark">
                    {selectedWinner && (
                        <div className="mt-6 text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-alpha text-3xl font-bold text-black">
                                    {selectedWinner.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-dark dark:text-light">{selectedWinner.name}</p>
                                    <p className="font-semibold text-alpha">Congratulations!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col space-y-3">
                        <button
                            onClick={continueSpinning}
                            className="w-full rounded-xl bg-alpha px-6 py-3 text-lg font-bold text-black transition-all duration-300 hover:bg-alpha/90"
                        >
                            Continue Spinning
                        </button>

                        <button
                            onClick={removeWinner}
                            className="w-full rounded-xl bg-error px-6 py-3 text-lg font-bold text-light transition-all duration-300 hover:bg-error/90"
                        >
                            Remove Winner
                        </button>

                        <button
                            onClick={resetWheel}
                            className="w-full rounded-xl border border-alpha/30 px-6 py-3 text-lg font-bold text-dark transition-all duration-300 hover:bg-alpha/10 dark:text-light"
                        >
                            Reset Wheel
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GeekyWheel;
